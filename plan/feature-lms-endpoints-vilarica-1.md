---
goal: 'feature-lms-endpoints-vilarica'
version: '1.0'
date_created: '2026-01-10'
last_updated: '2026-01-10'
owner: 'API Squad'
status: 'Planned'
tags: ['feature', 'lms', 'api', 'fastify', 'prisma', 'zod']
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Plano para implementar os 15 endpoints LMS (cursos, disciplinas, módulos, aulas, materiais, quizzes, matrículas, progresso, certificados, analytics, importação em massa, dashboards, instrutores, notificações) na API Fastify com validação Zod e persistência Prisma, seguindo padrões do repositório.

## 1. Requirements & Constraints

- **REQ-001**: Implementar todos os 15 endpoints conforme payloads fornecidos.
- **REQ-002**: Usar Fastify + `fastify-type-provider-zod` com schemas Zod para body/params/query/response.
- **REQ-003**: Persistência via Prisma v7 em PostgreSQL, aderindo ao padrão de logging e erros do projeto.
- **REQ-004**: Tipos compartilhados em `packages/types` para contratos públicos.
- **REQ-005**: Rotas registradas em `apps/api/src/server.ts` com prefixo `/api`.
- **REQ-006**: Testes de integração cobrindo caminhos felizes e validação.
- **SEC-001**: Validar entradas (tipos, enums, limites) e evitar informações sensíveis em respostas de erro.
- **CON-001**: Não criar `index.ts` barrel files.
- **CON-002**: Evitar comentários supérfluos em código; apenas para casos não óbvios.
- **GUD-001**: Usar erros customizados de `packages/utils/src/errors.ts`.
- **PAT-001**: Estrutura plugin Fastify por arquivo de rota; DI via decoradores do app quando existente.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Modelagem Prisma e tipos base (curso, disciplina, módulo, aula, material, quiz, pergunta/opção, matrícula, progresso, certificado, notificações).

| Task     | Description                                                                                                                                                               | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Atualizar `apps/api/prisma/schema.prisma` com modelos e relacionamentos para curso→disciplina→módulo→aula→quiz/material, matrícula, progresso, certificado, notificações. |           |      |
| TASK-002 | Rodar `pnpm db:generate` e ajustar seed inicial se necessário.                                                                                                            |           |      |
| TASK-003 | Criar/atualizar tipos públicos em `packages/types` refletindo contratos dos endpoints.                                                                                    |           |      |

### Implementation Phase 2

- GOAL-002: Endpoints de conteúdo hierárquico (1-6).

| Task     | Description                                                                    | Completed | Date |
| -------- | ------------------------------------------------------------------------------ | --------- | ---- |
| TASK-004 | POST `/api/courses` — criar curso com validação e resposta tipada.             |           |      |
| TASK-005 | POST `/api/courses/:courseId/disciplines` — adicionar disciplinas em lote.     |           |      |
| TASK-006 | POST `/api/disciplines/:disciplineId/modules` — criar módulos em lote.         |           |      |
| TASK-007 | POST `/api/modules/:moduleId/lessons` — criar aulas em lote.                   |           |      |
| TASK-008 | POST `/api/lessons/:lessonId/materials` — criar materiais em lote.             |           |      |
| TASK-009 | POST `/api/lessons/:lessonId/quizzes` — criar quiz completo (questões/opções). |           |      |

### Implementation Phase 3

- GOAL-003: Endpoints acadêmicos (7-9, 10).

| Task     | Description                                                                   | Completed | Date |
| -------- | ----------------------------------------------------------------------------- | --------- | ---- |
| TASK-010 | POST `/api/students/enroll` — criar matrícula com status/pagamento/metadados. |           |      |
| TASK-011 | POST `/api/students/:studentId/progress` — registrar progresso de aula.       |           |      |
| TASK-012 | POST `/api/students/:studentId/quiz-results` — registrar resultado de quiz.   |           |      |
| TASK-013 | POST `/api/certificates` — gerar certificado e persistir metadados.           |           |      |

### Implementation Phase 4

- GOAL-004: Consultas avançadas e operações em massa (11-15, 12, 13, 14, 15).

| Task     | Description                                                                     | Completed | Date |
| -------- | ------------------------------------------------------------------------------- | --------- | ---- |
| TASK-014 | GET `/api/reports/course-analytics` — agregações de matrícula/engajamento/tech. |           |      |
| TASK-015 | POST `/api/bulk/import-courses` — importação em massa com validação e sumário.  |           |      |
| TASK-016 | GET `/api/students/:studentId/dashboard` — visão consolidada do aluno.          |           |      |
| TASK-017 | GET `/api/instructors/:instructorId/courses` — cursos/disciplinas do instrutor. |           |      |
| TASK-018 | POST `/api/notifications/send-batch` — fila/envio em massa com filtros.         |           |      |

### Implementation Phase 5

- GOAL-005: Testes de integração e validação final.

| Task     | Description                                                                       | Completed | Date |
| -------- | --------------------------------------------------------------------------------- | --------- | ---- |
| TASK-019 | Criar suites de integração para fases 2-4 em `apps/api/test/integration/...`.     |           |      |
| TASK-020 | Cobrir cenários de erro (validação, not found, conflito) e contratos de resposta. |           |      |
| TASK-021 | Revisar OpenAPI/Swagger e ajustar schemas para docs em `/docs`.                   |           |      |

## 3. Alternatives

- **ALT-001**: Modelagem separada por microsserviços (conteúdo, matrículas, relatórios). Rejeitado para manter simplicidade monorepo e reuse de transações.
- **ALT-002**: Calcular analytics via jobs agendados em vez de on-demand. Rejeitado por agora; on-demand atende MVP e simplifica infraestrutura.

## 4. Dependencies

- **DEP-001**: Prisma v7 schema e migrações aplicadas.
- **DEP-002**: Decorators/serviços existentes no Fastify app (logger, auth) conforme padrões do repo.
- **DEP-003**: Tipos compartilhados em `packages/types` consumidos pela web.

## 5. Files

- **FILE-001**: `apps/api/prisma/schema.prisma` (modelagem).
- **FILE-002**: `apps/api/src/routes/*.ts` (novas rotas por endpoint).
- **FILE-003**: `apps/api/src/services/*` ou equivalente (orquestração Prisma).
- **FILE-004**: `packages/types/src/*.ts` (contratos públicos).
- **FILE-005**: `apps/api/test/integration/**/*.integration.spec.ts` (testes).

## 6. Testing

- **TEST-001**: Criar curso (201) e validar corpo da resposta.
- **TEST-002**: Adicionar disciplinas/módulos/aulas em lote (201) e validação de ordens.
- **TEST-003**: Criar quiz com questões/opções e garantir atomicidade.
- **TEST-004**: Matrícula e progresso (idempotência e validação de porcentagem/tempo).
- **TEST-005**: Registro de resultado de quiz (nota, aprovação, tentativas).
- **TEST-006**: Geração de certificado (status/assinaturas/metadados).
- **TEST-007**: Analytics on-demand com agregações corretas.
- **TEST-008**: Importação em massa com sumário de validação.
- **TEST-009**: Dashboard aluno e cursos do instrutor (joins/contagens).
- **TEST-010**: Notificações em massa (filtros e enfileiramento simulado).

## 7. Risks & Assumptions

- **RISK-001**: Volume grande em importação pode exigir batch/stream; mitigação: limites e validação antecipada.
- **RISK-002**: Analytics on-demand pode ser pesado; mitigação: índices e limites de período.
- **ASSUMPTION-001**: Não há dados legados a migrar; greenfield.
- **ASSUMPTION-002**: Enfileiramento de notificações pode ser simulado/logado (sem provedor externo imediato).

## 8. Related Specifications / Further Reading

- Padrões Fastify + Zod do projeto (rotas existentes em `apps/api/src/routes`).
- Erros customizados em `packages/utils/src/errors.ts`.
- Config Prisma/logging em `apps/api/src/config` e `apps/api/prisma/schema.prisma`.
