export type CertificateType = 'conclusao' | 'participacao' | 'extensao';

export type CertificateStatus = 'gerado' | 'emitido' | 'revogado';

export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  certificateType: CertificateType;
  issueDate: string;
  completionDate?: string;
  overallScore?: number;
  certificateNumber: string;
  studentName: string;
  studentRegistration: string;
  courseName: string;
  courseCode: string;
  totalHours: number;
  signatureLine1?: string;
  signatureLine1Title?: string;
  signatureLine2?: string;
  signatureLine2Title?: string;
  digitalSignature: boolean;
  digitalSignatureHash?: string;
  status: CertificateStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCertificateInput {
  studentId: string;
  courseId: string;
  certificateType: CertificateType;
  issueDate?: string;
  completionDate?: string;
  overallScore?: number;
  certificateNumber: string;
  studentName: string;
  studentRegistration: string;
  courseName: string;
  courseCode: string;
  totalHours: number;
  signatureLine1?: string;
  signatureLine1Title?: string;
  signatureLine2?: string;
  signatureLine2Title?: string;
  digitalSignature?: boolean;
  digitalSignatureHash?: string;
  status?: CertificateStatus;
  metadata?: Record<string, unknown>;
}
