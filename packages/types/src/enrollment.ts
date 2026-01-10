export type EnrollmentStatus =
  | 'ativo'
  | 'suspenso'
  | 'concluido'
  | 'cancelado'
  | 'trancado';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: string;
  startDate?: string;
  expectedCompletionDate?: string;
  status: EnrollmentStatus;
  paymentMethod?: string;
  installments?: number;
  scholarshipPercentage: number;
  contactEmail?: string;
  contactPhone?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentInput {
  studentId: string;
  courseId: string;
  enrollmentDate?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  status?: EnrollmentStatus;
  paymentMethod?: string;
  installments?: number;
  scholarshipPercentage?: number;
  contactEmail?: string;
  contactPhone?: string;
  metadata?: Record<string, unknown>;
}
