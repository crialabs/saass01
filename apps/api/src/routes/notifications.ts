import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';

const NotificationFiltersSchema = z.object({
  courseId: z.string().cuid().optional(),
  enrollmentStatus: z.string().optional(),
  lastAccessDays: z.string().optional(),
});

const NotificationMessageSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
});

const NotificationSchedulingSchema = z.object({
  sendImmediately: z.boolean().default(true),
  scheduledTime: z.string().datetime().nullable().optional(),
});

const SendBatchNotificationBodySchema = z.object({
  notificationType: z.string().min(1),
  targetAudience: z.enum(['students', 'instructors', 'all']),
  filters: NotificationFiltersSchema.optional(),
  message: NotificationMessageSchema,
  scheduling: NotificationSchedulingSchema.default({
    sendImmediately: true,
  }),
  channels: z.array(z.enum(['email', 'push_notification', 'sms'])).min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const BatchNotificationResponseSchema = z.object({
  notificationType: z.string(),
  targetAudience: z.string(),
  totalRecipients: z.number(),
  channels: z.array(z.string()),
  scheduledFor: z.string().nullable(),
  status: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

const notificationsRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/notifications/send-batch',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        body: SendBatchNotificationBodySchema,
        response: {
          201: SuccessResponseSchema(BatchNotificationResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        description: 'Send batch notifications to filtered audience',
        tags: ['Notifications'],
      },
    },
    async (request, reply) => {
      const body = request.body;

      let recipients: string[] = [];

      if (body.targetAudience === 'students') {
        const query: Record<string, unknown> = {};

        if (body.filters?.courseId) {
          query.courseId = body.filters.courseId;
        }

        if (body.filters?.enrollmentStatus) {
          query.status = body.filters.enrollmentStatus;
        }

        const enrollments = await app.prisma.enrollment.findMany({
          where: query,
          include: {
            student: {
              select: {
                email: true,
              },
            },
          },
        });

        recipients = enrollments.map(
          (e: { student: { email: string } }) => e.student.email
        );
      } else if (body.targetAudience === 'instructors') {
        const instructors = await app.prisma.user.findMany({
          where: {
            role: {
              in: ['admin', 'super_admin'],
            },
          },
          select: {
            email: true,
          },
        });

        recipients = instructors.map((i: { email: string }) => i.email);
      } else {
        const allUsers = await app.prisma.user.findMany({
          select: {
            email: true,
          },
        });

        recipients = allUsers.map((u: { email: string }) => u.email);
      }

      app.log.info({
        notificationType: body.notificationType,
        recipients: recipients.length,
        channels: body.channels,
        message: body.message.title,
      });

      return reply.status(201).send({
        data: {
          notificationType: body.notificationType,
          targetAudience: body.targetAudience,
          totalRecipients: recipients.length,
          channels: body.channels,
          scheduledFor: body.scheduling?.scheduledTime ?? null,
          status: body.scheduling?.sendImmediately ? 'sent' : 'scheduled',
          metadata: body.metadata ?? null,
        },
      });
    }
  );
};

export default notificationsRoutes;
