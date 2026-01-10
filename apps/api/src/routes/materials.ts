import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type {
  CreateMaterialInput,
  CreateMaterialsInput,
} from '@repo/packages-types/material';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';

const MaterialTypeSchema = z.enum([
  'slides',
  'pdf',
  'video',
  'audio',
  'link',
  'codigo_fonte',
  'planilha',
  'outro',
]);

const CreateMaterialSchema = z.object({
  titulo: z.string().min(1),
  tipo: MaterialTypeSchema,
  descricao: z.string().optional(),
  arquivoPath: z.string().optional(),
  url: z.string().url().optional(),
  tamanhoBytes: z.number().int().positive().optional(),
  formato: z.string().optional(),
  obrigatorio: z.boolean().default(false),
  ordem: z.number().int().positive(),
  downloadsCount: z.number().int().nonnegative().default(0),
});

const CreateMaterialsBodySchema = z.object({
  materiais: z.array(CreateMaterialSchema).min(1),
});

const LessonIdParamSchema = z.object({
  lessonId: z.string().cuid(),
});

const MaterialIdParamSchema = z.object({
  materialId: z.string().cuid(),
});

const MaterialResponseSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  titulo: z.string(),
  tipo: MaterialTypeSchema,
  descricao: z.string().nullable(),
  arquivoPath: z.string().nullable(),
  url: z.string().nullable(),
  tamanhoBytes: z.number().nullable(),
  formato: z.string().nullable(),
  obrigatorio: z.boolean(),
  ordem: z.number(),
  downloadsCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const materialsRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/lessons/:lessonId/materials',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        params: LessonIdParamSchema,
        body: CreateMaterialsBodySchema,
        response: {
          201: SuccessResponseSchema(z.array(MaterialResponseSchema)),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Add materials to a lesson',
        tags: ['Materials'],
      },
    },
    async (request, reply) => {
      const { lessonId } = request.params;
      const body = request.body as CreateMaterialsInput;

      const lesson = await app.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      const materials = await app.prisma.$transaction(
        body.materiais.map((material: CreateMaterialInput) =>
          app.prisma.material.create({
            data: {
              lessonId,
              titulo: material.titulo,
              tipo: material.tipo,
              descricao: material.descricao,
              arquivoPath: material.arquivoPath,
              url: material.url,
              tamanhoBytes: material.tamanhoBytes,
              formato: material.formato,
              obrigatorio: material.obrigatorio ?? false,
              ordem: material.ordem,
              downloadsCount: material.downloadsCount ?? 0,
            },
          })
        )
      );

      return reply.status(201).send({
        data: materials.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      });
    }
  );

  // GET /api/lessons/:lessonId/materials - Get materials for lesson
  server.get(
    '/lessons/:lessonId/materials',
    {
      preHandler: [requireAuth],
      schema: {
        params: LessonIdParamSchema,
        querystring: z.object({
          tipo: MaterialTypeSchema.optional(),
          obrigatorio: z.boolean().optional(),
        }),
        response: {
          200: SuccessResponseSchema(z.array(MaterialResponseSchema)),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get all materials for a lesson',
        tags: ['Materials'],
      },
    },
    async (request, reply) => {
      const { lessonId } = request.params;
      const { tipo, obrigatorio } = request.query as {
        tipo?: string;
        obrigatorio?: boolean;
      };

      const lesson = await app.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      const materials = await app.prisma.material.findMany({
        where: {
          lessonId,
          ...(tipo && { tipo: tipo as any }),
          ...(obrigatorio !== undefined && { obrigatorio }),
        },
        orderBy: { ordem: 'asc' },
      });

      return reply.status(200).send({
        data: materials.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })),
      });
    }
  );

  // GET /api/materials/:materialId - Get material by ID
  server.get(
    '/materials/:materialId',
    {
      preHandler: [requireAuth],
      schema: {
        params: MaterialIdParamSchema,
        response: {
          200: SuccessResponseSchema(MaterialResponseSchema),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get material by ID',
        tags: ['Materials'],
      },
    },
    async (request, reply) => {
      const { materialId } = request.params;

      const material = await app.prisma.material.findUnique({
        where: { id: materialId },
      });

      if (!material) {
        throw new NotFoundError('Material not found');
      }

      // Increment download count for files
      if (material.arquivoPath) {
        await app.prisma.material.update({
          where: { id: materialId },
          data: {
            downloadsCount: {
              increment: 1,
            },
          },
        });
      }

      return reply.status(200).send({
        data: {
          ...material,
          createdAt: material.createdAt.toISOString(),
          updatedAt: material.updatedAt.toISOString(),
        },
      });
    }
  );
};

export default materialsRoutes;
