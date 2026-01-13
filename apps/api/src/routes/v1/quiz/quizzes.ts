import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type { CreateQuizInput, QuizQuestion } from '@repo/packages-types/quiz';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';

const QuestionTypeSchema = z.enum([
  'multipla_escolha',
  'verdadeiro_falso',
  'dissertativa',
  'correspondencia',
]);

const QuestionOptionSchema = z.object({
  texto: z.string().min(1),
  correta: z.boolean(),
  feedback: z.string().optional(),
});

const QuizQuestionSchema = z.object({
  enunciado: z.string().min(1),
  tipo: QuestionTypeSchema,
  ordem: z.number().int().positive(),
  pontos: z.number().int().positive(),
  obrigatoria: z.boolean().default(true),
  explicacao: z.string().optional(),
  opcoes: z.array(QuestionOptionSchema).min(1),
});

const CreateQuizBodySchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  instrucoes: z.string().optional(),
  tempoLimiteMinutos: z.number().int().positive().optional(),
  notaMinimaAprovacao: z.number().min(0).max(100),
  tentativasMaximas: z.number().int().positive().default(3),
  ordemAleatoria: z.boolean().default(false),
  mostrarRespostaImediata: z.boolean().default(false),
  mostrarGabaritoFinal: z.boolean().default(true),
  permitirRevisao: z.boolean().default(true),
  pontuacaoTotal: z.number().int().positive(),
  questoes: z.array(QuizQuestionSchema).min(1),
});

const LessonIdParamSchema = z.object({
  lessonId: z.string().cuid(),
});

const QuizIdParamSchema = z.object({
  quizId: z.string().cuid(),
});

const QuizResponseSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  titulo: z.string(),
  descricao: z.string().nullable(),
  instrucoes: z.string().nullable(),
  tempoLimiteMinutos: z.number().nullable(),
  notaMinimaAprovacao: z.number(),
  tentativasMaximas: z.number(),
  ordemAleatoria: z.boolean(),
  mostrarRespostaImediata: z.boolean(),
  mostrarGabaritoFinal: z.boolean(),
  permitirRevisao: z.boolean(),
  pontuacaoTotal: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const quizzesRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/lessons/:lessonId/quizzes',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        params: LessonIdParamSchema,
        body: CreateQuizBodySchema,
        response: {
          201: SuccessResponseSchema(QuizResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Create a quiz with questions for a lesson',
        tags: ['Quizzes'],
      },
    },
    async (request, reply) => {
      const { lessonId } = request.params;
      const body = request.body as CreateQuizInput;

      const lesson = await app.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      const quiz = await app.prisma.quiz.create({
        data: {
          lessonId,
          titulo: body.titulo,
          descricao: body.descricao,
          instrucoes: body.instrucoes,
          tempoLimiteMinutos: body.tempoLimiteMinutos,
          notaMinimaAprovacao: body.notaMinimaAprovacao,
          tentativasMaximas: body.tentativasMaximas ?? 3,
          ordemAleatoria: body.ordemAleatoria ?? false,
          mostrarRespostaImediata: body.mostrarRespostaImediata ?? false,
          mostrarGabaritoFinal: body.mostrarGabaritoFinal ?? true,
          permitirRevisao: body.permitirRevisao ?? true,
          pontuacaoTotal: body.pontuacaoTotal,
          questions: {
            create: body.questoes.map((q: QuizQuestion) => ({
              enunciado: q.enunciado,
              tipo: q.tipo,
              ordem: q.ordem,
              pontos: q.pontos,
              obrigatoria: q.obrigatoria ?? true,
              explicacao: q.explicacao,
              options: {
                create: q.opcoes.map((opt, idx) => ({
                  texto: opt.texto,
                  correta: opt.correta,
                  feedback: opt.feedback,
                  ordem: idx + 1,
                })),
              },
            })),
          },
        },
      });

      return reply.status(201).send({
        data: {
          ...quiz,
          createdAt: quiz.createdAt.toISOString(),
          updatedAt: quiz.updatedAt.toISOString(),
        },
      });
    }
  );

  // GET /api/lessons/:lessonId/quizzes - Get quizzes for lesson
  server.get(
    '/lessons/:lessonId/quizzes',
    {
      preHandler: [requireAuth],
      schema: {
        params: LessonIdParamSchema,
        response: {
          200: SuccessResponseSchema(z.array(QuizResponseSchema)),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get all quizzes for a lesson',
        tags: ['Quizzes'],
      },
    },
    async (request, reply) => {
      const { lessonId } = request.params;

      const lesson = await app.prisma.lesson.findUnique({
        where: { id: lessonId },
      });

      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }

      const quizzes = await app.prisma.quiz.findMany({
        where: { lessonId },
        orderBy: { createdAt: 'asc' },
      });

      return reply.status(200).send({
        data: quizzes.map((quiz) => ({
          ...quiz,
          createdAt: quiz.createdAt.toISOString(),
          updatedAt: quiz.updatedAt.toISOString(),
        })),
      });
    }
  );

  // GET /api/quizzes/:quizId - Get quiz by ID with questions
  server.get(
    '/quizzes/:quizId',
    {
      preHandler: [requireAuth],
      schema: {
        params: QuizIdParamSchema,
        querystring: z.object({
          includeQuestions: z.boolean().optional(),
          studentId: z.string().cuid().optional(), // For including attempts
        }),
        response: {
          200: SuccessResponseSchema(
            QuizResponseSchema.extend({
              questions: z
                .array(
                  z.object({
                    id: z.string(),
                    enunciado: z.string(),
                    tipo: QuestionTypeSchema,
                    ordem: z.number(),
                    pontos: z.number(),
                    obrigatoria: z.boolean(),
                    explicacao: z.string().nullable(),
                    options: z
                      .array(
                        z.object({
                          id: z.string(),
                          texto: z.string(),
                          ordem: z.number(),
                          // Note: We don't include 'correta' and 'feedback' for students
                        })
                      )
                      .optional(),
                  })
                )
                .optional(),
              attempts: z
                .array(
                  z.object({
                    id: z.string(),
                    nota: z.number(),
                    aprovado: z.boolean(),
                    tentativa: z.number(),
                    iniciadoEm: z.string(),
                    finalizadoEm: z.string().nullable(),
                  })
                )
                .optional(),
            })
          ),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get quiz by ID',
        tags: ['Quizzes'],
      },
    },
    async (request, reply) => {
      const { quizId } = request.params;
      const { includeQuestions, studentId } = request.query as {
        includeQuestions?: boolean;
        studentId?: string;
      };

      const session = (request as any).session;
      const isAdmin =
        session?.user?.role &&
        ['admin', 'super_admin'].includes(session.user.role);

      const include: any = {};

      if (includeQuestions === true) {
        include.questions = {
          select: {
            id: true,
            enunciado: true,
            tipo: true,
            ordem: true,
            pontos: true,
            obrigatoria: true,
            explicacao: true,
            options: {
              select: {
                id: true,
                texto: true,
                ordem: true,
                // Only include correct answer for admins
                ...(isAdmin && {
                  correta: true,
                  feedback: true,
                }),
              },
              orderBy: { ordem: 'asc' },
            },
          },
          orderBy: { ordem: 'asc' },
        };
      }

      if (studentId && isAdmin) {
        include.attempts = {
          where: { studentId },
          select: {
            id: true,
            nota: true,
            aprovado: true,
            tentativa: true,
            iniciadoEm: true,
            finalizadoEm: true,
          },
          orderBy: { tentativa: 'asc' },
        };
      }

      const quiz = await app.prisma.quiz.findUnique({
        where: { id: quizId },
        include,
      });

      if (!quiz) {
        throw new NotFoundError('Quiz not found');
      }

      const responseData: any = {
        ...quiz,
        createdAt: quiz.createdAt.toISOString(),
        updatedAt: quiz.updatedAt.toISOString(),
      };

      if ((quiz as any).questions) {
        responseData.questions = (quiz as any).questions;
      }

      if ((quiz as any).attempts) {
        responseData.attempts = (quiz as any).attempts.map((attempt: any) => ({
          ...attempt,
          iniciadoEm: attempt.iniciadoEm.toISOString(),
          finalizadoEm: attempt.finalizadoEm?.toISOString() ?? null,
        }));
      }

      return reply.status(200).send({ data: responseData });
    }
  );
};

export default quizzesRoutes;
