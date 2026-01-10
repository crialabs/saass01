import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@repo/packages-utils/errors';

import type { LoggerService } from '@/common/logger.service';
import type { Discipline } from '@/generated/client/client.js';
import type { CoursesRepository } from '@/repositories/courses-repository';
import type {
  CreateDisciplineData,
  DisciplineFilters,
  DisciplinesRepository,
} from '@/repositories/disciplines-repository';

export interface UpdateDisciplineData {
  codigo?: string;
  nome?: string;
  ementa?: string;
  cargaHorariaTeorica?: number;
  cargaHorariaPratica?: number;
  cargaHorariaTotal?: number;
  areaConhecimento?: string;
  periodo?: number;
  obrigatoria?: boolean;
  objetivos?: string[];
  competencias?: string[];
  prerequisitos?: string[];
  bibliografiaBasica?: string[];
  ativo?: boolean;
}

export class DisciplinesService {
  constructor(
    private readonly repository: DisciplinesRepository,
    private readonly coursesRepository: CoursesRepository,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext('DisciplinesService');
  }

  async createDiscipline(data: CreateDisciplineData): Promise<Discipline> {
    this.logger.info('Creating discipline', {
      courseId: data.courseId,
      codigo: data.codigo,
    });

    const course = await this.coursesRepository.findById(data.courseId);
    if (!course) {
      throw new NotFoundError('Course not found', { courseId: data.courseId });
    }

    const existingDiscipline = await this.repository.findByCourseAndCodigo(
      data.courseId,
      data.codigo
    );
    if (existingDiscipline) {
      throw new ConflictError(
        'Discipline with this code already exists in this course',
        { courseId: data.courseId, codigo: data.codigo }
      );
    }

    const discipline = await this.repository.create({
      ...data,
      obrigatoria: data.obrigatoria ?? true,
      ativo: data.ativo ?? true,
      objetivos: data.objetivos ?? [],
      competencias: data.competencias ?? [],
      prerequisitos: data.prerequisitos ?? [],
      bibliografiaBasica: data.bibliografiaBasica ?? [],
    });

    this.logger.info('Discipline created successfully', {
      disciplineId: discipline.id,
    });
    return discipline;
  }

  async listDisciplinesByCourse(
    courseId: string,
    filters?: Partial<DisciplineFilters>
  ): Promise<Discipline[]> {
    this.logger.debug('Listing disciplines by course', { courseId, filters });

    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundError('Course not found', { courseId });
    }

    return this.repository.findByCourse(courseId, filters);
  }

  async getDisciplineById(id: string): Promise<Discipline> {
    this.logger.debug('Getting discipline by ID', { disciplineId: id });

    const discipline = await this.repository.findById(id);
    if (!discipline) {
      throw new NotFoundError('Discipline not found', { disciplineId: id });
    }

    return discipline;
  }

  async updateDiscipline(
    id: string,
    data: UpdateDisciplineData
  ): Promise<Discipline> {
    this.logger.info('Updating discipline', { disciplineId: id });

    const existingDiscipline = await this.repository.findById(id);
    if (!existingDiscipline) {
      throw new NotFoundError('Discipline not found', { disciplineId: id });
    }

    if (data.codigo && data.codigo !== existingDiscipline.codigo) {
      const duplicateDiscipline = await this.repository.findByCourseAndCodigo(
        existingDiscipline.courseId,
        data.codigo
      );
      if (duplicateDiscipline) {
        throw new ConflictError(
          'Discipline with this code already exists in this course',
          { codigo: data.codigo }
        );
      }
    }

    const updatedDiscipline = await this.repository.update(id, data as any);
    this.logger.info('Discipline updated successfully', { disciplineId: id });

    return updatedDiscipline;
  }

  async deleteDiscipline(id: string, force: boolean = false): Promise<void> {
    this.logger.info('Deleting discipline', { disciplineId: id, force });

    const discipline = await this.repository.findByIdWithModules(id);
    if (!discipline) {
      throw new NotFoundError('Discipline not found', { disciplineId: id });
    }

    const hasModules = (discipline as any).modules?.length > 0;

    if (hasModules && !force) {
      throw new ValidationError(
        'Cannot delete discipline with modules. Use force=true to cascade delete.',
        {
          modules: (discipline as any).modules.length,
        }
      );
    }

    if (force) {
      await this.repository.delete(id);
      this.logger.info('Discipline deleted permanently', { disciplineId: id });
    } else {
      await this.repository.update(id, { ativo: false } as any);
      this.logger.info('Discipline deactivated', { disciplineId: id });
    }
  }
}
