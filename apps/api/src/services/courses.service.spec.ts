import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@repo/packages-utils/errors';
import { createMockLogger } from '@test/helpers/mock-logger';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type {
  Course,
  CourseLevel,
  CourseModality,
  CourseStatus,
} from '@/generated/client/client.js';
import type {
  CoursesRepository,
  CourseWithDependencies,
} from '@/repositories/courses-repository';

import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let mockRepository: {
    [K in keyof CoursesRepository]: Mock;
  };
  let mockLogger: ReturnType<typeof createMockLogger>;

  const mockCourse: Course = {
    id: 'course-1',
    codigo: 'TEC001',
    nome: 'Técnico em Informática',
    descricao: 'Curso técnico',
    descricaoCurta: 'Curso TI',
    cargaHorariaTotal: 1200,
    cargaHorariaMinima: 1000,
    nivel: 'tecnico' as CourseLevel,
    grau: null,
    duracaoSemestres: 3,
    modality: 'presencial' as CourseModality,
    status: 'publicado' as CourseStatus,
    ativo: true,
    categoryId: null,
    subcategoryId: null,
    coordenadorId: null,
    dataInicioVigencia: null,
    thumbnailPath: null,
    bannerPath: null,
    customFields: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      findByCodigo: vi.fn(),
      findWithFilters: vi.fn(),
      findById: vi.fn(),
      findByIdWithDependencies: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      softDelete: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    };

    mockLogger = createMockLogger();
    service = new CoursesService(
      mockRepository as unknown as CoursesRepository,
      mockLogger
    );
  });

  describe('createCourse', () => {
    it('should create a new course successfully', async () => {
      const createData = {
        codigo: 'TEC001',
        nome: 'Técnico em Informática',
        nivel: 'tecnico' as CourseLevel,
        cargaHorariaTotal: 1200,
        duracaoSemestres: 3,
      };

      mockRepository.findByCodigo.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(mockCourse);

      const result = await service.createCourse(createData);

      expect(result).toEqual(mockCourse);
      expect(mockRepository.findByCodigo).toHaveBeenCalledWith('TEC001');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: 'TEC001',
          nome: 'Técnico em Informática',
          modality: 'presencial',
          status: 'rascunho',
          ativo: true,
        })
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Creating course', {
        codigo: 'TEC001',
      });
    });

    it('should throw ConflictError when course with same codigo exists', async () => {
      const createData = {
        codigo: 'TEC001',
        nome: 'Técnico em Informática',
        nivel: 'tecnico' as CourseLevel,
        cargaHorariaTotal: 1200,
        duracaoSemestres: 3,
      };

      mockRepository.findByCodigo.mockResolvedValue(mockCourse);

      await expect(service.createCourse(createData)).rejects.toThrow(
        ConflictError
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Course with codigo already exists',
        { codigo: 'TEC001' }
      );
    });
  });

  describe('listCourses', () => {
    it('should list courses with pagination', async () => {
      const options = {
        page: 1,
        limit: 10,
        filters: {},
      };

      mockRepository.findWithFilters.mockResolvedValue({
        courses: [mockCourse],
        total: 1,
      });

      const result = await service.listCourses(options);

      expect(result.courses).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should apply role filters for non-admin users', async () => {
      const options = {
        page: 1,
        limit: 10,
        filters: {},
        userRole: 'user' as const,
      };

      mockRepository.findWithFilters.mockResolvedValue({
        courses: [mockCourse],
        total: 1,
      });

      await service.listCourses(options);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'publicado',
          ativo: true,
        }),
        0,
        10
      );
    });

    it('should not apply role filters for admin users', async () => {
      const options = {
        page: 1,
        limit: 10,
        filters: { status: 'rascunho' as CourseStatus },
        userRole: 'admin' as const,
      };

      mockRepository.findWithFilters.mockResolvedValue({
        courses: [],
        total: 0,
      });

      await service.listCourses(options);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rascunho',
        }),
        0,
        10
      );
    });
  });

  describe('getCourseById', () => {
    it('should return course when found', async () => {
      mockRepository.findById.mockResolvedValue(mockCourse);

      const result = await service.getCourseById('course-1', 'admin');

      expect(result).toEqual(mockCourse);
      expect(mockRepository.findById).toHaveBeenCalledWith('course-1');
    });

    it('should throw NotFoundError when course not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getCourseById('course-1', 'admin')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw NotFoundError for non-admin viewing unpublished course', async () => {
      const unpublishedCourse = {
        ...mockCourse,
        status: 'rascunho' as CourseStatus,
      };
      mockRepository.findById.mockResolvedValue(unpublishedCourse);

      await expect(service.getCourseById('course-1', 'user')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('updateCourse', () => {
    it('should update course successfully', async () => {
      const updateData = {
        nome: 'Updated Name',
      };

      mockRepository.findById.mockResolvedValue(mockCourse);
      mockRepository.update.mockResolvedValue({
        ...mockCourse,
        nome: 'Updated Name',
      });

      const result = await service.updateCourse('course-1', updateData);

      expect(result.nome).toBe('Updated Name');
      expect(mockRepository.update).toHaveBeenCalledWith(
        'course-1',
        updateData
      );
    });

    it('should throw NotFoundError when course not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateCourse('course-1', { nome: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError when updating to existing codigo', async () => {
      const anotherCourse = { ...mockCourse, id: 'course-2', codigo: 'TEC002' };

      mockRepository.findById.mockResolvedValue(mockCourse);
      mockRepository.findByCodigo.mockResolvedValue(anotherCourse);

      await expect(
        service.updateCourse('course-1', { codigo: 'TEC002' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteCourse', () => {
    it('should soft delete course without dependencies', async () => {
      const courseWithDeps: CourseWithDependencies = {
        ...mockCourse,
        enrollments: [],
        disciplines: [],
      };

      mockRepository.findByIdWithDependencies.mockResolvedValue(courseWithDeps);
      mockRepository.softDelete.mockResolvedValue(undefined);

      await service.deleteCourse('course-1', false);

      expect(mockRepository.softDelete).toHaveBeenCalledWith('course-1');
      expect(mockLogger.info).toHaveBeenCalledWith('Course deactivated', {
        courseId: 'course-1',
      });
    });

    it('should throw ValidationError when course has dependencies and force is false', async () => {
      const courseWithDeps: CourseWithDependencies = {
        ...mockCourse,
        enrollments: [{ id: 'enroll-1' }],
        disciplines: [{ id: 'disc-1' }],
      };

      mockRepository.findByIdWithDependencies.mockResolvedValue(courseWithDeps);

      await expect(service.deleteCourse('course-1', false)).rejects.toThrow(
        ValidationError
      );
    });

    it('should permanently delete course when force is true', async () => {
      const courseWithDeps: CourseWithDependencies = {
        ...mockCourse,
        enrollments: [{ id: 'enroll-1' }],
        disciplines: [],
      };

      mockRepository.findByIdWithDependencies.mockResolvedValue(courseWithDeps);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteCourse('course-1', true);

      expect(mockRepository.delete).toHaveBeenCalledWith('course-1');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Course deleted permanently',
        { courseId: 'course-1' }
      );
    });

    it('should throw NotFoundError when course not found', async () => {
      mockRepository.findByIdWithDependencies.mockResolvedValue(null);

      await expect(service.deleteCourse('course-1', false)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
