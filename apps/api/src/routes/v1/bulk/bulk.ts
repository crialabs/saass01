import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '@repo/packages-types/api-response';
import type { FastifyPluginAsync } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { requireAuth, requireRole } from '@/hooks/auth';

const CourseLevelSchema = z.enum(['tecnico', 'graduacao', 'pos_graduacao']);
const CourseGradeSchema = z.enum(['tecnologo', 'bacharelado', 'licenciatura']);
const CourseModalitySchema = z.enum(['presencial', 'ead', 'hibrido']);
const CourseStatusSchema = z.enum(['rascunho', 'publicado', 'arquivado']);

const BulkCourseSchema = z.object({
  codigo: z.string().min(1),
  nome: z.string().min(1),
  descricao: z.string().optional(),
  descricaoCurta: z.string().optional(),
  cargaHorariaTotal: z.number().int().positive(),
  cargaHorariaMinima: z.number().int().positive().optional(),
  nivel: CourseLevelSchema,
  grau: CourseGradeSchema.optional(),
  duracaoSemestres: z.number().int().positive(),
  modality: CourseModalitySchema.default('presencial'),
  status: CourseStatusSchema.default('rascunho'),
  ativo: z.boolean().default(true),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  coordenadorId: z.string().optional(),
  dataInicioVigencia: z.string().datetime().optional(),
  thumbnailPath: z.string().optional(),
  bannerPath: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
});

const BulkImportCoursesBodySchema = z.object({
  action: z.literal('bulk_import'),
  institutionId: z.string().optional(),
  institutionName: z.string().optional(),
  importDate: z.string().datetime().optional(),
  courses: z.array(BulkCourseSchema).min(1).max(100),
});

const BulkImportResponseSchema = z.object({
  action: z.string(),
  institutionId: z.string().nullable(),
  institutionName: z.string().nullable(),
  importDate: z.string(),
  validation: z.object({
    totalCourses: z.number(),
    validCourses: z.number(),
    invalidCourses: z.number(),
    duplicateCodes: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
  importedCourses: z.array(z.string()),
});

const bulkRoutes: FastifyPluginAsync = async (app) => {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/bulk/import-courses',
    {
      preHandler: [requireAuth, requireRole(['admin', 'super_admin'])],
      schema: {
        body: BulkImportCoursesBodySchema,
        response: {
          201: SuccessResponseSchema(BulkImportResponseSchema),
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        description: 'Bulk import courses with validation',
        tags: ['Bulk Operations'],
      },
    },
    async (request, reply) => {
      const body = request.body;

      const courseCodes = body.courses.map((c: { codigo: string }) => c.codigo);
      const duplicateCodesInPayload = courseCodes.filter(
        (code, index) => courseCodes.indexOf(code) !== index
      );

      const existingCourses = await app.prisma.course.findMany({
        where: {
          codigo: { in: courseCodes },
        },
        select: { codigo: true },
      });

      const existingCodes = existingCourses.map(
        (c: { codigo: string }) => c.codigo
      );
      const allDuplicates = [
        ...new Set([...duplicateCodesInPayload, ...existingCodes]),
      ];

      const validCourses = body.courses.filter(
        (c: { codigo: string }) => !allDuplicates.includes(c.codigo)
      );

      const warnings: string[] = [];
      if (allDuplicates.length > 0) {
        warnings.push(
          `${allDuplicates.length} course(s) skipped due to duplicate codes`
        );
      }

      const importedIds: string[] = [];

      if (validCourses.length > 0) {
        const createdCourses = await app.prisma.$transaction(
          validCourses.map((course) =>
            app.prisma.course.create({
              data: {
                codigo: course.codigo,
                nome: course.nome,
                descricao: course.descricao,
                descricaoCurta: course.descricaoCurta,
                cargaHorariaTotal: course.cargaHorariaTotal,
                cargaHorariaMinima: course.cargaHorariaMinima,
                nivel: course.nivel,
                grau: course.grau,
                duracaoSemestres: course.duracaoSemestres,
                modality: course.modality ?? 'presencial',
                status: course.status ?? 'rascunho',
                ativo: course.ativo ?? true,
                categoryId: course.categoryId,
                subcategoryId: course.subcategoryId,
                coordenadorId: course.coordenadorId,
                dataInicioVigencia: course.dataInicioVigencia
                  ? new Date(course.dataInicioVigencia)
                  : null,
                thumbnailPath: course.thumbnailPath,
                bannerPath: course.bannerPath,
                customFields: course.customFields as any,
              },
            })
          )
        );

        importedIds.push(...createdCourses.map((c: { id: string }) => c.id));
      }

      return reply.status(201).send({
        data: {
          action: 'bulk_import',
          institutionId: body.institutionId ?? null,
          institutionName: body.institutionName ?? null,
          importDate: body.importDate ?? new Date().toISOString(),
          validation: {
            totalCourses: body.courses.length,
            validCourses: validCourses.length,
            invalidCourses: body.courses.length - validCourses.length,
            duplicateCodes: allDuplicates,
            warnings,
          },
          importedCourses: importedIds,
        },
      });
    }
  );
};

export default bulkRoutes;
