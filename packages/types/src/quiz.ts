export type QuestionType =
  | 'multipla_escolha'
  | 'verdadeiro_falso'
  | 'dissertativa'
  | 'correspondencia';

export interface QuestionOption {
  texto: string;
  correta: boolean;
  feedback?: string;
}

export interface QuizQuestion {
  enunciado: string;
  tipo: QuestionType;
  ordem: number;
  pontos: number;
  obrigatoria?: boolean;
  explicacao?: string;
  opcoes: QuestionOption[];
}

export interface Quiz {
  id: string;
  lessonId: string;
  titulo: string;
  descricao?: string;
  instrucoes?: string;
  tempoLimiteMinutos?: number;
  notaMinimaAprovacao: number;
  tentativasMaximas: number;
  ordemAleatoria: boolean;
  mostrarRespostaImediata: boolean;
  mostrarGabaritoFinal: boolean;
  permitirRevisao: boolean;
  pontuacaoTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuizInput {
  titulo: string;
  descricao?: string;
  instrucoes?: string;
  tempoLimiteMinutos?: number;
  notaMinimaAprovacao: number;
  tentativasMaximas?: number;
  ordemAleatoria?: boolean;
  mostrarRespostaImediata?: boolean;
  mostrarGabaritoFinal?: boolean;
  permitirRevisao?: boolean;
  pontuacaoTotal: number;
  questoes: QuizQuestion[];
}
