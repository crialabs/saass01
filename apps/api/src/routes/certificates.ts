import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type { CreateCertificateInput } from '@repo/packages-types/certificate';
import { NotFoundError } from '@repo/packages-utils/errors';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';

const CertificateTypeSchema = z.enum(['conclusao', 'participacao', 'extensao']);

const CertificateStatusSchema = z.enum(['gerado', 'emitido', 'revogado']);

const CreateCertificateBodySchema = z.object({
  studentId: z.string().cuid(),
  courseId: z.string().cuid(),
  certificateType: CertificateTypeSchema,
  issueDate: z.string().datetime().optional(),
  completionDate: z.string().datetime().optional(),
  overallScore: z.number().min(0).max(10).optional(),
  certificateNumber: z.string().min(1),
  studentName: z.string().min(1),
  studentRegistration: z.string().min(1),
  courseName: z.string().min(1),
  courseCode: z.string().min(1),
  totalHours: z.number().int().positive(),
  signatureLine1: z.string().optional(),
  signatureLine1Title: z.string().optional(),
  signatureLine2: z.string().optional(),
  signatureLine2Title: z.string().optional(),
  digitalSignature: z.boolean().default(false),
  digitalSignatureHash: z.string().optional(),
  status: CertificateStatusSchema.default('gerado'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const CertificateResponseSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  courseId: z.string(),
  certificateType: CertificateTypeSchema,
  issueDate: z.string(),
  completionDate: z.string().nullable(),
  overallScore: z.number().nullable(),
  certificateNumber: z.string(),
  studentName: z.string(),
  studentRegistration: z.string(),
  courseName: z.string(),
  courseCode: z.string(),
  totalHours: z.number(),
  signatureLine1: z.string().nullable(),
  signatureLine1Title: z.string().nullable(),
  signatureLine2: z.string().nullable(),
  signatureLine2Title: z.string().nullable(),
  digitalSignature: z.boolean(),
  digitalSignatureHash: z.string().nullable(),
  status: CertificateStatusSchema,
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const certificatesRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/certificates',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        body: CreateCertificateBodySchema,
        response: {
          201: SuccessResponseSchema(CertificateResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
        description: 'Generate a certificate for a student',
        tags: ['Certificates'],
      },
    },
    async (request, reply) => {
      const body = request.body as CreateCertificateInput;

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

      const existingCertificate = await app.prisma.certificate.findUnique({
        where: { certificateNumber: body.certificateNumber },
      });

      if (existingCertificate) {
        return reply.status(409).send({
          error: {
            message: 'Certificate number already exists',
            code: 'CERTIFICATE_NUMBER_EXISTS',
          },
        });
      }

      const certificate = await app.prisma.certificate.create({
        data: {
          studentId: body.studentId,
          courseId: body.courseId,
          certificateType: body.certificateType,
          issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
          completionDate: body.completionDate
            ? new Date(body.completionDate)
            : null,
          overallScore: body.overallScore,
          certificateNumber: body.certificateNumber,
          studentName: body.studentName,
          studentRegistration: body.studentRegistration,
          courseName: body.courseName,
          courseCode: body.courseCode,
          totalHours: body.totalHours,
          signatureLine1: body.signatureLine1,
          signatureLine1Title: body.signatureLine1Title,
          signatureLine2: body.signatureLine2,
          signatureLine2Title: body.signatureLine2Title,
          digitalSignature: body.digitalSignature ?? false,
          digitalSignatureHash: body.digitalSignatureHash,
          status: body.status ?? 'gerado',
          metadata: body.metadata as any,
        },
      });

      return reply.status(201).send({
        data: {
          ...certificate,
          metadata: certificate.metadata as Record<string, unknown>,
          issueDate: certificate.issueDate.toISOString(),
          completionDate: certificate.completionDate?.toISOString() ?? null,
          createdAt: certificate.createdAt.toISOString(),
          updatedAt: certificate.updatedAt.toISOString(),
        },
      });
    }
  );
};

export default certificatesRoutes;
