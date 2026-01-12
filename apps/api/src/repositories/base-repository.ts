import type { PrismaClient } from '@/generated/client/client.js';

export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(options?: FindManyOptions): Promise<T[]>;
  create(data: CreateInput<T>): Promise<T>;
  update(id: string, data: UpdateInput<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(where?: WhereInput): Promise<number>;
}

export interface FindManyOptions {
  where?: WhereInput;
  orderBy?: OrderByInput;
  skip?: number;
  take?: number;
  include?: Record<string, boolean>;
}

export type WhereInput = Record<string, unknown>;
export type OrderByInput = Record<string, 'asc' | 'desc'>;
export type CreateInput<T> = Partial<T>;
export type UpdateInput<T> = Partial<T>;

export abstract class BasePrismaRepository<T> implements BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly modelName: string
  ) {}

  protected getModel() {
    const model = (this.prisma as any)[this.modelName];
    if (!model) {
      throw new Error(`Invalid Prisma model name: ${this.modelName}`);
    }
    return model;
  }

  async findById(id: string): Promise<T | null> {
    return this.getModel().findUnique({ where: { id } });
  }

  async findMany(options?: FindManyOptions): Promise<T[]> {
    return this.getModel().findMany({
      where: options?.where,
      orderBy: options?.orderBy,
      skip: options?.skip,
      take: options?.take,
      include: options?.include,
    });
  }

  async create(data: CreateInput<T>): Promise<T> {
    return this.getModel().create({ data: data as any });
  }

  async update(id: string, data: UpdateInput<T>): Promise<T> {
    return this.getModel().update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string): Promise<void> {
    await this.getModel().delete({ where: { id } });
  }

  async count(where?: WhereInput): Promise<number> {
    return this.getModel().count({ where });
  }
}
