import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type { CreateProgressInput } from '@repo/packages-types/progress';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth } from '@/hooks/auth';

const ProgressStatusSchema = z.enum([
  'nao_iniciada',
  'em_progresso',
  'concluida',
]);

const StudentIdParamSchema = z.object({
  studentId: z.string().cuid(),
});

const CreateProgressBodySchema = z.object({
  lessonId: z.string().cuid(),
  moduleId: z.string().cuid(),
  disciplineId: z.string().cuid(),
  courseId: z.string().cuid(),
  status: ProgressStatusSchema,
  watchedMinutes: z.number().int().nonnegative().optional(),
  totalMinutes: z.number().int().positive().optional(),
  completionPercentage: z.number().min(0).max(100).default(0),
  viewedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  score: z.number().min(0).max(10).optional(),
  notes: z.string().optional(),
});

const ProgressResponseSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  lessonId: z.string(),
  moduleId: z.string(),
  disciplineId: z.string(),
  courseId: z.string(),
  status: ProgressStatusSchema,
  watchedMinutes: z.number().nullable(),
  totalMinutes: z.number().nullable(),
  completionPercentage: z.number(),
  viewedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  score: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const progressRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/students/:studentId/progress',
    {
      preHandler: [requireAuth],
      schema: {
        params: StudentIdParamSchema,
        body: CreateProgressBodySchema,
        response: {
          201: SuccessResponseSchema(ProgressResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Record student progress for a lesson',
        tags: ['Progress'],
      },
    },
    async (request, reply) => {
      const { studentId } = request.params;
      const body = request.body as CreateProgressInput;

      const session = await app.auth.api.getSession({
        headers: request.headers as unknown as Headers,
      });

      const currentUser = session?.user as { id: string; role?: string };
      const isAdmin = ['admin', 'super_admin'].includes(
        currentUser?.role || ''
      );

      if (currentUser.id !== studentId && !isAdmin) {
        return reply.status(403).send({
          error: {
            message: 'You can only record your own progress',
            code: 'FORBIDDEN',
          },
        });
      }

      const [student, lesson] = await Promise.all([
        app.prisma.user.findUnique({ where: { id: studentId } }),
        app.prisma.lesson.findUnique({ where: { id: body.lessonId } }),
      ]);

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      const progress = await app.prisma.progress.upsert({
        where: {
          studentId_lessonId: {
            studentId,
            lessonId: body.lessonId,
          },
        },
        update: {
          status: body.status,
          watchedMinutes: body.watchedMinutes,
          totalMinutes: body.totalMinutes,
          completionPercentage: body.completionPercentage ?? 0,
          viewedAt: body.viewedAt ? new Date(body.viewedAt) : new Date(),
          completedAt: body.completedAt ? new Date(body.completedAt) : null,
          score: body.score,
          notes: body.notes,
        },
        create: {
          studentId,
          lessonId: body.lessonId,
          moduleId: body.moduleId,
          disciplineId: body.disciplineId,
          courseId: body.courseId,
          status: body.status,
          watchedMinutes: body.watchedMinutes,
          totalMinutes: body.totalMinutes,
          completionPercentage: body.completionPercentage ?? 0,
          viewedAt: body.viewedAt ? new Date(body.viewedAt) : new Date(),
          completedAt: body.completedAt ? new Date(body.completedAt) : null,
          score: body.score,
          notes: body.notes,
        },
      });

      return reply.status(201).send({
        data: {
          ...progress,
          viewedAt: progress.viewedAt?.toISOString() ?? null,
          completedAt: progress.completedAt?.toISOString() ?? null,
          createdAt: progress.createdAt.toISOString(),
          updatedAt: progress.updatedAt.toISOString(),
        },
      });
    }
  );

  // GET /api/students/:studentId/progress - Get student progress
  server.get(
    '/students/:studentId/progress',
    {
      preHandler: [requireAuth],
      schema: {
        params: StudentIdParamSchema,
        querystring: z.object({
          courseId: z.string().uuid().optional(),
          disciplineId: z.string().uuid().optional(),
          moduleId: z.string().uuid().optional(),
          status: ProgressStatusSchema.optional(),
        }),
        response: {
          200: SuccessResponseSchema(z.array(ProgressResponseSchema)),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        description: 'Get student progress records',
        tags: ['Progress'],
      },
    },
    async (request, reply) => {
      const { studentId } = request.params;
      const { courseId, disciplineId, moduleId, status } = request.query as {
        courseId?: string;
        disciplineId?: string;
        moduleId?: string;
        status?: string;
      };

      // Authorization check
      const session = (request as any).session;
      const isAdmin =
        session?.user?.role &&
        ['admin', 'super_admin'].includes(session.user.role);

      if (!isAdmin && session?.user?.id !== studentId) {
        return reply.status(403).send({
          error: {
            message: 'You can only view your own progress',
            code: 'FORBIDDEN',
          },
        });
      }

      const where: Record<string, unknown> = { studentId };
      if (courseId) where.courseId = courseId;
      if (disciplineId) where.disciplineId = disciplineId;
      if (moduleId) where.moduleId = moduleId;
      if (status) where.status = status;

      const progresses = await app.prisma.progress.findMany({
        where,
        include: {
          lesson: {
            select: { titulo: true, duracaoMinutos: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return reply.status(200).send({
        data: progresses.map((p) => ({
          ...p,
          lesson: undefined, // Remove from response, include as separate field if needed
          viewedAt: p.viewedAt?.toISOString() ?? null,
          completedAt: p.completedAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        })),
      });
    }
  );
};

export default progressRoutes;
