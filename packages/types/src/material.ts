export type MaterialType =
  | 'slides'
  | 'pdf'
  | 'video'
  | 'audio'
  | 'link'
  | 'codigo_fonte'
  | 'planilha'
  | 'outro';

export interface Material {
  id: string;
  lessonId: string;
  titulo: string;
  tipo: MaterialType;
  descricao?: string;
  arquivoPath?: string;
  url?: string;
  tamanhoBytes?: number;
  formato?: string;
  obrigatorio: boolean;
  ordem: number;
  downloadsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialInput {
  titulo: string;
  tipo: MaterialType;
  descricao?: string;
  arquivoPath?: string;
  url?: string;
  tamanhoBytes?: number;
  formato?: string;
  obrigatorio?: boolean;
  ordem: number;
  downloadsCount?: number;
}

export interface CreateMaterialsInput {
  materiais: CreateMaterialInput[];
}
