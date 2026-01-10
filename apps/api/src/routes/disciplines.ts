import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type {
  AddDisciplinesInput,
  CreateDisciplineInput,
} from '@repo/packages-types/discipline';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';

const CreateDisciplineSchema = z.object({
  codigo: z.string().min(1),
  nome: z.string().min(1),
  ementa: z.string().optional(),
  cargaHorariaTeorica: z.number().int().nonnegative(),
  cargaHorariaPratica: z.number().int().nonnegative(),
  cargaHorariaTotal: z.number().int().positive(),
  areaConhecimento: z.string().optional(),
  periodo: z.number().int().positive(),
  obrigatoria: z.boolean().default(true),
  objetivos: z.array(z.string()).default([]),
  competencias: z.array(z.string()).default([]),
  prerequisitos: z.array(z.string()).default([]),
  bibliografiaBasica: z.array(z.string()).default([]),
  ativo: z.boolean().default(true),
});

const AddDisciplinesBodySchema = z.object({
  disciplinas: z.array(CreateDisciplineSchema).min(1),
});

const CourseIdParamSchema = z.object({
  courseId: z.string().cuid(),
});

const DisciplineResponseSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  codigo: z.string(),
  nome: z.string(),
  ementa: z.string().nullable(),
  cargaHorariaTeorica: z.number(),
  cargaHorariaPratica: z.number(),
  cargaHorariaTotal: z.number(),
  areaConhecimento: z.string().nullable(),
  periodo: z.number(),
  obrigatoria: z.boolean(),
  objetivos: z.array(z.string()),
  competencias: z.array(z.string()),
  prerequisitos: z.array(z.string()),
  bibliografiaBasica: z.array(z.string()),
  ativo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const disciplinesRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/courses/:courseId/disciplines',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        params: CourseIdParamSchema,
        body: AddDisciplinesBodySchema,
        response: {
          201: SuccessResponseSchema(z.array(DisciplineResponseSchema)),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
        description: 'Add disciplines to a course',
        tags: ['Disciplines'],
      },
    },
    async (request, reply) => {
      const { courseId } = request.params;
      const body = request.body as AddDisciplinesInput;

      const course = await app.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      const existingDisciplines = await app.prisma.discipline.findMany({
        where: {
          courseId,
          codigo: {
            in: body.disciplinas.map((d: { codigo: string }) => d.codigo),
          },
        },
      });

      if (existingDisciplines.length > 0) {
        return reply.status(409).send({
          error: {
            message: `Discipline codes already exist: ${existingDisciplines.map((d: { codigo: string }) => d.codigo).join(', ')}`,
            code: 'DISCIPLINE_CODE_EXISTS',
          },
        });
      }

      const disciplines = await app.prisma.$transaction(
        body.disciplinas.map((discipline: CreateDisciplineInput) =>
          app.prisma.discipline.create({
            data: {
              courseId,
              codigo: discipline.codigo,
              nome: discipline.nome,
              ementa: discipline.ementa,
              cargaHorariaTeorica: discipline.cargaHorariaTeorica,
              cargaHorariaPratica: discipline.cargaHorariaPratica,
              cargaHorariaTotal: discipline.cargaHorariaTotal,
              areaConhecimento: discipline.areaConhecimento,
              periodo: discipline.periodo,
              obrigatoria: discipline.obrigatoria ?? true,
              objetivos: discipline.objetivos ?? [],
              competencias: discipline.competencias ?? [],
              prerequisitos: discipline.prerequisitos ?? [],
              bibliografiaBasica: discipline.bibliografiaBasica ?? [],
              ativo: discipline.ativo ?? true,
            },
          })
        )
      );

      return reply.status(201).send({
        data: disciplines.map((d: any) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
      });
    }
  );

  // GET /api/courses/:courseId/disciplines - Lista disciplinas de um curso
  server.get(
    '/courses/:courseId/disciplines',
    {
      schema: {
        params: CourseIdParamSchema,
        querystring: z.object({
          ativo: z.boolean().optional(),
          periodo: z.number().int().positive().optional(),
        }),
        response: {
          200: SuccessResponseSchema(z.array(DisciplineResponseSchema)),
          404: ErrorResponseSchema,
        },
        description: 'Get disciplines for a course',
        tags: ['Disciplines'],
      },
    },
    async (request, reply) => {
      const { courseId } = request.params as { courseId: string };
      const { ativo, periodo } = request.query as {
        ativo?: boolean;
        periodo?: number;
      };

      // Verificar se o curso existe
      const course = await app.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return reply.status(404).send({
          error: {
            message: 'Course not found',
            code: 'COURSE_NOT_FOUND',
          },
        });
      }

      // Build where clause
      const where: any = { courseId };
      if (ativo !== undefined) where.ativo = ativo;
      if (periodo) where.periodo = periodo;

      const disciplines = await app.prisma.discipline.findMany({
        where,
        orderBy: [{ periodo: 'asc' }, { nome: 'asc' }],
      });

      return reply.status(200).send({
        data: disciplines.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
      });
    }
  );
};

export default disciplinesRoutes;
