export interface Discipline {
  id: string;
  courseId: string;
  codigo: string;
  nome: string;
  ementa?: string;
  cargaHorariaTeorica: number;
  cargaHorariaPratica: number;
  cargaHorariaTotal: number;
  areaConhecimento?: string;
  periodo: number;
  obrigatoria: boolean;
  objetivos: string[];
  competencias: string[];
  prerequisitos: string[];
  bibliografiaBasica: string[];
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisciplineInput {
  codigo: string;
  nome: string;
  ementa?: string;
  cargaHorariaTeorica: number;
  cargaHorariaPratica: number;
  cargaHorariaTotal: number;
  areaConhecimento?: string;
  periodo: number;
  obrigatoria?: boolean;
  objetivos?: string[];
  competencias?: string[];
  prerequisitos?: string[];
  bibliografiaBasica?: string[];
  ativo?: boolean;
}

export interface AddDisciplinesInput {
  disciplinas: CreateDisciplineInput[];
}
