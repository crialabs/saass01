export interface Module {
  id: string;
  disciplineId: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  cargaHorariaEstimada?: number;
  objetivosAprendizagem: string[];
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleInput {
  titulo: string;
  descricao?: string;
  ordem: number;
  cargaHorariaEstimada?: number;
  objetivosAprendizagem?: string[];
  ativo?: boolean;
}

export interface CreateModulesInput {
  modulos: CreateModuleInput[];
}
