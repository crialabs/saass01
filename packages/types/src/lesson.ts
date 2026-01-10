export type LessonType =
  | 'video_gravado'
  | 'video_ao_vivo'
  | 'texto'
  | 'quiz'
  | 'atividade_pratica'
  | 'leitura';

export interface Lesson {
  id: string;
  moduleId: string;
  titulo: string;
  descricao?: string;
  tipo: LessonType;
  ordem: number;
  videoUrl?: string;
  duracaoMinutos?: number;
  thumbnailUrl?: string;
  obrigatoria: boolean;
  liberada: boolean;
  permiteDownload: boolean;
  percentualConclusaoMinimo: number;
  marcaDaguaAtiva: boolean;
  transcricaoDisponivel: boolean;
  legendasDisponiveis: string[];
  resolucoesDisponiveis: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonInput {
  titulo: string;
  descricao?: string;
  tipo: LessonType;
  ordem: number;
  videoUrl?: string;
  duracaoMinutos?: number;
  thumbnailUrl?: string;
  obrigatoria?: boolean;
  liberada?: boolean;
  permiteDownload?: boolean;
  percentualConclusaoMinimo?: number;
  marcaDaguaAtiva?: boolean;
  transcricaoDisponivel?: boolean;
  legendasDisponiveis?: string[];
  resolucoesDisponiveis?: string[];
}

export interface CreateLessonsInput {
  aulas: CreateLessonInput[];
}
