import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type {
  CreateQuizResultInput,
  QuizAnswerDetail,
} from '@repo/packages-types/quiz-result';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';
import { buildPaginationResponse, buildPrismaQuery } from '@/utils/pagination';

const StudentIdParamSchema = z.object({
  studentId: z.string().cuid(),
});

const QuizAttemptIdParamSchema = z.object({
  attemptId: z.string().cuid(),
});

const QuizAnswerDetailSchema = z.object({
  questionId: z.string().cuid(),
  questionText: z.string(),
  selectedOption: z.string().cuid(),
  correctOption: z.string().cuid(),
  correct: z.boolean(),
  pointsEarned: z.number().int().nonnegative(),
});

const CreateQuizResultBodySchema = z.object({
  quizId: z.string().cuid(),
  lessonId: z.string().cuid(),
  courseId: z.string().cuid(),
  disciplineId: z.string().cuid(),
  totalQuestions: z.number().int().positive(),
  correctAnswers: z.number().int().nonnegative(),
  score: z.number().nonnegative(),
  scorePercentage: z.number().min(0).max(100),
  passed: z.boolean(),
  timeSpentSeconds: z.number().int().nonnegative(),
  attempts: z.number().int().positive(),
  submittedAt: z.string().datetime().optional(),
  answers: z.array(QuizAnswerDetailSchema).min(1),
});

const QuizResultResponseSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  studentId: z.string(),
  courseId: z.string(),
  disciplineId: z.string(),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  score: z.number(),
  scorePercentage: z.number(),
  passed: z.boolean(),
  timeSpentSeconds: z.number(),
  attempts: z.number(),
  submittedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const quizResultsRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/students/:studentId/quiz-results',
    {
      preHandler: [requireAuth],
      schema: {
        params: StudentIdParamSchema,
        body: CreateQuizResultBodySchema,
        response: {
          201: SuccessResponseSchema(QuizResultResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Submit quiz result for a student',
        tags: ['Quiz Results'],
      },
    },
    async (request, reply) => {
      const { studentId } = request.params;
      const body = request.body as CreateQuizResultInput;

      const session = await app.auth.api.getSession({
        headers: request.headers as unknown as Headers,
      });

      const currentUser = session?.user as { id: string; role?: string };
      const isAdmin = ['admin', 'super_admin'].includes(
        currentUser?.role || ''
      );

      if (currentUser.id !== studentId && !isAdmin) {
        return reply.status(401).send({
          error: {
            message: 'You can only submit your own quiz results',
            code: 'FORBIDDEN',
          },
        });
      }

      const [student, quiz] = await Promise.all([
        app.prisma.user.findUnique({ where: { id: studentId } }),
        app.prisma.quiz.findUnique({ where: { id: body.quizId } }),
      ]);

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      if (!quiz) {
        throw new NotFoundError('Quiz not found');
      }

      const result = await app.prisma.quizAttempt.create({
        data: {
          quizId: body.quizId,
          studentId,
          courseId: body.courseId,
          disciplineId: body.disciplineId,
          totalQuestions: body.totalQuestions,
          correctAnswers: body.correctAnswers,
          score: body.score,
          scorePercentage: body.scorePercentage,
          passed: body.passed,
          timeSpentSeconds: body.timeSpentSeconds,
          attempts: body.attempts,
          submittedAt: body.submittedAt
            ? new Date(body.submittedAt)
            : new Date(),
          answers: {
            create: body.answers.map((answer: QuizAnswerDetail) => ({
              questionId: answer.questionId,
              questionText: answer.questionText,
              selectedOptionId: answer.selectedOption,
              correctOptionId: answer.correctOption,
              correct: answer.correct,
              pointsEarned: answer.pointsEarned,
            })),
          },
        },
      });

      return reply.status(201).send({
        data: {
          ...result,
          submittedAt: result.submittedAt.toISOString(),
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        },
      });
    }
  );

  // GET /api/students/:studentId/quiz-results - Get quiz results for student
  server.get(
    '/students/:studentId/quiz-results',
    {
      preHandler: [requireAuth],
      schema: {
        params: StudentIdParamSchema,
        querystring: z.object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(20),
          courseId: z.string().cuid().optional(),
          quizId: z.string().cuid().optional(),
          passed: z.boolean().optional(),
        }),
        response: {
          200: SuccessResponseSchema(
            z.object({
              data: z.array(
                QuizResultResponseSchema.extend({
                  quiz: z.object({
                    id: z.string(),
                    titulo: z.string(),
                    notaMinimaAprovacao: z.number(),
                  }),
                })
              ),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
              }),
            })
          ),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get quiz results for a student',
        tags: ['Quiz Results'],
      },
    },
    async (request, reply) => {
      const { studentId } = request.params;
      const {
        page = 1,
        limit = 20,
        courseId,
        quizId,
        passed,
      } = request.query as {
        page?: number;
        limit?: number;
        courseId?: string;
        quizId?: string;
        passed?: boolean;
      };

      // Authorization check
      const session = (request as any).session;
      const isAdmin =
        session?.user?.role &&
        ['admin', 'super_admin'].includes(session.user.role);

      if (!isAdmin && session?.user?.id !== studentId) {
        return reply.status(403).send({
          error: {
            message: 'You can only view your own quiz results',
            code: 'FORBIDDEN',
          },
        });
      }

      const whereConditions: Record<string, unknown> = { studentId };
      if (courseId) whereConditions.courseId = courseId;
      if (quizId) whereConditions.quizId = quizId;
      if (passed !== undefined) whereConditions.passed = passed;

      const { skip, take } = buildPrismaQuery({ page, limit });

      const [results, total] = await Promise.all([
        app.prisma.quizAttempt.findMany({
          where: whereConditions,
          include: {
            quiz: {
              select: {
                id: true,
                titulo: true,
                notaMinimaAprovacao: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        app.prisma.quizAttempt.count({ where: whereConditions }),
      ]);

      const formattedResults = results.map((result) => ({
        ...result,
        submittedAt: result.submittedAt.toISOString(),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      }));

      return reply.status(200).send({
        data: {
          data: formattedResults,
          pagination: buildPaginationResponse(total, page, limit),
        },
      });
    }
  );

  // GET /api/quiz-attempts/:attemptId - Get specific quiz attempt with answers
  server.get(
    '/quiz-attempts/:attemptId',
    {
      preHandler: [requireAuth],
      schema: {
        params: QuizAttemptIdParamSchema,
        querystring: z.object({
          includeAnswers: z.boolean().optional(),
        }),
        response: {
          200: SuccessResponseSchema(
            QuizResultResponseSchema.extend({
              quiz: z.object({
                id: z.string(),
                titulo: z.string(),
                notaMinimaAprovacao: z.number(),
                mostrarGabaritoFinal: z.boolean(),
              }),
              answers: z
                .array(
                  z.object({
                    id: z.string(),
                    questionId: z.string(),
                    questionText: z.string(),
                    selectedOptionId: z.string(),
                    correctOptionId: z.string(),
                    correct: z.boolean(),
                    pointsEarned: z.number(),
                  })
                )
                .optional(),
            })
          ),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get quiz attempt by ID with answers',
        tags: ['Quiz Results'],
      },
    },
    async (request, reply) => {
      const { attemptId } = request.params;
      const { includeAnswers } = request.query as { includeAnswers?: boolean };

      const include: any = {
        quiz: {
          select: {
            id: true,
            titulo: true,
            notaMinimaAprovacao: true,
            mostrarGabaritoFinal: true,
          },
        },
      };

      if (includeAnswers === true) {
        include.answers = {
          select: {
            id: true,
            questionId: true,
            questionText: true,
            selectedOptionId: true,
            correctOptionId: true,
            correct: true,
            pointsEarned: true,
          },
        };
      }

      const attempt = await app.prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include,
      });

      if (!attempt) {
        throw new NotFoundError('Quiz attempt not found');
      }

      // Authorization check
      const session = (request as any).session;
      const isAdmin =
        session?.user?.role &&
        ['admin', 'super_admin'].includes(session.user.role);

      if (!isAdmin && session?.user?.id !== attempt.studentId) {
        return reply.status(403).send({
          error: {
            message: 'You can only view your own quiz attempt',
            code: 'FORBIDDEN',
          },
        });
      }

      // Only include answers if the quiz allows viewing results or user is admin
      const canViewAnswers =
        isAdmin || (attempt as any).quiz.mostrarGabaritoFinal;

      const responseData: any = {
        ...attempt,
        submittedAt: attempt.submittedAt.toISOString(),
        createdAt: attempt.createdAt.toISOString(),
        updatedAt: attempt.updatedAt.toISOString(),
      };

      if (includeAnswers && canViewAnswers && (attempt as any).answers) {
        responseData.answers = (attempt as any).answers;
      }

      return reply.status(200).send({ data: responseData });
    }
  );

  // GET /api/quiz-results/stats - Get quiz results statistics (admin only)
  server.get(
    '/quiz-results/stats',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        querystring: z.object({
          courseId: z.string().cuid().optional(),
          quizId: z.string().cuid().optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
        }),
        response: {
          200: SuccessResponseSchema(
            z.object({
              totalAttempts: z.number(),
              passedAttempts: z.number(),
              averageScore: z.number(),
              passRate: z.number(),
              averageTimeSpent: z.number(),
              scoreDistribution: z.array(
                z.object({
                  range: z.string(),
                  count: z.number(),
                })
              ),
            })
          ),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        description: 'Get quiz results statistics',
        tags: ['Quiz Results'],
      },
    },
    async (request, reply) => {
      const { courseId, quizId, startDate, endDate } = request.query as {
        courseId?: string;
        quizId?: string;
        startDate?: string;
        endDate?: string;
      };

      const whereConditions: any = {};
      if (courseId) whereConditions.courseId = courseId;
      if (quizId) whereConditions.quizId = quizId;
      if (startDate) whereConditions.submittedAt = { gte: new Date(startDate) };
      if (endDate) {
        whereConditions.submittedAt = {
          ...whereConditions.submittedAt,
          lte: new Date(endDate),
        };
      }

      const [totalAttempts, passedAttempts, avgResults] = await Promise.all([
        app.prisma.quizAttempt.count({ where: whereConditions }),
        app.prisma.quizAttempt.count({
          where: { ...whereConditions, passed: true },
        }),
        app.prisma.quizAttempt.aggregate({
          where: whereConditions,
          _avg: {
            scorePercentage: true,
            timeSpentSeconds: true,
          },
        }),
      ]);

      const passRate =
        totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;

      // Get score distribution
      const scoreRanges = [
        { min: 0, max: 20, label: '0-20%' },
        { min: 21, max: 40, label: '21-40%' },
        { min: 41, max: 60, label: '41-60%' },
        { min: 61, max: 80, label: '61-80%' },
        { min: 81, max: 100, label: '81-100%' },
      ];

      const scoreDistribution = await Promise.all(
        scoreRanges.map(async (range) => ({
          range: range.label,
          count: await app.prisma.quizAttempt.count({
            where: {
              ...whereConditions,
              scorePercentage: {
                gte: range.min,
                lte: range.max,
              },
            },
          }),
        }))
      );

      return reply.status(200).send({
        data: {
          totalAttempts,
          passedAttempts,
          averageScore: Math.round(avgResults._avg.scorePercentage || 0),
          passRate: Math.round(passRate),
          averageTimeSpent: Math.round(avgResults._avg.timeSpentSeconds || 0),
          scoreDistribution,
        },
      });
    }
  );
};

export default quizResultsRoutes;
