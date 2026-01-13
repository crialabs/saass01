import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@repo/packages-utils/errors';
import { createMockLogger } from '@test/helpers/mock-logger';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { Discipline } from '@/generated/client/client.js';
import type { CoursesRepository } from '@/repositories/courses-repository';
import type {
  DisciplinesRepository,
  DisciplineWithModules,
} from '@/repositories/disciplines-repository';

import { DisciplinesService } from './disciplines.service';

describe('DisciplinesService', () => {
  let service: DisciplinesService;
  let mockRepository: {
    [K in keyof DisciplinesRepository]: Mock;
  };
  let mockCoursesRepository: {
    [K in keyof CoursesRepository]: Mock;
  };
  let mockLogger: ReturnType<typeof createMockLogger>;

  const mockCourse = {
    id: 'course-1',
    codigo: 'TEC001',
    nome: 'Técnico em Informática',
  };

  const mockDiscipline: Discipline = {
    id: 'disc-1',
    courseId: 'course-1',
    codigo: 'MAT101',
    nome: 'Matemática I',
    ementa: 'Fundamentos de matemática',
    cargaHorariaTeorica: 40,
    cargaHorariaPratica: 20,
    cargaHorariaTotal: 60,
    areaConhecimento: 'Exatas',
    periodo: 1,
    obrigatoria: true,
    objetivos: ['Objetivo 1'],
    competencias: ['Competência 1'],
    prerequisitos: [],
    bibliografiaBasica: ['Livro 1'],
    ativo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      findByCourseAndCodigo: vi.fn(),
      findByCourse: vi.fn(),
      findById: vi.fn(),
      findByIdWithModules: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    };

    mockCoursesRepository = {
      findById: vi.fn(),
    } as any;

    mockLogger = createMockLogger();
    service = new DisciplinesService(
      mockRepository as unknown as DisciplinesRepository,
      mockCoursesRepository as unknown as CoursesRepository,
      mockLogger
    );
  });

  describe('createDiscipline', () => {
    it('should create a new discipline successfully', async () => {
      const createData = {
        courseId: 'course-1',
        codigo: 'MAT101',
        nome: 'Matemática I',
        cargaHorariaTeorica: 40,
        cargaHorariaPratica: 20,
        cargaHorariaTotal: 60,
        periodo: 1,
      };

      mockCoursesRepository.findById.mockResolvedValue(mockCourse as any);
      mockRepository.findByCourseAndCodigo.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockDiscipline);

      const result = await service.createDiscipline(createData);

      expect(result).toEqual(mockDiscipline);
      expect(mockCoursesRepository.findById).toHaveBeenCalledWith('course-1');
      expect(mockRepository.findByCourseAndCodigo).toHaveBeenCalledWith(
        'course-1',
        'MAT101'
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: 'MAT101',
          nome: 'Matemática I',
          obrigatoria: true,
          ativo: true,
        })
      );
    });

    it('should throw NotFoundError when course does not exist', async () => {
      const createData = {
        courseId: 'course-1',
        codigo: 'MAT101',
        nome: 'Matemática I',
        cargaHorariaTeorica: 40,
        cargaHorariaPratica: 20,
        cargaHorariaTotal: 60,
        periodo: 1,
      };

      mockCoursesRepository.findById.mockResolvedValue(null);

      await expect(service.createDiscipline(createData)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ConflictError when discipline with same codigo exists in course', async () => {
      const createData = {
        courseId: 'course-1',
        codigo: 'MAT101',
        nome: 'Matemática I',
        cargaHorariaTeorica: 40,
        cargaHorariaPratica: 20,
        cargaHorariaTotal: 60,
        periodo: 1,
      };

      mockCoursesRepository.findById.mockResolvedValue(mockCourse as any);
      mockRepository.findByCourseAndCodigo.mockResolvedValue(mockDiscipline);

      await expect(service.createDiscipline(createData)).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe('listDisciplinesByCourse', () => {
    it('should list all disciplines for a course', async () => {
      mockCoursesRepository.findById.mockResolvedValue(mockCourse as any);
      mockRepository.findByCourse.mockResolvedValue([mockDiscipline]);

      const result = await service.listDisciplinesByCourse('course-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockDiscipline);
      expect(mockRepository.findByCourse).toHaveBeenCalledWith(
        'course-1',
        undefined
      );
    });

    it('should apply filters when provided', async () => {
      mockCoursesRepository.findById.mockResolvedValue(mockCourse as any);
      mockRepository.findByCourse.mockResolvedValue([mockDiscipline]);

      await service.listDisciplinesByCourse('course-1', {
        periodo: 1,
        obrigatoria: true,
      });

      expect(mockRepository.findByCourse).toHaveBeenCalledWith('course-1', {
        periodo: 1,
        obrigatoria: true,
      });
    });

    it('should throw NotFoundError when course does not exist', async () => {
      mockCoursesRepository.findById.mockResolvedValue(null);

      await expect(service.listDisciplinesByCourse('course-1')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getDisciplineById', () => {
    it('should return discipline when found', async () => {
      mockRepository.findById.mockResolvedValue(mockDiscipline);

      const result = await service.getDisciplineById('disc-1');

      expect(result).toEqual(mockDiscipline);
    });

    it('should throw NotFoundError when discipline not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getDisciplineById('disc-1')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateDiscipline', () => {
    it('should update discipline successfully', async () => {
      const updateData = {
        nome: 'Updated Name',
      };

      mockRepository.findById.mockResolvedValue(mockDiscipline);
      mockRepository.update.mockResolvedValue({
        ...mockDiscipline,
        nome: 'Updated Name',
      });

      const result = await service.updateDiscipline('disc-1', updateData);

      expect(result.nome).toBe('Updated Name');
      expect(mockRepository.update).toHaveBeenCalledWith('disc-1', updateData);
    });

    it('should throw NotFoundError when discipline not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateDiscipline('disc-1', { nome: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to existing codigo in same course', async () => {
      const anotherDiscipline = {
        ...mockDiscipline,
        id: 'disc-2',
        codigo: 'MAT102',
      };

      mockRepository.findById.mockResolvedValue(mockDiscipline);
      mockRepository.findByCourseAndCodigo.mockResolvedValue(anotherDiscipline);

      await expect(
        service.updateDiscipline('disc-1', { codigo: 'MAT102' })
      ).rejects.toThrow(ConflictError);
    });

    it('should allow updating to same codigo', async () => {
      mockRepository.findById.mockResolvedValue(mockDiscipline);
      mockRepository.update.mockResolvedValue(mockDiscipline);

      await service.updateDiscipline('disc-1', { codigo: 'MAT101' });

      expect(mockRepository.findByCourseAndCodigo).not.toHaveBeenCalled();
    });
  });

  describe('deleteDiscipline', () => {
    it('should deactivate discipline without modules', async () => {
      const disciplineWithModules: DisciplineWithModules = {
        ...mockDiscipline,
        modules: [],
      };

      mockRepository.findByIdWithModules.mockResolvedValue(
        disciplineWithModules
      );
      mockRepository.update.mockResolvedValue({
        ...mockDiscipline,
        ativo: false,
      });

      await service.deleteDiscipline('disc-1', false);

      expect(mockRepository.update).toHaveBeenCalledWith('disc-1', {
        ativo: false,
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Discipline deactivated', {
        disciplineId: 'disc-1',
      });
    });

    it('should throw ValidationError when discipline has modules and force is false', async () => {
      const disciplineWithModules: DisciplineWithModules = {
        ...mockDiscipline,
        modules: [{ id: 'module-1' }],
      };

      mockRepository.findByIdWithModules.mockResolvedValue(
        disciplineWithModules
      );

      await expect(service.deleteDiscipline('disc-1', false)).rejects.toThrow(
        ValidationError
      );
    });

    it('should permanently delete discipline when force is true', async () => {
      const disciplineWithModules: DisciplineWithModules = {
        ...mockDiscipline,
        modules: [{ id: 'module-1' }],
      };

      mockRepository.findByIdWithModules.mockResolvedValue(
        disciplineWithModules
      );
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteDiscipline('disc-1', true);

      expect(mockRepository.delete).toHaveBeenCalledWith('disc-1');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Discipline deleted permanently',
        { disciplineId: 'disc-1' }
      );
    });

    it('should throw NotFoundError when discipline not found', async () => {
      mockRepository.findByIdWithModules.mockResolvedValue(null);

      await expect(service.deleteDiscipline('disc-1', false)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
