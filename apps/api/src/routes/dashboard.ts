import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth } from '@/hooks/auth';

const StudentIdParamSchema = z.object({
  studentId: z.string().cuid(),
});

const EnrolledCourseProgressSchema = z.object({
  overallPercentage: z.number(),
  completedDisciplines: z.number(),
  totalDisciplines: z.number(),
  completedModules: z.number(),
  totalModules: z.number(),
  completedLessons: z.number(),
  totalLessons: z.number(),
});

const EnrolledCourseGradesSchema = z.object({
  currentAverage: z.number(),
  lowestGrade: z.number().nullable(),
  highestGrade: z.number().nullable(),
});

const EnrolledCourseAccessSchema = z.object({
  lastAccess: z.string().nullable(),
  totalLogins: z.number(),
});

const EnrolledCourseSchema = z.object({
  courseId: z.string(),
  courseName: z.string(),
  enrollmentDate: z.string(),
  startDate: z.string().nullable(),
  expectedCompletion: z.string().nullable(),
  status: z.string(),
  progress: EnrolledCourseProgressSchema,
  grades: EnrolledCourseGradesSchema,
  access: EnrolledCourseAccessSchema,
});

const UpcomingDeadlineSchema = z.object({
  type: z.string(),
  title: z.string(),
  course: z.string(),
  dueDate: z.string().nullable(),
  daysRemaining: z.number().nullable(),
  status: z.string(),
});

const RecentActivitySchema = z.object({
  type: z.string(),
  lesson: z.string().optional(),
  quiz: z.string().optional(),
  date: z.string(),
  duration: z.number().nullable().optional(),
  score: z.number().optional(),
});

const StudentDashboardResponseSchema = z.object({
  studentId: z.string(),
  studentName: z.string().nullable(),
  studentEmail: z.string(),
  dashboardGeneratedAt: z.string(),
  enrolledCourses: z.array(EnrolledCourseSchema),
  upcomingDeadlines: z.array(UpcomingDeadlineSchema),
  recentActivity: z.array(RecentActivitySchema),
});

const dashboardRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/students/:studentId/dashboard',
    {
      preHandler: [requireAuth],
      schema: {
        params: StudentIdParamSchema,
        response: {
          200: SuccessResponseSchema(StudentDashboardResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get consolidated dashboard data for a student',
        tags: ['Dashboard'],
      },
    },
    async (request, reply) => {
      const { studentId } = request.params;

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
            message: 'You can only view your own dashboard',
            code: 'FORBIDDEN',
          },
        });
      }

      const student = await app.prisma.user.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      const enrollments = await app.prisma.enrollment.findMany({
        where: { studentId },
        include: {
          course: {
            include: {
              disciplines: {
                include: {
                  modules: {
                    include: {
                      lessons: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const progresses = await app.prisma.progress.findMany({
        where: { studentId },
      });

      const recentProgresses = await app.prisma.progress.findMany({
        where: { studentId },
        include: {
          lesson: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      });

      const recentQuizAttempts = await app.prisma.quizAttempt.findMany({
        where: { studentId },
        include: {
          quiz: true,
        },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      });

      const enrolledCourses = enrollments.map((enrollment) => {
        const totalDisciplines = enrollment.course.disciplines.length;
        const totalModules = enrollment.course.disciplines.reduce(
          (sum, d) => sum + d.modules.length,
          0
        );
        const totalLessons = enrollment.course.disciplines.reduce(
          (sum, d) =>
            sum + d.modules.reduce((mSum, m) => mSum + m.lessons.length, 0),
          0
        );

        const courseProgresses = progresses.filter(
          (p) => p.courseId === enrollment.courseId
        );

        const completedLessons = courseProgresses.filter(
          (p) => p.status === 'concluida'
        ).length;

        const overallPercentage =
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

        const progressesWithScore = courseProgresses.filter(
          (p) => p.score !== null
        );
        const currentAverage =
          progressesWithScore.length > 0
            ? progressesWithScore.reduce((sum, p) => sum + (p.score || 0), 0) /
              progressesWithScore.length
            : 0;

        const scores = progressesWithScore.map((p) => p.score || 0);
        const lowestGrade = scores.length > 0 ? Math.min(...scores) : null;
        const highestGrade = scores.length > 0 ? Math.max(...scores) : null;

        const lastProgress = courseProgresses.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];

        return {
          courseId: enrollment.course.id,
          courseName: enrollment.course.nome,
          enrollmentDate: enrollment.enrollmentDate.toISOString(),
          startDate: enrollment.startDate?.toISOString() ?? null,
          expectedCompletion:
            enrollment.expectedCompletionDate?.toISOString() ?? null,
          status: enrollment.status,
          progress: {
            overallPercentage: Math.round(overallPercentage * 10) / 10,
            completedDisciplines: 0,
            totalDisciplines,
            completedModules: 0,
            totalModules,
            completedLessons,
            totalLessons,
          },
          grades: {
            currentAverage: Math.round(currentAverage * 10) / 10,
            lowestGrade,
            highestGrade,
          },
          access: {
            lastAccess: lastProgress?.updatedAt.toISOString() ?? null,
            totalLogins: courseProgresses.length,
          },
        };
      });

      const recentActivity = [
        ...recentProgresses.map((p) => ({
          type: 'aula_concluida',
          lesson: p.lesson.titulo,
          date: p.updatedAt.toISOString(),
          duration: p.watchedMinutes,
        })),
        ...recentQuizAttempts.map((q) => ({
          type: 'quiz_realizado',
          quiz: q.quiz.titulo,
          date: q.submittedAt.toISOString(),
          score: q.score,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      return reply.send({
        data: {
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          dashboardGeneratedAt: new Date().toISOString(),
          enrolledCourses,
          upcomingDeadlines: [],
          recentActivity,
        },
      });
    }
  );
};

export default dashboardRoutes;
