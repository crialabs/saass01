import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type {
  CreateLessonInput,
  CreateLessonsInput,
} from '@repo/packages-types/lesson';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';

const LessonTypeSchema = z.enum([
  'video_gravado',
  'video_ao_vivo',
  'texto',
  'quiz',
  'atividade_pratica',
  'leitura',
]);

const CreateLessonSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  tipo: LessonTypeSchema,
  ordem: z.number().int().positive(),
  videoUrl: z.string().url().optional(),
  duracaoMinutos: z.number().int().positive().optional(),
  thumbnailUrl: z.string().url().optional(),
  obrigatoria: z.boolean().default(true),
  liberada: z.boolean().default(true),
  permiteDownload: z.boolean().default(false),
  percentualConclusaoMinimo: z.number().int().min(0).max(100).default(100),
  marcaDaguaAtiva: z.boolean().default(false),
  transcricaoDisponivel: z.boolean().default(false),
  legendasDisponiveis: z.array(z.string()).default([]),
  resolucoesDisponiveis: z.array(z.string()).default([]),
});

const CreateLessonsBodySchema = z.object({
  aulas: z.array(CreateLessonSchema).min(1),
});

const ModuleIdParamSchema = z.object({
  moduleId: z.string().cuid(),
});

const LessonResponseSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  titulo: z.string(),
  descricao: z.string().nullable(),
  tipo: LessonTypeSchema,
  ordem: z.number(),
  videoUrl: z.string().nullable(),
  duracaoMinutos: z.number().nullable(),
  thumbnailUrl: z.string().nullable(),
  obrigatoria: z.boolean(),
  liberada: z.boolean(),
  permiteDownload: z.boolean(),
  percentualConclusaoMinimo: z.number(),
  marcaDaguaAtiva: z.boolean(),
  transcricaoDisponivel: z.boolean(),
  legendasDisponiveis: z.array(z.string()),
  resolucoesDisponiveis: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const lessonsRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/modules/:moduleId/lessons',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        params: ModuleIdParamSchema,
        body: CreateLessonsBodySchema,
        response: {
          201: SuccessResponseSchema(z.array(LessonResponseSchema)),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Create lessons for a module',
        tags: ['Lessons'],
      },
    },
    async (request, reply) => {
      const { moduleId } = request.params;
      const body = request.body as CreateLessonsInput;

      const moduleRecord = await app.prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!moduleRecord) {
        throw new NotFoundError('Module not found');
      }

      const lessons = await app.prisma.$transaction(
        body.aulas.map((lesson: CreateLessonInput) =>
          app.prisma.lesson.create({
            data: {
              moduleId,
              titulo: lesson.titulo,
              descricao: lesson.descricao,
              tipo: lesson.tipo,
              ordem: lesson.ordem,
              videoUrl: lesson.videoUrl,
              duracaoMinutos: lesson.duracaoMinutos,
              thumbnailUrl: lesson.thumbnailUrl,
              obrigatoria: lesson.obrigatoria ?? true,
              liberada: lesson.liberada ?? true,
              permiteDownload: lesson.permiteDownload ?? false,
              percentualConclusaoMinimo:
                lesson.percentualConclusaoMinimo ?? 100,
              marcaDaguaAtiva: lesson.marcaDaguaAtiva ?? false,
              transcricaoDisponivel: lesson.transcricaoDisponivel ?? false,
              legendasDisponiveis: lesson.legendasDisponiveis ?? [],
              resolucoesDisponiveis: lesson.resolucoesDisponiveis ?? [],
            },
          })
        )
      );

      return reply.status(201).send({
        data: lessons.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
        })),
      });
    }
  );

  // GET /api/lessons/:id - Get lesson by ID with materials and progress
  server.get(
    '/lessons/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        querystring: z.object({
          studentId: z.string().uuid().optional(),
          includeMaterials: z.boolean().default(true),
        }),
        response: {
          200: SuccessResponseSchema(LessonResponseSchema),
          404: ErrorResponseSchema,
        },
        description: 'Get lesson by ID',
        tags: ['Lessons'],
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { studentId, includeMaterials } = request.query as {
        studentId?: string;
        includeMaterials: boolean;
      };

      const lesson = await app.prisma.lesson.findUnique({
        where: { id },
        include: {
          materials: includeMaterials,
          module: {
            include: {
              discipline: {
                include: {
                  course: true,
                },
              },
            },
          },
          progresses: studentId
            ? {
                where: { studentId },
                take: 1,
              }
            : false,
        },
      });

      if (!lesson) {
        return reply.status(404).send({
          error: {
            message: 'Lesson not found',
            code: 'LESSON_NOT_FOUND',
          },
        });
      }

      const transformedLesson = {
        ...lesson,
        materials: lesson.materials?.map((m: any) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
        progress: lesson.progresses?.[0] || null,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
      };

      return reply.status(200).send({
        data: transformedLesson,
      });
    }
  );
};

export default lessonsRoutes;
