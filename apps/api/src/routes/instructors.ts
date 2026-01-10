import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth } from '@/hooks/auth';

const InstructorIdParamSchema = z.object({
  instructorId: z.string().cuid(),
});

const DisciplineTeachingSchema = z.object({
  disciplineId: z.string(),
  disciplineName: z.string(),
  totalStudents: z.number(),
  totalModules: z.number(),
  totalLessons: z.number(),
});

const InstructorCourseSchema = z.object({
  courseId: z.string(),
  courseName: z.string(),
  role: z.string(),
  disciplinesTeaching: z.array(DisciplineTeachingSchema),
});

const InstructorStatisticsSchema = z.object({
  totalCourses: z.number(),
  totalDisciplines: z.number(),
  totalStudents: z.number(),
  totalTeachingHours: z.number(),
});

const InstructorCoursesResponseSchema = z.object({
  instructorId: z.string(),
  instructorName: z.string().nullable(),
  instructorEmail: z.string(),
  courses: z.array(InstructorCourseSchema),
  statistics: InstructorStatisticsSchema,
});

const instructorsRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.get(
    '/instructors/:instructorId/courses',
    {
      preHandler: [requireAuth],
      schema: {
        params: InstructorIdParamSchema,
        response: {
          200: SuccessResponseSchema(InstructorCoursesResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get courses and disciplines for an instructor',
        tags: ['Instructors'],
      },
    },
    async (request, reply) => {
      const { instructorId } = request.params;

      const session = await app.auth.api.getSession({
        headers: request.headers as unknown as Headers,
      });

      const currentUser = session?.user as { id: string; role?: string };
      const isAdmin = ['admin', 'super_admin'].includes(
        currentUser?.role || ''
      );

      if (currentUser.id !== instructorId && !isAdmin) {
        return reply.status(403).send({
          error: {
            message: 'You can only view your own courses',
            code: 'FORBIDDEN',
          },
        });
      }

      const instructor = await app.prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        throw new NotFoundError('Instructor not found');
      }

      const coursesAsCoordinator = await app.prisma.course.findMany({
        where: { coordenadorId: instructorId },
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
          enrollments: {
            where: { status: 'ativo' },
          },
        },
      });

      const courses = coursesAsCoordinator.map((course) => {
        const disciplinesTeaching = course.disciplines.map((discipline) => {
          const totalModules = discipline.modules.length;
          const totalLessons = discipline.modules.reduce(
            (sum, m) => sum + m.lessons.length,
            0
          );

          return {
            disciplineId: discipline.id,
            disciplineName: discipline.nome,
            totalStudents: course.enrollments.length,
            totalModules,
            totalLessons,
          };
        });

        return {
          courseId: course.id,
          courseName: course.nome,
          role: 'coordenador',
          disciplinesTeaching,
        };
      });

      const totalStudents = coursesAsCoordinator.reduce(
        (sum, c) => sum + c.enrollments.length,
        0
      );

      const totalTeachingHours = coursesAsCoordinator.reduce(
        (sum, c) => sum + c.cargaHorariaTotal,
        0
      );

      const totalDisciplines = coursesAsCoordinator.reduce(
        (sum, c) => sum + c.disciplines.length,
        0
      );

      return reply.send({
        data: {
          instructorId: instructor.id,
          instructorName: instructor.name,
          instructorEmail: instructor.email,
          courses,
          statistics: {
            totalCourses: courses.length,
            totalDisciplines,
            totalStudents,
            totalTeachingHours,
          },
        },
      });
    }
  );
};

export default instructorsRoutes;
