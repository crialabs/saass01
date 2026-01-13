import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';

const CourseIdQuerySchema = z.object({
  courseId: z.string().cuid(),
});

const CourseAnalyticsResponseSchema = z.object({
  courseId: z.string(),
  courseName: z.string(),
  reportDate: z.string(),
  period: z.string(),
  analytics: z.object({
    enrollment: z.object({
      totalStudents: z.number(),
      activeStudents: z.number(),
      inactiveStudents: z.number(),
      completionRate: z.number(),
      dropoutRate: z.number(),
    }),
    content: z.object({
      totalDisciplines: z.number(),
      totalModules: z.number(),
      totalLessons: z.number(),
      totalVideosHours: z.number(),
      averageLessonDurationMinutes: z.number(),
    }),
    engagement: z.object({
      averageCompletionPercentage: z.number(),
      averageLessonWatchTime: z.number(),
      quizAverageScore: z.number(),
    }),
    performance: z.object({
      averageFinalGrade: z.number(),
      studentsPassedThreshold70: z.number(),
      studentsPassedThreshold80: z.number(),
      studentsPassedThreshold90: z.number(),
    }),
  }),
});

const reportsRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/reports/course-analytics',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        querystring: CourseIdQuerySchema,
        response: {
          200: SuccessResponseSchema(CourseAnalyticsResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get comprehensive analytics for a course',
        tags: ['Reports'],
      },
    },
    async (request, reply) => {
      const { courseId } = request.query;

      const course = await app.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          _count: {
            select: {
              disciplines: true,
              enrollments: true,
              certificates: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      const [enrollments, modules, lessons, progresses, quizAttempts] =
        await Promise.all([
          app.prisma.enrollment.findMany({
            where: { courseId },
          }),
          app.prisma.module.count({
            where: {
              discipline: { courseId },
            },
          }),
          app.prisma.lesson.findMany({
            where: {
              module: {
                discipline: { courseId },
              },
            },
          }),
          app.prisma.progress.findMany({
            where: { courseId },
          }),
          app.prisma.quizAttempt.findMany({
            where: { courseId },
          }),
        ]);

      const activeEnrollments = enrollments.filter(
        (e) => e.status === 'ativo'
      ).length;
      const completedEnrollments = enrollments.filter(
        (e) => e.status === 'concluido'
      ).length;
      const totalEnrollments = enrollments.length;

      const totalVideosMinutes = lessons
        .filter((l) => l.duracaoMinutos)
        .reduce((sum, l) => sum + (l.duracaoMinutos || 0), 0);

      const averageCompletion =
        progresses.length > 0
          ? progresses.reduce((sum, p) => sum + p.completionPercentage, 0) /
            progresses.length
          : 0;

      const averageWatchTime =
        progresses.filter((p) => p.watchedMinutes).length > 0
          ? progresses
              .filter((p) => p.watchedMinutes)
              .reduce((sum, p) => sum + (p.watchedMinutes || 0), 0) /
            progresses.filter((p) => p.watchedMinutes).length
          : 0;

      const averageQuizScore =
        quizAttempts.length > 0
          ? quizAttempts.reduce((sum, q) => sum + q.score, 0) /
            quizAttempts.length
          : 0;

      const progressesWithScore = progresses.filter((p) => p.score !== null);
      const averageGrade =
        progressesWithScore.length > 0
          ? progressesWithScore.reduce((sum, p) => sum + (p.score || 0), 0) /
            progressesWithScore.length
          : 0;

      const studentsAbove70 = progressesWithScore.filter(
        (p) => (p.score || 0) >= 7
      ).length;
      const studentsAbove80 = progressesWithScore.filter(
        (p) => (p.score || 0) >= 8
      ).length;
      const studentsAbove90 = progressesWithScore.filter(
        (p) => (p.score || 0) >= 9
      ).length;

      const completionRate =
        totalEnrollments > 0
          ? (completedEnrollments / totalEnrollments) * 100
          : 0;
      const dropoutRate = 100 - completionRate;

      return reply.send({
        data: {
          courseId: course.id,
          courseName: course.nome,
          reportDate: new Date().toISOString().split('T')[0],
          period: `${course.createdAt.toISOString().split('T')[0]} até hoje`,
          analytics: {
            enrollment: {
              totalStudents: totalEnrollments,
              activeStudents: activeEnrollments,
              inactiveStudents: totalEnrollments - activeEnrollments,
              completionRate: Math.round(completionRate * 10) / 10,
              dropoutRate: Math.round(dropoutRate * 10) / 10,
            },
            content: {
              totalDisciplines: course._count.disciplines,
              totalModules: modules,
              totalLessons: lessons.length,
              totalVideosHours: Math.round((totalVideosMinutes / 60) * 10) / 10,
              averageLessonDurationMinutes:
                lessons.length > 0
                  ? Math.round((totalVideosMinutes / lessons.length) * 10) / 10
                  : 0,
            },
            engagement: {
              averageCompletionPercentage:
                Math.round(averageCompletion * 10) / 10,
              averageLessonWatchTime: Math.round(averageWatchTime * 10) / 10,
              quizAverageScore: Math.round(averageQuizScore * 10) / 10,
            },
            performance: {
              averageFinalGrade: Math.round(averageGrade * 10) / 10,
              studentsPassedThreshold70: studentsAbove70,
              studentsPassedThreshold80: studentsAbove80,
              studentsPassedThreshold90: studentsAbove90,
            },
          },
        },
      });
    }
  );
};

export default reportsRoutes;
