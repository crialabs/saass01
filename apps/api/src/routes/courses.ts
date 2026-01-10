import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type {
  CreateCourseInput,
  QueryCoursesInput,
  UpdateCourseInput,
} from '@repo/packages-types/course';
import { PaginatedResponseSchema } from '@repo/packages-types/pagination';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';
import { buildPaginationResponse, buildPrismaQuery } from '@/utils/pagination';

const CourseLevelSchema = z.enum(['tecnico', 'graduacao', 'pos_graduacao']);
const CourseGradeSchema = z.enum(['tecnologo', 'bacharelado', 'licenciatura']);
const CourseModalitySchema = z.enum(['presencial', 'ead', 'hibrido']);
const CourseStatusSchema = z.enum(['rascunho', 'publicado', 'arquivado']);

const CreateCourseBodySchema = z.object({
  codigo: z.string().min(1),
  nome: z.string().min(1),
  descricao: z.string().optional(),
  descricaoCurta: z.string().optional(),
  cargaHorariaTotal: z.number().int().positive(),
  cargaHorariaMinima: z.number().int().positive().optional(),
  nivel: CourseLevelSchema,
  grau: CourseGradeSchema.optional(),
  duracaoSemestres: z.number().int().positive(),
  modality: CourseModalitySchema.default('presencial'),
  status: CourseStatusSchema.default('rascunho'),
  ativo: z.boolean().default(true),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  coordenadorId: z.string().optional(),
  dataInicioVigencia: z.string().datetime().optional(),
  thumbnailPath: z.string().optional(),
  bannerPath: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const CourseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: CourseStatusSchema.optional(),
  nivel: CourseLevelSchema.optional(),
  modality: CourseModalitySchema.optional(),
  search: z.string().optional(),
  coordenadorId: z.string().uuid().optional(),
  ativo: z.boolean().optional(),
});

const UpdateCourseBodySchema = CreateCourseBodySchema.partial()
  .omit({ customFields: true })
  .extend({
    customFields: z.record(z.string(), z.unknown()).optional(),
  });

const CourseParamsSchema = z.object({
  id: z.string().uuid(),
});

const CourseResponseSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  descricaoCurta: z.string().nullable(),
  cargaHorariaTotal: z.number(),
  cargaHorariaMinima: z.number().nullable(),
  nivel: CourseLevelSchema,
  grau: CourseGradeSchema.nullable(),
  duracaoSemestres: z.number(),
  modality: CourseModalitySchema,
  status: CourseStatusSchema,
  ativo: z.boolean(),
  categoryId: z.string().nullable(),
  subcategoryId: z.string().nullable(),
  coordenadorId: z.string().nullable(),
  dataInicioVigencia: z.string().nullable(),
  thumbnailPath: z.string().nullable(),
  bannerPath: z.string().nullable(),
  customFields: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const coursesRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/courses',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        body: CreateCourseBodySchema,
        response: {
          201: SuccessResponseSchema(CourseResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
        description: 'Create a new course',
        tags: ['Courses'],
      },
    },
    async (request, reply) => {
      const body = request.body as CreateCourseInput;

      const existingCourse = await app.prisma.course.findUnique({
        where: { codigo: body.codigo },
      });

      if (existingCourse) {
        return reply.status(409).send({
          error: {
            message: 'Course with this code already exists',
            code: 'COURSE_CODE_EXISTS',
          },
        });
      }

      const course = await app.prisma.course.create({
        data: {
          codigo: body.codigo,
          nome: body.nome,
          descricao: body.descricao,
          descricaoCurta: body.descricaoCurta,
          cargaHorariaTotal: body.cargaHorariaTotal,
          cargaHorariaMinima: body.cargaHorariaMinima,
          nivel: body.nivel,
          grau: body.grau,
          duracaoSemestres: body.duracaoSemestres,
          modality: body.modality ?? 'presencial',
          status: body.status ?? 'rascunho',
          ativo: body.ativo ?? true,
          categoryId: body.categoryId,
          subcategoryId: body.subcategoryId,
          coordenadorId: body.coordenadorId,
          dataInicioVigencia: body.dataInicioVigencia
            ? new Date(body.dataInicioVigencia)
            : null,
          thumbnailPath: body.thumbnailPath,
          bannerPath: body.bannerPath,
          customFields: body.customFields as any,
        },
      });

      return reply.status(201).send({
        data: {
          ...course,
          dataInicioVigencia: course.dataInicioVigencia?.toISOString() ?? null,
          customFields:
            (course.customFields as Record<string, unknown>) ?? null,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
        },
      });
    }
  );

  // GET /api/courses - Lista cursos com filtros e paginação
  server.get(
    '/courses',
    {
      schema: {
        querystring: CourseQuerySchema,
        response: {
          200: PaginatedResponseSchema(CourseResponseSchema),
          400: ErrorResponseSchema,
        },
        description: 'Get courses with filtering and pagination',
        tags: ['Courses'],
      },
    },
    async (request, reply) => {
      const query = request.query as QueryCoursesInput;
      const {
        page = 1,
        limit = 10,
        status,
        nivel,
        modality,
        search,
        coordenadorId,
        ativo,
      } = query;

      // Build where clause
      const where: any = {};

      if (status) where.status = status;
      if (nivel) where.nivel = nivel;
      if (modality) where.modality = modality;
      if (coordenadorId) where.coordenadorId = coordenadorId;
      if (ativo !== undefined) where.ativo = ativo;

      // Search functionality
      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
          { codigo: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Authorization: public can only see published + active courses
      const session = (request as any).session;
      const isAdmin =
        session?.user?.role &&
        ['admin', 'super_admin'].includes(session.user.role);

      if (!isAdmin) {
        where.status = 'publicado';
        where.ativo = true;
      }

      const [courses, total] = await Promise.all([
        app.prisma.course.findMany({
          where,
          ...buildPrismaQuery({ page, limit }),
          orderBy: { createdAt: 'desc' },
        }),
        app.prisma.course.count({ where }),
      ]);

      const transformedCourses = courses.map((course) => ({
        ...course,
        dataInicioVigencia: course.dataInicioVigencia?.toISOString() ?? null,
        customFields: (course.customFields as Record<string, unknown>) ?? null,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      }));

      return reply.status(200).send({
        data: transformedCourses,
        pagination: buildPaginationResponse(total, page, limit),
      });
    }
  );

  // GET /api/courses/:id - Get course by ID
  server.get(
    '/courses/:id',
    {
      schema: {
        params: CourseParamsSchema,
        response: {
          200: SuccessResponseSchema(CourseResponseSchema),
          404: ErrorResponseSchema,
        },
        description: 'Get course by ID',
        tags: ['Courses'],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const course = await app.prisma.course.findUnique({
        where: { id },
      });

      if (!course) {
        return reply.status(404).send({
          error: {
            message: 'Course not found',
            code: 'COURSE_NOT_FOUND',
          },
        });
      }

      // Authorization: public can only see published + active courses
      const session = (request as any).session;
      const isAdmin =
        session?.user?.role &&
        ['admin', 'super_admin'].includes(session.user.role);

      if (!isAdmin && (course.status !== 'publicado' || !course.ativo)) {
        return reply.status(404).send({
          error: {
            message: 'Course not found',
            code: 'COURSE_NOT_FOUND',
          },
        });
      }

      return reply.status(200).send({
        data: {
          ...course,
          dataInicioVigencia: course.dataInicioVigencia?.toISOString() ?? null,
          customFields:
            (course.customFields as Record<string, unknown>) ?? null,
          createdAt: course.createdAt.toISOString(),
          updatedAt: course.updatedAt.toISOString(),
        },
      });
    }
  );

  // PUT /api/courses/:id - Update course
  server.put(
    '/courses/:id',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        params: CourseParamsSchema,
        body: UpdateCourseBodySchema,
        response: {
          200: SuccessResponseSchema(CourseResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
        description: 'Update course',
        tags: ['Courses'],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateCourseInput;

      const existingCourse = await app.prisma.course.findUnique({
        where: { id },
      });

      if (!existingCourse) {
        return reply.status(404).send({
          error: {
            message: 'Course not found',
            code: 'COURSE_NOT_FOUND',
          },
        });
      }

      // Check for duplicate codigo if being updated
      if (body.codigo && body.codigo !== existingCourse.codigo) {
        const duplicateCourse = await app.prisma.course.findUnique({
          where: { codigo: body.codigo },
        });

        if (duplicateCourse) {
          return reply.status(409).send({
            error: {
              message: 'Course with this code already exists',
              code: 'COURSE_CODE_EXISTS',
            },
          });
        }
      }

      const updatedCourse = await app.prisma.course.update({
        where: { id },
        data: {
          ...body,
          dataInicioVigencia: body.dataInicioVigencia
            ? new Date(body.dataInicioVigencia)
            : undefined,
          customFields: body.customFields as any,
        },
      });

      return reply.status(200).send({
        data: {
          ...updatedCourse,
          dataInicioVigencia:
            updatedCourse.dataInicioVigencia?.toISOString() ?? null,
          customFields:
            (updatedCourse.customFields as Record<string, unknown>) ?? null,
          createdAt: updatedCourse.createdAt.toISOString(),
          updatedAt: updatedCourse.updatedAt.toISOString(),
        },
      });
    }
  );

  // DELETE /api/courses/:id - Delete course (soft delete)
  server.delete(
    '/courses/:id',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        params: CourseParamsSchema,
        querystring: z.object({
          force: z.boolean().default(false),
        }),
        response: {
          200: SuccessResponseSchema(z.object({ message: z.string() })),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Delete course',
        tags: ['Courses'],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { force } = request.query as { force: boolean };

      const existingCourse = await app.prisma.course.findUnique({
        where: { id },
        include: {
          enrollments: { select: { id: true } },
          disciplines: { select: { id: true } },
        },
      });

      if (!existingCourse) {
        return reply.status(404).send({
          error: {
            message: 'Course not found',
            code: 'COURSE_NOT_FOUND',
          },
        });
      }

      const hasDependencies =
        existingCourse.enrollments.length > 0 ||
        existingCourse.disciplines.length > 0;

      if (hasDependencies && !force) {
        return reply.status(400).send({
          error: {
            message:
              'Cannot delete course with dependencies. Use force=true to cascade delete.',
            code: 'COURSE_HAS_DEPENDENCIES',
            details: {
              enrollments: existingCourse.enrollments.length,
              disciplines: existingCourse.disciplines.length,
            },
          },
        });
      }

      if (force) {
        // Hard delete with cascade
        await app.prisma.course.delete({ where: { id } });
      } else {
        // Soft delete
        await app.prisma.course.update({
          where: { id },
          data: { ativo: false },
        });
      }

      return reply.status(200).send({
        data: {
          message: force ? 'Course deleted permanently' : 'Course deactivated',
        },
      });
    }
  );
};

export default coursesRoutes;
