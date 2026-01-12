import type { Discipline, PrismaClient } from '@/generated/client/client.js';

import { BasePrismaRepository } from './base-repository';

export interface DisciplineFilters {
  courseId?: string;
  periodo?: number;
  obrigatoria?: boolean;
  ativo?: boolean;
}

export interface CreateDisciplineData {
  courseId: string;
  codigo: string;
  nome: string;
  ementa?: string;
  cargaHorariaTeorica: number;
  cargaHorariaPratica: number;
  cargaHorariaTotal: number;
  areaConhecimento?: string;
  periodo: number;
  obrigatoria?: boolean;
  objetivos?: string[];
  competencias?: string[];
  prerequisitos?: string[];
  bibliografiaBasica?: string[];
  ativo?: boolean;
}

export class DisciplinesRepository extends BasePrismaRepository<Discipline> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'discipline');
  }

  async findByCourseAndCodigo(
    courseId: string,
    codigo: string
  ): Promise<Discipline | null> {
    return this.prisma.discipline.findUnique({
      where: {
        courseId_codigo: {
          courseId,
          codigo,
        },
      },
    });
  }

  async findByCourse(
    courseId: string,
    filters?: Partial<DisciplineFilters>
  ): Promise<Discipline[]> {
    const where: {
      courseId: string;
      periodo?: number;
      obrigatoria?: boolean;
      ativo?: boolean;
    } = { courseId };

    if (filters?.periodo !== undefined) where.periodo = filters.periodo;
    if (filters?.obrigatoria !== undefined)
      where.obrigatoria = filters.obrigatoria;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;

    return this.prisma.discipline.findMany({
      where,
      orderBy: [{ periodo: 'asc' }, { nome: 'asc' }],
    });
  }

  async findByIdWithModules(id: string): Promise<DisciplineWithModules | null> {
    return this.prisma.discipline.findUnique({
      where: { id },
      include: {
        modules: {
          select: { id: true },
        },
      },
    });
  }
}

export interface DisciplineWithModules extends Discipline {
  modules: { id: string }[];
}
