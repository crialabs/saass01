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
import { buildPaginationResponse } from '@/utils/pagination';

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

      const course = await app.coursesService.createCourse({
        ...body,
        dataInicioVigencia: body.dataInicioVigencia
          ? new Date(body.dataInicioVigencia)
          : undefined,
        customFields: body.customFields as any,
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

      const session = (request as any).session;
      const userRole = session?.user?.role as
        | 'admin'
        | 'super_admin'
        | 'user'
        | undefined;

      const result = await app.coursesService.listCourses({
        page,
        limit,
        filters: {
          status,
          nivel,
          modality,
          search,
          coordenadorId,
          ativo,
        },
        userRole,
      });

      const transformedCourses = result.courses.map((course) => ({
        ...course,
        dataInicioVigencia: course.dataInicioVigencia?.toISOString() ?? null,
        customFields: (course.customFields as Record<string, unknown>) ?? null,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      }));

      return reply.status(200).send({
        data: transformedCourses,
        pagination: buildPaginationResponse(result.total, page, limit),
      });
    }
  );

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

      const session = (request as any).session;
      const userRole = session?.user?.role as
        | 'admin'
        | 'super_admin'
        | 'user'
        | undefined;

      const course = await app.coursesService.getCourseById(id, userRole);

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

      const updatedCourse = await app.coursesService.updateCourse(id, {
        ...body,
        dataInicioVigencia: body.dataInicioVigencia
          ? new Date(body.dataInicioVigencia)
          : undefined,
        customFields: body.customFields as any,
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

      await app.coursesService.deleteCourse(id, force);

      return reply.status(200).send({
        data: {
          message: force ? 'Course deleted permanently' : 'Course deactivated',
        },
      });
    }
  );
};

export default coursesRoutes;
