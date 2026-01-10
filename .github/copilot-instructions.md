# AI Coding Agent Instructions

## Project Context

Full-stack TypeScript monorepo (pnpm + Turborepo) with Next.js 16 frontend, Fastify backend, and Prisma 7 + PostgreSQL database. Built for an LMS (Learning Management System) platform with marketing pages.

## Architecture Essentials

### Monorepo Structure (Source-Based Packages)

- **apps/web**: Next.js 16 + React 19 (port 3000)
- **apps/api**: Fastify + Prisma (port 8080)
- **packages/types**: Shared Zod v4 schemas (no build step)
- **packages/utils**: Shared utilities & custom error classes (no build step)
- **packages/ui**: Shadcn UI components with Tailwind v5

**Critical**: Packages are consumed as TypeScript source files directly. No watch/build required for packages.

### Import Path Conventions

- **Apps**: Always use import aliases: `@/lib/api`, `@/components/ui/button`
- **Packages**: Always use relative imports: `../../types/user`, `../errors`
- **Cross-package**: Use workspace references: `@repo/packages-types`, `@repo/packages-utils`

## Key Development Workflows

### Environment Setup

```bash
pnpm install
pnpm init:project      # Initialize project (first time)
pnpm dev               # Run all apps in parallel
```

### Individual App Commands

```bash
# Web
cd apps/web && pnpm dev         # Next.js dev server
cd apps/web && pnpm typecheck   # Type checking

# API
cd apps/api && pnpm dev         # Fastify with tsx watch
cd apps/api && pnpm start       # Production build start
```

### Database Operations (from apps/api)

```bash
pnpm db:generate      # Generate Prisma Client (required before dev)
pnpm db:migrate       # Create & apply migration
pnpm db:push          # Push schema without migration (dev only)
pnpm db:studio        # Prisma Studio UI
pnpm db:seed          # Seed database
```

**Critical**: Run `pnpm db:generate` before starting dev or after schema changes. Prisma CLI uses `dotenv-cli` to load `.env.local`.

### Testing

- Unit tests: `*.spec.ts` → `pnpm test:unit`
- Integration tests: `*.integration.spec.ts` → `pnpm test:integration`
- From root: `pnpm test` (runs all tests across workspace)

## Tech Stack Specifics

### Validation & Type Safety

- **Zod v4** is the ONLY validation library (no class-validator, yup, etc.)
- All API routes use Zod schemas via `fastify-type-provider-zod`
- Web forms use Zod + React Hook Form via `@hookform/resolvers`

### State Management (Web)

- **TanStack Query**: API calls & server state synchronization
- **Jotai**: Client-side global state (UI preferences, modals, etc.)

### API Response Handling

The `apps/web/src/lib/api.ts` fetcher automatically unwraps `{ data: T }` to `T`, BUT preserves paginated responses `{ data: T[], pagination: {...} }` intact. Account for this when consuming API responses.

### Authentication

- **Better Auth** for authentication (session-based with cookies)
- **Web**: Import `authClient` from `@/lib/auth`, use `authClient.useSession()` hook
- **API**: Session available via `request.server.auth.api.getSession()`
- **Test users**: When creating password auth users in tests, set `accountId` to the user's email (not user.id)

### Logging (API Only)

- Use Pino logger via `request.log` or service decorators
- **Never use `console.log`** in the API
- Log levels: `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`, `logger.trace()`
- Verbosity controlled by `LOG_LEVEL` env var: `minimal` | `normal` | `detailed` | `verbose`

## Code Style Constraints

### Forbidden Patterns

- **NO `index.ts` barrel files** (strict requirement)
- **NO markdown files** unless explicitly requested
- **NO comments** in code (except for non-obvious edge cases)
- **NO `console.log`** in API code (use logger)

### Type Definitions

- **Interface**: For public-facing types and object shapes
- **Type**: For unions, intersections, and computed types

### UI Components

- Base: Shadcn UI components (in `packages/ui`)
- Icons: Lucide React only (never write SVG code)
- Animations: Framer Motion
- Loading states: Use `<Skeleton>` components (not spinners)
- Classnames: Always use `cn()` helper for dynamic classes

## Error Handling

- Use custom error classes from `packages/utils/src/errors.ts`:
  - `AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`, etc.
- Provide user-friendly messages (don't leak implementation details)

## Marketing Section Structure

The web app uses Next.js App Router with a grouped `(marketing)` layout:

- `/cursos/[nivel]/[slug]` - Course detail pages
- `/blog/[slug]` - Blog posts
- `/contato` - Contact pages
- `/admissao` - Admission process
- `/vida-no-campus` - Campus life

Each section has:

- `_components/` - Section-specific components (underscore prefix)
- `_lib/` - Section-specific utilities
- `loading.tsx` - Loading states
- `error.tsx` - Error boundaries

## Workflow Principles

- **Plan first**: For medium/large tasks, outline the approach and wait for confirmation
- **Ask questions**: If anything is unclear, clarify before proceeding
- **Peer collaboration**: Treat the developer as a peer, be honest about tradeoffs
- **Concise summaries**: Provide brief summaries of changes, avoid verbose explanations

## Quick Reference

| Task           | Command                         |
| -------------- | ------------------------------- |
| Start all apps | `pnpm dev`                      |
| Type check all | `pnpm typecheck`                |
| Run all tests  | `pnpm test`                     |
| Lint + fix     | `pnpm lint:fix`                 |
| DB Studio      | `cd apps/api && pnpm db:studio` |
| Build all      | `pnpm build`                    |

**Docs**: See [CLAUDE.md](../CLAUDE.md) for comprehensive guidelines.
