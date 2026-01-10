export type ProgressStatus = 'nao_iniciada' | 'em_progresso' | 'concluida';

export interface Progress {
  id: string;
  studentId: string;
  lessonId: string;
  moduleId: string;
  disciplineId: string;
  courseId: string;
  status: ProgressStatus;
  watchedMinutes?: number;
  totalMinutes?: number;
  completionPercentage: number;
  viewedAt?: string;
  completedAt?: string;
  score?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgressInput {
  lessonId: string;
  moduleId: string;
  disciplineId: string;
  courseId: string;
  status: ProgressStatus;
  watchedMinutes?: number;
  totalMinutes?: number;
  completionPercentage?: number;
  viewedAt?: string;
  completedAt?: string;
  score?: number;
  notes?: string;
}
