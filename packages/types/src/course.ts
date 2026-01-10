export type CourseLevel = 'tecnico' | 'graduacao' | 'pos_graduacao';

export type CourseGrade = 'tecnologo' | 'bacharelado' | 'licenciatura';

export type CourseModality = 'presencial' | 'ead' | 'hibrido';

export type CourseStatus = 'rascunho' | 'publicado' | 'arquivado';

export interface Course {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  descricaoCurta?: string;
  cargaHorariaTotal: number;
  cargaHorariaMinima?: number;
  nivel: CourseLevel;
  grau?: CourseGrade;
  duracaoSemestres: number;
  modality: CourseModality;
  status: CourseStatus;
  ativo: boolean;
  categoryId?: string;
  subcategoryId?: string;
  coordenadorId?: string;
  dataInicioVigencia?: string;
  thumbnailPath?: string;
  bannerPath?: string;
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface QueryCoursesInput {
  page?: number;
  limit?: number;
  status?: CourseStatus;
  nivel?: CourseLevel;
  modality?: CourseModality;
  search?: string;
  coordenadorId?: string;
  ativo?: boolean;
}

export interface UpdateCourseInput {
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
  dataInicioVigencia?: string;
  thumbnailPath?: string;
  bannerPath?: string;
  customFields?: Record<string, unknown>;
}

export interface CreateCourseInput {
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
  dataInicioVigencia?: string;
  thumbnailPath?: string;
  bannerPath?: string;
  customFields?: Record<string, unknown>;
}
