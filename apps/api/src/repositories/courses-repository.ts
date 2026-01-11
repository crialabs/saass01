import type {
  Course,
  CourseGrade,
  CourseLevel,
  CourseModality,
  CourseStatus,
  PrismaClient,
} from '@/generated/client/client.js';
import type { JsonValue } from '@/generated/client/internal/prismaNamespace.js';

import { BasePrismaRepository } from './base-repository';

export interface CourseFilters {
  status?: CourseStatus;
  nivel?: CourseLevel;
  modality?: CourseModality;
  coordenadorId?: string;
  ativo?: boolean;
  search?: string;
}

export interface CreateCourseData {
  codigo: string;
  nome: string;
  descricao?: string;
  descricaoCurta?: string;
  cargaHorariaTotal: number;
  cargaHorariaMinima?: number;
  nivel: CourseLevel;
  grau?: CourseGrade;
  duracaoSemestres: number;
  modality?: CourseModality;
  status?: CourseStatus;
  ativo?: boolean;
  categoryId?: string;
  subcategoryId?: string;
  coordenadorId?: string;
  dataInicioVigencia?: Date;
  thumbnailPath?: string;
  bannerPath?: string;
  customFields?: JsonValue;
}

export interface CourseWithDependencies extends Course {
  enrollments: { id: string }[];
  disciplines: { id: string }[];
}

export class CoursesRepository extends BasePrismaRepository<Course> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'course');
  }

  async findByCodigo(codigo: string): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { codigo },
    });
  }

  async findWithFilters(
    filters: CourseFilters,
    skip: number,
    take: number
  ): Promise<{ courses: Course[]; total: number }> {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.nivel) where.nivel = filters.nivel;
    if (filters.modality) where.modality = filters.modality;
    if (filters.coordenadorId) where.coordenadorId = filters.coordenadorId;
    if (filters.ativo !== undefined) where.ativo = filters.ativo;

    if (filters.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { descricao: { contains: filters.search, mode: 'insensitive' } },
        { codigo: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { courses, total };
  }

  async findByIdWithDependencies(
    id: string
  ): Promise<CourseWithDependencies | null> {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: { select: { id: true } },
        disciplines: { select: { id: true } },
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.course.update({
      where: { id },
      data: { ativo: false },
    });
  }
}
