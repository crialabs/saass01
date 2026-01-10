import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type {
  CreateModuleInput,
  CreateModulesInput,
} from '@repo/packages-types/module';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';

const CreateModuleSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  ordem: z.number().int().positive(),
  cargaHorariaEstimada: z.number().int().positive().optional(),
  objetivosAprendizagem: z.array(z.string()).default([]),
  ativo: z.boolean().default(true),
});

const CreateModulesBodySchema = z.object({
  modulos: z.array(CreateModuleSchema).min(1),
});

const DisciplineIdParamSchema = z.object({
  disciplineId: z.string().cuid(),
});

const ModuleIdParamSchema = z.object({
  moduleId: z.string().cuid(),
});

const ModuleResponseSchema = z.object({
  id: z.string(),
  disciplineId: z.string(),
  titulo: z.string(),
  descricao: z.string().nullable(),
  ordem: z.number(),
  cargaHorariaEstimada: z.number().nullable(),
  objetivosAprendizagem: z.array(z.string()),
  ativo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const modulesRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/disciplines/:disciplineId/modules',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        params: DisciplineIdParamSchema,
        body: CreateModulesBodySchema,
        response: {
          201: SuccessResponseSchema(z.array(ModuleResponseSchema)),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Create modules for a discipline',
        tags: ['Modules'],
      },
    },
    async (request, reply) => {
      const { disciplineId } = request.params;
      const body = request.body as CreateModulesInput;

      const discipline = await app.prisma.discipline.findUnique({
        where: { id: disciplineId },
      });

      if (!discipline) {
        throw new NotFoundError('Discipline not found');
      }

      const modules = await app.prisma.$transaction(
        body.modulos.map((module: CreateModuleInput) =>
          app.prisma.module.create({
            data: {
              disciplineId,
              titulo: module.titulo,
              descricao: module.descricao,
              ordem: module.ordem,
              cargaHorariaEstimada: module.cargaHorariaEstimada,
              objetivosAprendizagem: module.objetivosAprendizagem ?? [],
              ativo: module.ativo ?? true,
            },
          })
        )
      );

      return reply.status(201).send({
        data: modules.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      });
    }
  );

  // GET /api/disciplines/:disciplineId/modules - Get modules for discipline
  server.get(
    '/disciplines/:disciplineId/modules',
    {
      preHandler: [requireAuth],
      schema: {
        params: DisciplineIdParamSchema,
        querystring: z.object({
          ativo: z.boolean().optional(),
        }),
        response: {
          200: SuccessResponseSchema(z.array(ModuleResponseSchema)),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get all modules for a discipline',
        tags: ['Modules'],
      },
    },
    async (request, reply) => {
      const { disciplineId } = request.params;
      const { ativo } = request.query as { ativo?: boolean };

      const discipline = await app.prisma.discipline.findUnique({
        where: { id: disciplineId },
      });

      if (!discipline) {
        throw new NotFoundError('Discipline not found');
      }

      const modules = await app.prisma.module.findMany({
        where: {
          disciplineId,
          ...(ativo !== undefined && { ativo }),
        },
        orderBy: { ordem: 'asc' },
      });

      return reply.status(200).send({
        data: modules.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      });
    }
  );

  // GET /api/modules/:moduleId - Get module by ID with lessons
  server.get(
    '/modules/:moduleId',
    {
      preHandler: [requireAuth],
      schema: {
        params: ModuleIdParamSchema,
        querystring: z.object({
          includeLessons: z.boolean().optional(),
          studentId: z.string().cuid().optional(), // For including progress
        }),
        response: {
          200: SuccessResponseSchema(
            ModuleResponseSchema.extend({
              lessons: z
                .array(
                  z.object({
                    id: z.string(),
                    titulo: z.string(),
                    tipo: z.string(),
                    duracaoMinutos: z.number().nullable(),
                    ordem: z.number(),
                    obrigatoria: z.boolean(),
                    liberada: z.boolean(),
                    progress: z
                      .object({
                        status: z.string(),
                        viewedAt: z.string().nullable(),
                        completedAt: z.string().nullable(),
                      })
                      .nullable(),
                  })
                )
                .optional(),
            })
          ),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get module by ID',
        tags: ['Modules'],
      },
    },
    async (request, reply) => {
      const { moduleId } = request.params;
      const { includeLessons, studentId } = request.query as {
        includeLessons?: boolean;
        studentId?: string;
      };

      const include: any = {};
      if (includeLessons === true) {
        include.lessons = {
          where: { liberada: true },
          select: {
            id: true,
            titulo: true,
            tipo: true,
            duracaoMinutos: true,
            ordem: true,
            obrigatoria: true,
            liberada: true,
            ...(studentId && {
              progresses: {
                where: { studentId },
                select: {
                  status: true,
                  viewedAt: true,
                  completedAt: true,
                },
              },
            }),
          },
          orderBy: { ordem: 'asc' },
        };
      }

      const moduleRecord = await app.prisma.module.findUnique({
        where: { id: moduleId },
        include,
      });

      if (!moduleRecord) {
        throw new NotFoundError('Module not found');
      }

      const responseData: any = {
        ...moduleRecord,
        createdAt: moduleRecord.createdAt.toISOString(),
        updatedAt: moduleRecord.updatedAt.toISOString(),
      };

      if (
        includeLessons &&
        'lessons' in moduleRecord &&
        Array.isArray((moduleRecord as any).lessons)
      ) {
        responseData.lessons = (moduleRecord as any).lessons.map(
          (lesson: any) => ({
            id: lesson.id,
            titulo: lesson.titulo,
            tipo: lesson.tipo,
            duracaoMinutos: lesson.duracaoMinutos,
            ordem: lesson.ordem,
            obrigatoria: lesson.obrigatoria,
            liberada: lesson.liberada,
            progress:
              Array.isArray(lesson.progresses) && lesson.progresses[0]
                ? {
                    status: lesson.progresses[0].status,
                    viewedAt:
                      lesson.progresses[0].viewedAt?.toISOString() ?? null,
                    completedAt:
                      lesson.progresses[0].completedAt?.toISOString() ?? null,
                  }
                : null,
          })
        );
      }

      return reply.status(200).send({ data: responseData });
    }
  );
};

export default modulesRoutes;
