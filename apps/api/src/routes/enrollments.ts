import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type { CreateEnrollmentInput } from '@repo/packages-types/enrollment';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';
import { buildPaginationResponse, buildPrismaQuery } from '@/utils/pagination';

const EnrollmentStatusSchema = z.enum([
  'ativo',
  'suspenso',
  'concluido',
  'cancelado',
  'trancado',
]);

const CreateEnrollmentBodySchema = z.object({
  studentId: z.string().cuid(),
  courseId: z.string().cuid(),
  enrollmentDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  expectedCompletionDate: z.string().datetime().optional(),
  status: EnrollmentStatusSchema.default('ativo'),
  paymentMethod: z.string().optional(),
  installments: z.number().int().positive().optional(),
  scholarshipPercentage: z.number().min(0).max(100).default(0),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const EnrollmentIdParamSchema = z.object({
  enrollmentId: z.string().cuid(),
});

const StudentIdParamSchema = z.object({
  studentId: z.string().cuid(),
});

const EnrollmentResponseSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  courseId: z.string(),
  enrollmentDate: z.string(),
  startDate: z.string().nullable(),
  expectedCompletionDate: z.string().nullable(),
  status: EnrollmentStatusSchema,
  paymentMethod: z.string().nullable(),
  installments: z.number().nullable(),
  scholarshipPercentage: z.number(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const enrollmentsRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/students/enroll',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        body: CreateEnrollmentBodySchema,
        response: {
          201: SuccessResponseSchema(EnrollmentResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
        description: 'Enroll a student in a course',
        tags: ['Enrollments'],
      },
    },
    async (request, reply) => {
      const body = request.body as CreateEnrollmentInput;

      const [student, course] = await Promise.all([
        app.prisma.user.findUnique({ where: { id: body.studentId } }),
        app.prisma.course.findUnique({ where: { id: body.courseId } }),
      ]);

      if (!student) {
        throw new NotFoundError('Student not found');
      }

      if (!course) {
        throw new NotFoundError('Course not found');
      }

      const existingEnrollment = await app.prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: body.studentId,
            courseId: body.courseId,
          },
        },
      });

      if (existingEnrollment) {
        return reply.status(409).send({
          error: {
            message: 'Student already enrolled in this course',
            code: 'ENROLLMENT_EXISTS',
          },
        });
      }

      const enrollment = await app.prisma.enrollment.create({
        data: {
          studentId: body.studentId,
          courseId: body.courseId,
          enrollmentDate: body.enrollmentDate
            ? new Date(body.enrollmentDate)
            : new Date(),
          startDate: body.startDate ? new Date(body.startDate) : null,
          expectedCompletionDate: body.expectedCompletionDate
            ? new Date(body.expectedCompletionDate)
            : null,
          status: body.status ?? 'ativo',
          paymentMethod: body.paymentMethod,
          installments: body.installments,
          scholarshipPercentage: body.scholarshipPercentage ?? 0,
          contactEmail: body.contactEmail,
          contactPhone: body.contactPhone,
          metadata: body.metadata as any,
        },
      });

      return reply.status(201).send({
        data: {
          ...enrollment,
          metadata: enrollment.metadata as Record<string, unknown>,
          enrollmentDate: enrollment.enrollmentDate.toISOString(),
          startDate: enrollment.startDate?.toISOString() ?? null,
          expectedCompletionDate:
            enrollment.expectedCompletionDate?.toISOString() ?? null,
          createdAt: enrollment.createdAt.toISOString(),
          updatedAt: enrollment.updatedAt.toISOString(),
        },
      });
    }
  );

  // GET /api/enrollments - List enrollments with pagination
  server.get(
    '/enrollments',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        querystring: z.object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(20),
          status: EnrollmentStatusSchema.optional(),
          courseId: z.string().cuid().optional(),
          studentId: z.string().cuid().optional(),
          search: z.string().optional(),
        }),
        response: {
          200: SuccessResponseSchema(
            z.object({
              data: z.array(
                EnrollmentResponseSchema.extend({
                  student: z
                    .object({
                      id: z.string(),
                      name: z.string().nullable(),
                      email: z.string(),
                    })
                    .optional(),
                  course: z
                    .object({
                      id: z.string(),
                      nome: z.string(),
                      codigo: z.string().nullable(),
                    })
                    .optional(),
                })
              ),
              pagination: z.object({
                page: z.number(),
                limit: z.number(),
                total: z.number(),
                totalPages: z.number(),
                hasNext: z.boolean(),
                hasPrev: z.boolean(),
              }),
            })
          ),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        description: 'List all enrollments',
        tags: ['Enrollments'],
      },
    },
    async (request, reply) => {
      const {
        page = 1,
        limit = 20,
        status,
        courseId,
        studentId,
        search,
      } = request.query as {
        page?: number;
        limit?: number;
        status?: string;
        courseId?: string;
        studentId?: string;
        search?: string;
      };

      const whereConditions: Record<string, unknown> = {};
      if (status) whereConditions.status = status;
      if (courseId) whereConditions.courseId = courseId;
      if (studentId) whereConditions.studentId = studentId;

      if (search) {
        whereConditions.OR = [
          { student: { name: { contains: search, mode: 'insensitive' } } },
          { student: { email: { contains: search, mode: 'insensitive' } } },
          { course: { nome: { contains: search, mode: 'insensitive' } } },
          { course: { codigo: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const { skip, take } = buildPrismaQuery({ page, limit });

      const [enrollments, total] = await Promise.all([
        app.prisma.enrollment.findMany({
          where: whereConditions,
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            course: {
              select: {
                id: true,
                nome: true,
                codigo: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        app.prisma.enrollment.count({ where: whereConditions }),
      ]);

      const formattedEnrollments = enrollments.map((enrollment) => ({
        ...enrollment,
        metadata: enrollment.metadata as Record<string, unknown>,
        enrollmentDate: enrollment.enrollmentDate.toISOString(),
        startDate: enrollment.startDate?.toISOString() ?? null,
        expectedCompletionDate:
          enrollment.expectedCompletionDate?.toISOString() ?? null,
        createdAt: enrollment.createdAt.toISOString(),
        updatedAt: enrollment.updatedAt.toISOString(),
      }));

      return reply.status(200).send({
        data: {
          data: formattedEnrollments,
          pagination: buildPaginationResponse(total, page, limit),
        },
      });
    }
  );

  // GET /api/students/:studentId/enrollments - Get student enrollments
  server.get(
    '/students/:studentId/enrollments',
    {
      preHandler: [requireAuth],
      schema: {
        params: StudentIdParamSchema,
        querystring: z.object({
          status: EnrollmentStatusSchema.optional(),
          includeProgress: z.boolean().optional(),
        }),
        response: {
          200: SuccessResponseSchema(
            z.array(
              EnrollmentResponseSchema.extend({
                course: z.object({
                  id: z.string(),
                  nome: z.string(),
                  codigo: z.string().nullable(),
                  cargaHorariaTotal: z.number(),
                  modality: z.string(),
                }),
                progressSummary: z
                  .object({
                    totalLessons: z.number(),
                    completedLessons: z.number(),
                    progressPercentage: z.number(),
                  })
                  .optional(),
              })
            )
          ),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get enrollments for a student',
        tags: ['Enrollments'],
      },
    },
    async (request, reply) => {
      const { studentId } = request.params;
      const { status, includeProgress } = request.query as {
        status?: string;
        includeProgress?: boolean;
      };

      // Authorization check
      const session = (request as any).session;
      const isAdmin =
        session?.user?.role &&
        ['admin', 'super_admin'].includes(session.user.role);

      if (!isAdmin && session?.user?.id !== studentId) {
        return reply.status(403).send({
          error: {
            message: 'You can only view your own enrollments',
            code: 'FORBIDDEN',
          },
        });
      }

      const whereConditions: any = { studentId };
      if (status) whereConditions.status = status;

      const enrollments = await app.prisma.enrollment.findMany({
        where: whereConditions,
        include: {
          course: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              cargaHorariaTotal: true,
              modality: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      let formattedEnrollments: any[] = enrollments.map((enrollment) => ({
        ...enrollment,
        metadata: enrollment.metadata as Record<string, unknown>,
        enrollmentDate: enrollment.enrollmentDate.toISOString(),
        startDate: enrollment.startDate?.toISOString() ?? null,
        expectedCompletionDate:
          enrollment.expectedCompletionDate?.toISOString() ?? null,
        createdAt: enrollment.createdAt.toISOString(),
        updatedAt: enrollment.updatedAt.toISOString(),
      }));

      // Include progress summary if requested
      if (includeProgress) {
        const courseIds = formattedEnrollments.map((e) => e.courseId);

        // Get all lesson counts for all courses in a single query with groupBy
        const lessonCounts = await app.prisma.lesson.groupBy({
          by: ['moduleId'],
          where: {
            module: {
              discipline: {
                courseId: { in: courseIds },
              },
            },
          },
          _count: { id: true },
        });

        // Get module to course mapping
        const modules = await app.prisma.module.findMany({
          where: {
            discipline: {
              courseId: { in: courseIds },
            },
          },
          select: {
            id: true,
            discipline: {
              select: {
                courseId: true,
              },
            },
          },
        });

        const moduleToCourse = new Map<string, string>(
          modules.map((m): [string, string] => [m.id, m.discipline.courseId])
        );

        const totalLessonsByCourse = new Map<string, number>();
        lessonCounts.forEach((lc) => {
          const courseId = moduleToCourse.get(lc.moduleId);
          if (courseId) {
            totalLessonsByCourse.set(
              courseId,
              (totalLessonsByCourse.get(courseId) || 0) + lc._count.id
            );
          }
        });

        // Get all completed progress counts for all courses in a single query
        const completedProgress = await app.prisma.progress.groupBy({
          by: ['lessonId'],
          where: {
            studentId,
            status: 'concluida',
            lesson: {
              module: {
                discipline: {
                  courseId: { in: courseIds },
                },
              },
            },
          },
          _count: { id: true },
        });

        // Get lesson to course mapping
        const lessons = await app.prisma.lesson.findMany({
          where: {
            module: {
              discipline: {
                courseId: { in: courseIds },
              },
            },
          },
          select: {
            id: true,
            module: {
              select: {
                discipline: {
                  select: {
                    courseId: true,
                  },
                },
              },
            },
          },
        });

        const lessonToCourse = new Map<string, string>(
          lessons.map((l): [string, string] => [
            l.id,
            l.module.discipline.courseId,
          ])
        );

        const completedLessonsByCourse = new Map<string, number>();
        completedProgress.forEach((cp) => {
          const courseId = lessonToCourse.get(cp.lessonId);
          if (courseId) {
            completedLessonsByCourse.set(
              courseId,
              (completedLessonsByCourse.get(courseId) || 0) + cp._count.id
            );
          }
        });

        // Add progress summary to each enrollment
        formattedEnrollments = formattedEnrollments.map((enrollment: any) => {
          const totalLessons =
            totalLessonsByCourse.get(enrollment.courseId) || 0;
          const completedLessons =
            completedLessonsByCourse.get(enrollment.courseId) || 0;
          const progressPercentage =
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;

          return {
            ...enrollment,
            progressSummary: {
              totalLessons,
              completedLessons,
              progressPercentage,
            },
          };
        });
      }

      return reply.status(200).send({ data: formattedEnrollments });
    }
  );

  // GET /api/enrollments/:enrollmentId - Get enrollment by ID
  server.get(
    '/enrollments/:enrollmentId',
    {
      preHandler: [requireAuth],
      schema: {
        params: EnrollmentIdParamSchema,
        response: {
          200: SuccessResponseSchema(
            EnrollmentResponseSchema.extend({
              student: z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string(),
              }),
              course: z.object({
                id: z.string(),
                nome: z.string(),
                codigo: z.string(),
                cargaHorariaTotal: z.number().nullable(),
                modality: z.string(),
              }),
            })
          ),
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        description: 'Get enrollment by ID',
        tags: ['Enrollments'],
      },
    },
    async (request, reply) => {
      const { enrollmentId } = request.params;

      const enrollment = await app.prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              cargaHorariaTotal: true,
              modality: true,
            },
          },
        },
      });

      if (!enrollment) {
        throw new NotFoundError('Enrollment not found');
      }

      // Authorization check
      const session = (request as any).session;
      const isAdmin =
        session?.user?.role &&
        ['admin', 'super_admin'].includes(session.user.role);

      if (!isAdmin && session?.user?.id !== enrollment.studentId) {
        return reply.status(403).send({
          error: {
            message: 'You can only view your own enrollment',
            code: 'FORBIDDEN',
          },
        });
      }

      return reply.status(200).send({
        data: {
          ...enrollment,
          metadata: enrollment.metadata as Record<string, unknown>,
          enrollmentDate: enrollment.enrollmentDate.toISOString(),
          startDate: enrollment.startDate?.toISOString() ?? null,
          expectedCompletionDate:
            enrollment.expectedCompletionDate?.toISOString() ?? null,
          createdAt: enrollment.createdAt.toISOString(),
          updatedAt: enrollment.updatedAt.toISOString(),
        },
      });
    }
  );
};

export default enrollmentsRoutes;
