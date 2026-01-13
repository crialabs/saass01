import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@repo/packages-utils/errors';

import type { LoggerService } from '@/common/logger.service';
import type {
  Course,
  CourseGrade,
  CourseLevel,
  CourseModality,
  CourseStatus,
} from '@/generated/client/client.js';
import type { JsonValue } from '@/generated/client/internal/prismaNamespace.js';
import type {
  CourseFilters,
  CoursesRepository,
  CourseWithDependencies,
  CreateCourseData,
} from '@/repositories/courses-repository';

export interface UpdateCourseData {
  codigo?: string;
  nome?: string;
  descricao?: string;
  descricaoCurta?: string;
  cargaHorariaTotal?: number;
  cargaHorariaMinima?: number;
  nivel?: CourseLevel;
  grau?: CourseGrade;
  duracaoSemestres?: number;
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

export interface CourseListOptions {
  page: number;
  limit: number;
  filters: CourseFilters;
  userRole?: 'admin' | 'super_admin' | 'user';
}

export interface CourseListResult {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class CoursesService {
  constructor(
    private readonly repository: CoursesRepository,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext('CoursesService');
  }

  async createCourse(data: CreateCourseData): Promise<Course> {
    this.logger.info('Creating course', { codigo: data.codigo });

    const existingCourse = await this.repository.findByCodigo(data.codigo);
    if (existingCourse) {
      this.logger.warn('Course with codigo already exists', {
        codigo: data.codigo,
      });
      throw new ConflictError('Course with this code already exists', {
        codigo: data.codigo,
      });
    }

    const course = await this.repository.create({
      ...data,
      modality: data.modality ?? 'presencial',
      status: data.status ?? 'rascunho',
      ativo: data.ativo ?? true,
    });

    this.logger.info('Course created successfully', { courseId: course.id });
    return course;
  }

  async listCourses(options: CourseListOptions): Promise<CourseListResult> {
    this.logger.debug('Listing courses', { options });

    const filters = this.applyRoleFilters(options.filters, options.userRole);
    const skip = (options.page - 1) * options.limit;

    const { courses, total } = await this.repository.findWithFilters(
      filters,
      skip,
      options.limit
    );

    const totalPages = Math.ceil(total / options.limit);

    return {
      courses,
      total,
      page: options.page,
      limit: options.limit,
      totalPages,
    };
  }

  async getCourseById(
    id: string,
    userRole?: 'admin' | 'super_admin' | 'user'
  ): Promise<Course> {
    this.logger.debug('Getting course by ID', { courseId: id });

    const course = await this.repository.findById(id);
    if (!course) {
      this.logger.warn('Course not found', { courseId: id });
      throw new NotFoundError('Course not found', { courseId: id });
    }

    if (!this.canViewCourse(course, userRole)) {
      this.logger.warn('User cannot view unpublished course', {
        courseId: id,
        userRole,
      });
      throw new NotFoundError('Course not found', { courseId: id });
    }

    return course;
  }

  async updateCourse(id: string, data: UpdateCourseData): Promise<Course> {
    this.logger.info('Updating course', { courseId: id });

    const existingCourse = await this.repository.findById(id);
    if (!existingCourse) {
      this.logger.warn('Course not found for update', { courseId: id });
      throw new NotFoundError('Course not found', { courseId: id });
    }

    if (data.codigo && data.codigo !== existingCourse.codigo) {
      const duplicateCourse = await this.repository.findByCodigo(data.codigo);
      if (duplicateCourse) {
        this.logger.warn('Course with new codigo already exists', {
          codigo: data.codigo,
        });
        throw new ConflictError('Course with this code already exists', {
          codigo: data.codigo,
        });
      }
    }

    const updatedCourse = await this.repository.update(id, data);
    this.logger.info('Course updated successfully', { courseId: id });

    return updatedCourse;
  }

  async deleteCourse(id: string, force: boolean = false): Promise<void> {
    this.logger.info('Deleting course', { courseId: id, force });

    const course: CourseWithDependencies | null =
      await this.repository.findByIdWithDependencies(id);
    if (!course) {
      this.logger.warn('Course not found for deletion', { courseId: id });
      throw new NotFoundError('Course not found', { courseId: id });
    }

    const hasDependencies =
      course.enrollments.length > 0 || course.disciplines.length > 0;

    if (hasDependencies && !force) {
      this.logger.warn('Cannot delete course with dependencies', {
        courseId: id,
        enrollments: course.enrollments.length,
        disciplines: course.disciplines.length,
      });
      throw new ValidationError(
        'Cannot delete course with dependencies. Use force=true to cascade delete.',
        {
          enrollments: course.enrollments.length,
          disciplines: course.disciplines.length,
        }
      );
    }

    if (force) {
      await this.repository.delete(id);
      this.logger.info('Course deleted permanently', { courseId: id });
    } else {
      await this.repository.softDelete(id);
      this.logger.info('Course deactivated', { courseId: id });
    }
  }

  private applyRoleFilters(
    filters: CourseFilters,
    userRole?: 'admin' | 'super_admin' | 'user'
  ): CourseFilters {
    const isAdmin = userRole && ['admin', 'super_admin'].includes(userRole);

    if (!isAdmin) {
      return {
        ...filters,
        status: 'publicado',
        ativo: true,
      };
    }

    return filters;
  }

  private canViewCourse(
    course: Course,
    userRole?: 'admin' | 'super_admin' | 'user'
  ): boolean {
    const isAdmin = userRole && ['admin', 'super_admin'].includes(userRole);

    if (isAdmin) {
      return true;
    }

    return course.status === 'publicado' && course.ativo;
  }
}
