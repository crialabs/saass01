# API Refactoring Guide - Clean Code Implementation

## Overview

This document provides a comprehensive guide for continuing the clean code refactoring of the Coltec API. The refactoring establishes clear separation of concerns through a three-layer architecture: Routes (HTTP), Services (Business Logic), and Repositories (Data Access).

## Completed Work

### ✅ Phase 1 & 2: Foundation & Courses

- Base repository pattern with generic CRUD operations
- CoursesRepository with specialized queries
- CoursesService with complete business logic
- Refactored courses routes to use service layer
- Dependency injection setup in services plugin

### ✅ Phase 3 (Partial): Disciplines

- DisciplinesRepository with course-specific queries
- DisciplinesService with business logic
- Service registered in DI container
- Routes still pending refactoring

## Architecture Pattern

### Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│           HTTP Layer (Routes)           │
│  - Request validation (Zod schemas)     │
│  - Response formatting                  │
│  - HTTP status codes                    │
│  - Delegates to services                │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│       Business Logic Layer (Services)   │
│  - Business rules & validations         │
│  - Authorization checks                 │
│  - Error handling                       │
│  - Orchestrates repositories            │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Data Access Layer (Repositories)   │
│  - Prisma queries                       │
│  - Data transformations                 │
│  - Specialized queries                  │
│  - Single source of truth for DB access │
└─────────────────────────────────────────┘
```

## Step-by-Step Refactoring Guide

### Step 1: Create Repository

Create `src/repositories/{entity}-repository.ts`:

```typescript
import type { Entity, PrismaClient } from '@/generated/client/client.js';
import { BasePrismaRepository } from './base-repository';

export interface EntityFilters {
  // Define filter options
  status?: string;
  search?: string;
}

export interface CreateEntityData {
  // Define creation input
  name: string;
  description?: string;
}

export class EntitiesRepository extends BasePrismaRepository<Entity> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'entity'); // lowercase model name
  }

  // Add specialized queries
  async findByName(name: string): Promise<Entity | null> {
    return this.prisma.entity.findUnique({
      where: { name },
    });
  }

  async findWithFilters(
    filters: EntityFilters,
    skip: number,
    take: number
  ): Promise<{ entities: Entity[]; total: number }> {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [{ name: { contains: filters.search, mode: 'insensitive' } }];
    }

    const [entities, total] = await Promise.all([
      this.prisma.entity.findMany({ where, skip, take }),
      this.prisma.entity.count({ where }),
    ]);

    return { entities, total };
  }

  // For entities with relations, add specialized methods
  async findByIdWithRelations(id: string): Promise<Entity | null> {
    return this.prisma.entity.findUnique({
      where: { id },
      include: {
        relatedItems: { select: { id: true } },
      },
    });
  }
}
```

### Step 2: Create Service

Create `src/services/{entity}.service.ts`:

```typescript
import type { Entity } from '@/generated/client/client.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@repo/packages-utils/errors';

import type { LoggerService } from '@/common/logger.service';
import type {
  CreateEntityData,
  EntitiesRepository,
  EntityFilters,
} from '@/repositories/{entity}-repository';

export interface UpdateEntityData {
  name?: string;
  description?: string;
  status?: string;
}

export interface EntityListOptions {
  page: number;
  limit: number;
  filters: EntityFilters;
  userRole?: 'admin' | 'super_admin' | 'user';
}

export class EntitiesService {
  constructor(
    private readonly repository: EntitiesRepository,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext('EntitiesService');
  }

  async createEntity(data: CreateEntityData): Promise<Entity> {
    this.logger.info('Creating entity', { name: data.name });

    // Business validation
    const existing = await this.repository.findByName(data.name);
    if (existing) {
      throw new ConflictError('Entity with this name already exists', {
        name: data.name,
      });
    }

    const entity = await this.repository.create(data as any);
    this.logger.info('Entity created successfully', { entityId: entity.id });

    return entity;
  }

  async listEntities(options: EntityListOptions) {
    this.logger.debug('Listing entities', { options });

    // Apply authorization filters if needed
    const filters = this.applyRoleFilters(options.filters, options.userRole);
    const skip = (options.page - 1) * options.limit;

    const { entities, total } = await this.repository.findWithFilters(
      filters,
      skip,
      options.limit
    );

    return {
      entities,
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  async getEntityById(id: string): Promise<Entity> {
    this.logger.debug('Getting entity by ID', { entityId: id });

    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundError('Entity not found', { entityId: id });
    }

    return entity;
  }

  async updateEntity(id: string, data: UpdateEntityData): Promise<Entity> {
    this.logger.info('Updating entity', { entityId: id });

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError('Entity not found', { entityId: id });
    }

    // Business validation for updates
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.repository.findByName(data.name);
      if (duplicate) {
        throw new ConflictError('Entity with this name already exists');
      }
    }

    const updated = await this.repository.update(id, data as any);
    this.logger.info('Entity updated successfully', { entityId: id });

    return updated;
  }

  async deleteEntity(id: string, force: boolean = false): Promise<void> {
    this.logger.info('Deleting entity', { entityId: id, force });

    const entity = await this.repository.findByIdWithRelations(id);
    if (!entity) {
      throw new NotFoundError('Entity not found', { entityId: id });
    }

    // Check for dependencies
    const hasDependencies = (entity as any).relatedItems?.length > 0;
    if (hasDependencies && !force) {
      throw new ValidationError(
        'Cannot delete entity with dependencies. Use force=true to cascade delete.',
        { dependencies: (entity as any).relatedItems.length }
      );
    }

    if (force) {
      await this.repository.delete(id);
      this.logger.info('Entity deleted permanently', { entityId: id });
    } else {
      await this.repository.update(id, { status: 'inactive' } as any);
      this.logger.info('Entity deactivated', { entityId: id });
    }
  }

  private applyRoleFilters(
    filters: EntityFilters,
    userRole?: 'admin' | 'super_admin' | 'user'
  ): EntityFilters {
    // Apply role-based filtering if needed
    const isAdmin = userRole && ['admin', 'super_admin'].includes(userRole);
    if (!isAdmin) {
      return { ...filters, status: 'active' };
    }
    return filters;
  }
}
```

### Step 3: Register Service in DI

Update `src/plugins/services.ts`:

```typescript
// Add import
import { EntitiesRepository } from '@/repositories/{entity}-repository';
import { EntitiesService } from '@/services/{entity}.service';

// Update type declaration
declare module 'fastify' {
  interface FastifyInstance {
    // ... existing services
    entitiesService: EntitiesService;
  }
}

// In servicesPlugin function
const entitiesRepository = new EntitiesRepository(app.prisma);
const entitiesService = new EntitiesService(entitiesRepository, app.logger);

app.decorate('entitiesService', entitiesService);
```

### Step 4: Refactor Routes

Update `src/routes/{entity}.ts`:

```typescript
// Before: Direct Prisma access
async (request, reply) => {
  const existing = await app.prisma.entity.findUnique({
    where: { name: request.body.name },
  });
  if (existing) {
    return reply.status(409).send({
      error: { message: 'Entity already exists' },
    });
  }
  const entity = await app.prisma.entity.create({
    data: request.body,
  });
  return reply.status(201).send({ data: entity });
};

// After: Using service
async (request, reply) => {
  const entity = await app.entitiesService.createEntity(request.body);
  return reply.status(201).send({
    data: {
      ...entity,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    },
  });
};
```

### Step 5: Type Safety Considerations

When working with Prisma types and custom fields:

```typescript
// Use JsonValue from Prisma for JSON fields
import type { JsonValue } from '@/generated/client/internal/prismaNamespace.js';

export interface CreateEntityData {
  name: string;
  metadata?: JsonValue; // For JSON fields
}

// In routes, cast as needed
const entity = await app.entitiesService.createEntity({
  ...body,
  metadata: body.metadata as any, // Cast Record<string, unknown> to JsonValue
});
```

## Checklist for Each Entity

Use this checklist when refactoring each domain entity:

- [ ] Create repository extending BasePrismaRepository
- [ ] Add specialized query methods to repository
- [ ] Define filter and creation interfaces
- [ ] Create service with business logic
- [ ] Implement CRUD operations in service
- [ ] Add authorization logic to service
- [ ] Add proper error handling (NotFoundError, ConflictError, etc.)
- [ ] Add structured logging with context
- [ ] Register repository and service in DI container
- [ ] Update FastifyInstance type declaration
- [ ] Refactor routes to use service
- [ ] Remove direct Prisma calls from routes
- [ ] Simplify route handlers to HTTP concerns only
- [ ] Run typecheck to verify compilation
- [ ] Test endpoints manually or with integration tests

## Remaining Entities to Refactor

### High Priority (Core Academic Entities)

1. **Modules** - Course content organization
2. **Lessons** - Individual learning units
3. **Materials** - Supporting documents and resources
4. **Quizzes** - Assessments and questions

### Medium Priority (Student Management)

5. **Enrollments** - Student course registrations
6. **Progress** - Learning progress tracking
7. **Quiz Attempts** - Assessment submissions
8. **Certificates** - Achievement records

### Lower Priority (Supporting Features)

9. **Reports** - Analytics and reporting (may need specialized service)
10. **Bulk Operations** - Mass data imports (specialized service)
11. **Dashboard** - Aggregated views (may use multiple services)
12. **Instructors** - Instructor management
13. **Notifications** - Communication system

## Best Practices

### Repository Layer

- Keep repositories focused on data access only
- No business logic in repositories
- Return Prisma types directly
- Use specialized query methods for complex filters
- Cache-friendly design (stateless)

### Service Layer

- All business rules belong here
- Use custom errors (NotFoundError, ConflictError, ValidationError)
- Log all significant operations
- Return domain entities (Prisma types)
- Orchestrate multiple repositories when needed
- Keep methods focused (Single Responsibility)

### Route Layer

- Validate input with Zod schemas
- Format responses consistently
- Handle only HTTP concerns
- No business logic
- Transform dates to ISO strings for responses
- Use appropriate HTTP status codes

### Error Handling

```typescript
// Good: Use custom error classes
throw new NotFoundError('Entity not found', { entityId: id });
throw new ConflictError('Duplicate entity', { name: data.name });
throw new ValidationError('Invalid data', { field: 'email' });

// Bad: Generic errors
throw new Error('Not found');
throw new Error('Conflict');
```

### Logging

```typescript
// Good: Structured logging with context
this.logger.info('Creating entity', { name: data.name });
this.logger.error('Failed to create entity', error, { name: data.name });

// Bad: No context
this.logger.info('Creating entity');
console.log('Error creating entity');
```

## Testing Strategy

### Unit Tests (Services)

```typescript
describe('EntitiesService', () => {
  let service: EntitiesService;
  let mockRepository: jest.Mocked<EntitiesRepository>;
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    service = new EntitiesService(mockRepository, mockLogger);
  });

  it('should create entity successfully', async () => {
    mockRepository.findByName.mockResolvedValue(null);
    mockRepository.create.mockResolvedValue(mockEntity);

    const result = await service.createEntity(createData);

    expect(result).toEqual(mockEntity);
    expect(mockRepository.findByName).toHaveBeenCalledWith(createData.name);
    expect(mockRepository.create).toHaveBeenCalled();
  });

  it('should throw ConflictError when entity exists', async () => {
    mockRepository.findByName.mockResolvedValue(mockEntity);

    await expect(service.createEntity(createData)).rejects.toThrow(
      ConflictError
    );
  });
});
```

### Integration Tests (Routes)

```typescript
describe('POST /api/entities', () => {
  it('should create entity', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/entities',
      payload: createData,
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().data).toHaveProperty('id');
  });

  it('should return 409 for duplicate', async () => {
    await createEntity(createData);

    const response = await app.inject({
      method: 'POST',
      url: '/api/entities',
      payload: createData,
      headers: authHeaders,
    });

    expect(response.statusCode).toBe(409);
  });
});
```

## Common Patterns

### Pagination

```typescript
const skip = (page - 1) * limit;
const { items, total } = await repository.findWithFilters(filters, skip, limit);

return {
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
};
```

### Bulk Operations

```typescript
async createMultiple(items: CreateData[]): Promise<Entity[]> {
  // Validate all items first
  for (const item of items) {
    await this.validateItem(item);
  }

  // Create in transaction
  return this.prisma.$transaction(
    items.map(item => this.repository.create(item))
  );
}
```

### Relations

```typescript
async getWithRelations(id: string): Promise<EntityWithRelations> {
  const entity = await this.repository.findByIdWithRelations(id);
  if (!entity) {
    throw new NotFoundError('Entity not found');
  }
  return entity;
}
```

## Troubleshooting

### Type Errors with JSON Fields

If you get type errors with `customFields` or other JSON fields:

```typescript
// Use JsonValue from Prisma
import type { JsonValue } from '@/generated/client/internal/prismaNamespace.js';

// In interfaces
metadata?: JsonValue;

// In routes, cast when needed
customFields: body.customFields as any
```

### Circular Dependencies

If services need to call each other:

```typescript
// Option 1: Pass repository instead of service
constructor(
  private readonly entityRepo: EntitiesRepository,
  private readonly relatedRepo: RelatedRepository,
  private readonly logger: LoggerService
) {}

// Option 2: Use dependency injection to break cycle
// Register services in order in services.ts
```

### Repository Method Return Types

When including relations, define specific types:

```typescript
export interface EntityWithRelations extends Entity {
  relatedItems: { id: string }[];
}

async findByIdWithRelations(id: string): Promise<EntityWithRelations | null> {
  // ...
}
```

## Summary

This refactoring establishes a maintainable, testable, and scalable architecture following clean code principles. The pattern is consistent and should be applied to all remaining endpoints for uniformity across the codebase.

Key benefits:

- ✅ Separation of concerns
- ✅ Testability (unit and integration)
- ✅ Type safety throughout
- ✅ Consistent error handling
- ✅ Reusable business logic
- ✅ Clear code organization
- ✅ Easy to extend and maintain

Continue applying this pattern to remaining entities, following the step-by-step guide and checklist provided above.
