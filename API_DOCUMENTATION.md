# Documentação Completa da API Coltec

> Sistema de Gestão Educacional - API REST completa para instituições de ensino técnico e superior

## Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Ambientes e URLs](#ambientes-e-urls)
- [Formato de Resposta](#formato-de-resposta)
- [Códigos de Status HTTP](#códigos-de-status-http)
- [Paginação](#paginação)
- [Tratamento de Erros](#tratamento-de-erros)
- [Endpoints](#endpoints)
  - [Autenticação (Auth)](#autenticação-auth)
  - [Usuários (Users)](#usuários-users)
  - [Cursos (Courses)](#cursos-courses)
  - [Disciplinas (Disciplines)](#disciplinas-disciplines)
  - [Módulos (Modules)](#módulos-modules)
  - [Aulas (Lessons)](#aulas-lessons)
  - [Materiais (Materials)](#materiais-materials)
  - [Quizzes](#quizzes)
  - [Matrículas (Enrollments)](#matrículas-enrollments)
  - [Progresso (Progress)](#progresso-progress)
  - [Certificados (Certificates)](#certificados-certificates)
  - [Relatórios (Reports)](#relatórios-reports)
  - [Dashboard](#dashboard)
  - [Instrutores (Instructors)](#instrutores-instructors)
  - [Notificações (Notifications)](#notificações-notifications)
  - [Uploads](#uploads)
  - [Operações em Massa (Bulk)](#operações-em-massa-bulk)
- [Anexos](#anexos)

---

## Visão Geral

### Descrição

A API Coltec é uma solução completa para gestão de instituições de ensino técnico e superior. Oferece funcionalidades para:

- **Gestão Acadêmica**: Cursos, disciplinas, módulos, aulas e materiais
- **Gestão de Usuários**: Estudantes, professores e administradores
- **Avaliação**: Quizzes, notas e certificados
- **Acompanhamento**: Progresso de aprendizagem e analytics
- **Comunicação**: Notificações e relatórios

### Tecnologias

- **Framework**: Fastify 4.x
- **Validação**: Zod v4 com fastify-type-provider-zod
- **Banco de Dados**: PostgreSQL via Prisma 7
- **Autenticação**: Better Auth (session-based)
- **Documentação**: OpenAPI 3.0 com Scalar UI

### Características

- ✅ API RESTful totalmente tipada
- ✅ Validação automática de requisições e respostas
- ✅ Autenticação segura baseada em sessão
- ✅ Paginação integrada
- ✅ Rate limiting por usuário/IP
- ✅ Logging estruturado com Pino
- ✅ Suporte a filtros e busca
- ✅ Operações em massa (bulk)
- ✅ Upload de arquivos

---

## Autenticação

### Método

A API utiliza **autenticação baseada em sessão** com cookies HTTP-only gerenciados pelo Better Auth.

### Cookie de Sessão

```
Nome: better-auth.session_token
Tipo: HTTP-only, Secure (em produção)
Duração: Configurável (padrão: 30 dias)
```

### Fluxo de Autenticação

1. **Login**: POST `/api/auth/sign-in/email` com email e senha
2. **Servidor**: Valida credenciais e retorna cookie de sessão
3. **Requisições**: Cliente envia cookie automaticamente
4. **Renovação**: Cookie renovado automaticamente em requisições
5. **Logout**: POST `/api/auth/sign-out` para invalidar sessão

### Exemplo de Login

```bash
# Login
curl -X POST http://localhost:8080/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "aluno@exemplo.com",
    "password": "senha123"
  }' \
  -c cookies.txt

# Usar sessão em requisições subsequentes
curl http://localhost:8080/api/users/me \
  -b cookies.txt
```

### Papéis (Roles)

| Papel         | Descrição                  | Permissões                                          |
| ------------- | -------------------------- | --------------------------------------------------- |
| `user`        | Usuário padrão (estudante) | Acesso aos próprios dados, visualização de conteúdo |
| `admin`       | Administrador              | Gestão de cursos, usuários e conteúdo               |
| `super_admin` | Super administrador        | Acesso total ao sistema                             |

### Proteção de Rotas

Rotas protegidas retornam:

- **401 Unauthorized**: Sem autenticação
- **403 Forbidden**: Sem permissão para o recurso

---

## Ambientes e URLs

### Desenvolvimento

```
Base URL: http://localhost:8080
API Prefix: /api
Docs: http://localhost:8080/docs
```

### Produção

```
Base URL: https://api.seudominio.com
API Prefix: /api
```

### Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-10T19:00:00.000Z",
  "database": "connected"
}
```

---

## Formato de Resposta

### Resposta de Sucesso (Único Item)

```json
{
  "data": {
    "id": "cm123abc",
    "name": "Exemplo",
    "createdAt": "2024-01-10T19:00:00.000Z"
  }
}
```

### Resposta de Sucesso (Lista com Paginação)

```json
{
  "data": [
    { "id": "cm123abc", "name": "Item 1" },
    { "id": "cm456def", "name": "Item 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Resposta de Erro

```json
{
  "error": {
    "message": "Mensagem de erro legível",
    "code": "ERROR_CODE",
    "details": {
      "campo": "informação adicional"
    }
  }
}
```

---

## Códigos de Status HTTP

| Código | Significado           | Uso                                        |
| ------ | --------------------- | ------------------------------------------ |
| 200    | OK                    | Requisição bem-sucedida                    |
| 201    | Created               | Recurso criado com sucesso                 |
| 400    | Bad Request           | Dados inválidos na requisição              |
| 401    | Unauthorized          | Autenticação necessária                    |
| 403    | Forbidden             | Sem permissão para o recurso               |
| 404    | Not Found             | Recurso não encontrado                     |
| 409    | Conflict              | Conflito com estado atual (ex: duplicação) |
| 429    | Too Many Requests     | Rate limit excedido                        |
| 500    | Internal Server Error | Erro no servidor                           |

---

## Paginação

### Parâmetros

Todas as rotas de listagem suportam paginação:

| Parâmetro | Tipo    | Padrão | Máximo | Descrição        |
| --------- | ------- | ------ | ------ | ---------------- |
| `page`    | integer | 1      | -      | Número da página |
| `limit`   | integer | 10     | 100    | Itens por página |

### Exemplo

```bash
GET /api/courses?page=2&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## Tratamento de Erros

### Códigos de Erro Personalizados

| Código             | Descrição                               |
| ------------------ | --------------------------------------- |
| `VALIDATION_ERROR` | Dados de entrada inválidos              |
| `NOT_FOUND`        | Recurso não encontrado                  |
| `CONFLICT`         | Recurso duplicado ou conflito de estado |
| `UNAUTHORIZED`     | Autenticação necessária                 |
| `FORBIDDEN`        | Permissão negada                        |
| `INTERNAL_ERROR`   | Erro interno do servidor                |

### Exemplo de Erro de Validação

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": ["email"],
        "message": "Invalid email format"
      },
      {
        "path": ["password"],
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

## Endpoints

## Autenticação (Auth)

Base: `/api/auth/*`

A autenticação é gerenciada pelo Better Auth. Todos os endpoints de autenticação gerenciam cookies de sessão automaticamente.

### POST /api/auth/sign-in/email

Login com email e senha.

**Request:**

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response:** 200 OK

```json
{
  "user": {
    "id": "cm123abc",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "role": "user"
  },
  "session": {
    "token": "...",
    "expiresAt": "2024-02-10T19:00:00.000Z"
  }
}
```

### POST /api/auth/sign-up/email

Registro de novo usuário.

**Request:**

```json
{
  "email": "novo@exemplo.com",
  "password": "senha123",
  "name": "Novo Usuário"
}
```

**Response:** 201 Created

### POST /api/auth/sign-out

Logout (invalida sessão atual).

**Response:** 200 OK

### GET /api/auth/session

Obter sessão atual.

**Response:** 200 OK

```json
{
  "user": {
    "id": "cm123abc",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "role": "user"
  },
  "session": {
    "token": "...",
    "expiresAt": "2024-02-10T19:00:00.000Z"
  }
}
```

### POST /api/auth/forget-password

Solicitar redefinição de senha.

**Request:**

```json
{
  "email": "usuario@exemplo.com"
}
```

**Response:** 200 OK

### POST /api/auth/reset-password

Redefinir senha com token.

**Request:**

```json
{
  "token": "reset-token-here",
  "password": "novaSenha123"
}
```

**Response:** 200 OK

---

## Usuários (Users)

Base: `/api/users`

### GET /api/users

Lista todos os usuários (Admin apenas).

**Auth:** Requer `admin` ou `super_admin`

**Query Parameters:**

- `page`: Página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máx: 100)
- `search`: Busca por nome ou email
- `sortBy`: Campo para ordenação (padrão: createdAt)
- `sortOrder`: Ordem (asc/desc, padrão: desc)

**Response:** 200 OK

```json
{
  "data": [
    {
      "id": "cm123abc",
      "email": "usuario@exemplo.com",
      "name": "Nome do Usuário",
      "role": "user",
      "emailVerified": true,
      "banned": false,
      "createdAt": "2024-01-10T19:00:00.000Z",
      "updatedAt": "2024-01-10T19:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### GET /api/users/:id

Obter usuário por ID (Admin apenas).

**Auth:** Requer `admin` ou `super_admin`

**Response:** 200 OK

```json
{
  "data": {
    "id": "cm123abc",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "role": "user",
    "emailVerified": true,
    "image": null,
    "banned": false,
    "banReason": null,
    "banExpires": null,
    "createdAt": "2024-01-10T19:00:00.000Z",
    "updatedAt": "2024-01-10T19:00:00.000Z"
  }
}
```

### POST /api/users

Criar novo usuário (Admin apenas).

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "email": "novo@exemplo.com",
  "name": "Novo Usuário"
}
```

**Response:** 201 Created

### PATCH /api/users/:id

Atualizar usuário (Admin apenas).

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "name": "Nome Atualizado",
  "role": "admin"
}
```

**Response:** 200 OK

### DELETE /api/users/:id

Deletar usuário (Admin apenas).

**Auth:** Requer `admin` ou `super_admin`

**Response:** 200 OK

```json
{
  "message": "User deleted successfully"
}
```

---

## Cursos (Courses)

Base: `/api/courses`

Gestão completa de cursos da instituição.

### POST /api/courses

Criar novo curso.

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "codigo": "TEC001",
  "nome": "Técnico em Informática",
  "descricao": "Curso técnico em desenvolvimento de sistemas",
  "descricaoCurta": "Curso técnico voltado para programação",
  "cargaHorariaTotal": 1200,
  "cargaHorariaMinima": 1000,
  "nivel": "tecnico",
  "grau": "tecnologo",
  "duracaoSemestres": 3,
  "modality": "presencial",
  "status": "publicado",
  "ativo": true,
  "categoryId": "cat123",
  "coordenadorId": "coord123",
  "dataInicioVigencia": "2024-02-01T00:00:00.000Z",
  "thumbnailPath": "/uploads/thumb.jpg",
  "customFields": {
    "campus": "Centro",
    "turno": "Integral"
  }
}
```

**Campos:**

- `codigo` (string, obrigatório): Código único do curso
- `nome` (string, obrigatório): Nome do curso
- `descricao` (string, opcional): Descrição completa
- `descricaoCurta` (string, opcional): Descrição resumida
- `cargaHorariaTotal` (integer, obrigatório): Carga horária total em horas
- `cargaHorariaMinima` (integer, opcional): Carga horária mínima
- `nivel` (enum, obrigatório): `tecnico`, `graduacao`, `pos_graduacao`
- `grau` (enum, opcional): `tecnologo`, `bacharelado`, `licenciatura`
- `duracaoSemestres` (integer, obrigatório): Duração em semestres
- `modality` (enum, padrão: presencial): `presencial`, `ead`, `hibrido`
- `status` (enum, padrão: rascunho): `rascunho`, `publicado`, `arquivado`
- `ativo` (boolean, padrão: true): Se o curso está ativo
- `customFields` (object, opcional): Campos personalizados

**Response:** 201 Created

```json
{
  "data": {
    "id": "cm123abc",
    "codigo": "TEC001",
    "nome": "Técnico em Informática",
    "descricao": "Curso técnico em desenvolvimento de sistemas",
    "nivel": "tecnico",
    "status": "publicado",
    "createdAt": "2024-01-10T19:00:00.000Z",
    "updatedAt": "2024-01-10T19:00:00.000Z"
  }
}
```

### GET /api/courses

Listar cursos com filtros.

**Auth:** Opcional (público vê apenas cursos publicados)

**Query Parameters:**

- `page`: Página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máx: 100)
- `status`: Filtrar por status (`rascunho`, `publicado`, `arquivado`)
- `nivel`: Filtrar por nível (`tecnico`, `graduacao`, `pos_graduacao`)
- `modality`: Filtrar por modalidade (`presencial`, `ead`, `hibrido`)
- `search`: Buscar em nome, descrição ou código
- `coordenadorId`: Filtrar por coordenador
- `ativo`: Filtrar por status ativo (true/false)

**Response:** 200 OK

```json
{
  "data": [
    {
      "id": "cm123abc",
      "codigo": "TEC001",
      "nome": "Técnico em Informática",
      "nivel": "tecnico",
      "modality": "presencial",
      "status": "publicado",
      "cargaHorariaTotal": 1200
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

### GET /api/courses/:id

Obter detalhes de um curso.

**Auth:** Opcional (público vê apenas cursos publicados)

**Response:** 200 OK

```json
{
  "data": {
    "id": "cm123abc",
    "codigo": "TEC001",
    "nome": "Técnico em Informática",
    "descricao": "Curso técnico em desenvolvimento de sistemas",
    "descricaoCurta": "Curso técnico voltado para programação",
    "cargaHorariaTotal": 1200,
    "nivel": "tecnico",
    "grau": "tecnologo",
    "duracaoSemestres": 3,
    "modality": "presencial",
    "status": "publicado",
    "ativo": true,
    "customFields": {
      "campus": "Centro",
      "turno": "Integral"
    },
    "createdAt": "2024-01-10T19:00:00.000Z",
    "updatedAt": "2024-01-10T19:00:00.000Z"
  }
}
```

### PUT /api/courses/:id

Atualizar curso.

**Auth:** Requer `admin` ou `super_admin`

**Request:** (mesmos campos do POST, todos opcionais)

```json
{
  "nome": "Técnico em Informática - Atualizado",
  "status": "publicado"
}
```

**Response:** 200 OK

### DELETE /api/courses/:id

Deletar ou desativar curso.

**Auth:** Requer `admin` ou `super_admin`

**Query Parameters:**

- `force`: Se true, deleta permanentemente (padrão: false = desativa)

**Response:** 200 OK

```json
{
  "data": {
    "message": "Course deactivated"
  }
}
```

**Errors:**

- `400`: Curso tem dependências (matrículas ou disciplinas) e force=false
- `404`: Curso não encontrado

---

## Disciplinas (Disciplines)

Base: `/api/courses/:courseId/disciplines`

Gestão de disciplinas dentro de um curso.

### POST /api/courses/:courseId/disciplines

Adicionar disciplinas a um curso (em lote).

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "disciplinas": [
    {
      "codigo": "MAT101",
      "nome": "Matemática I",
      "ementa": "Fundamentos de matemática",
      "cargaHorariaTeorica": 40,
      "cargaHorariaPratica": 20,
      "cargaHorariaTotal": 60,
      "areaConhecimento": "Exatas",
      "periodo": 1,
      "obrigatoria": true,
      "objetivos": ["Compreender funções", "Resolver equações"],
      "competencias": ["Raciocínio lógico"],
      "prerequisitos": [],
      "bibliografiaBasica": ["Livro 1", "Livro 2"],
      "ativo": true
    }
  ]
}
```

**Response:** 201 Created

```json
{
  "data": [
    {
      "id": "cm123abc",
      "courseId": "course123",
      "codigo": "MAT101",
      "nome": "Matemática I",
      "periodo": 1,
      "cargaHorariaTotal": 60,
      "obrigatoria": true,
      "ativo": true
    }
  ]
}
```

### GET /api/courses/:courseId/disciplines

Listar disciplinas de um curso.

**Auth:** Opcional

**Query Parameters:**

- `periodo`: Filtrar por período
- `obrigatoria`: Filtrar por tipo (true/false)
- `ativo`: Filtrar por status ativo

**Response:** 200 OK

---

## Módulos (Modules)

Base: `/api/disciplines/:disciplineId/modules`

Módulos são unidades de organização dentro de uma disciplina.

### POST /api/disciplines/:disciplineId/modules

Criar módulos em uma disciplina (em lote).

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "modulos": [
    {
      "titulo": "Módulo 1: Introdução",
      "descricao": "Introdução aos conceitos básicos",
      "ordem": 1,
      "cargaHorariaEstimada": 10,
      "objetivosAprendizagem": ["Objetivo 1", "Objetivo 2"],
      "ativo": true
    }
  ]
}
```

**Response:** 201 Created

### GET /api/disciplines/:disciplineId/modules

Listar módulos de uma disciplina.

**Auth:** Opcional

**Response:** 200 OK

---

## Aulas (Lessons)

Base: `/api/modules/:moduleId/lessons`

Aulas são o conteúdo individual dentro de cada módulo.

### POST /api/modules/:moduleId/lessons

Criar aulas em um módulo (em lote).

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "aulas": [
    {
      "titulo": "Aula 1: Primeiros Passos",
      "descricao": "Introdução ao tema",
      "tipo": "video_gravado",
      "ordem": 1,
      "videoUrl": "https://youtube.com/watch?v=abc123",
      "duracaoMinutos": 45,
      "thumbnailUrl": "/uploads/thumb1.jpg",
      "obrigatoria": true,
      "liberada": true,
      "permiteDownload": false,
      "percentualConclusaoMinimo": 80
    }
  ]
}
```

**Tipos de Aula:**

- `video_gravado`: Vídeo gravado
- `video_ao_vivo`: Transmissão ao vivo
- `texto`: Conteúdo textual
- `quiz`: Questionário
- `atividade_pratica`: Atividade prática
- `leitura`: Material de leitura

**Response:** 201 Created

### GET /api/modules/:moduleId/lessons

Listar aulas de um módulo.

**Auth:** Opcional

**Response:** 200 OK

---

## Materiais (Materials)

Base: `/api/lessons/:lessonId/materials`

Materiais de apoio para as aulas.

### POST /api/lessons/:lessonId/materials

Adicionar materiais a uma aula.

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "materiais": [
    {
      "titulo": "Slides da Aula",
      "tipo": "slides",
      "descricao": "Apresentação completa",
      "arquivoPath": "/uploads/slides.pdf",
      "tamanhoBytes": 1024000,
      "formato": "pdf",
      "obrigatorio": false,
      "ordem": 1
    }
  ]
}
```

**Tipos de Material:**

- `slides`: Apresentações
- `pdf`: Documentos PDF
- `video`: Vídeos
- `audio`: Áudios
- `link`: Links externos
- `codigo_fonte`: Código fonte
- `planilha`: Planilhas
- `outro`: Outros tipos

**Response:** 201 Created

### GET /api/lessons/:lessonId/materials

Listar materiais de uma aula.

**Auth:** Opcional

**Response:** 200 OK

---

## Quizzes

Base: `/api/lessons/:lessonId/quizzes`

Sistema de avaliação com questões e opções.

### POST /api/lessons/:lessonId/quizzes

Criar quiz completo com questões.

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "titulo": "Quiz Final",
  "descricao": "Avaliação do módulo",
  "instrucoes": "Responda todas as questões",
  "tempoLimiteMinutos": 60,
  "notaMinimaAprovacao": 7.0,
  "tentativasMaximas": 3,
  "ordemAleatoria": true,
  "mostrarRespostaImediata": false,
  "mostrarGabaritoFinal": true,
  "permitirRevisao": true,
  "pontuacaoTotal": 100,
  "questoes": [
    {
      "enunciado": "Qual é a resposta?",
      "tipo": "multipla_escolha",
      "ordem": 1,
      "pontos": 10,
      "obrigatoria": true,
      "explicacao": "Explicação da resposta",
      "opcoes": [
        {
          "texto": "Opção A",
          "correta": true,
          "feedback": "Correto!",
          "ordem": 1
        },
        {
          "texto": "Opção B",
          "correta": false,
          "feedback": "Incorreto",
          "ordem": 2
        }
      ]
    }
  ]
}
```

**Tipos de Questão:**

- `multipla_escolha`: Múltipla escolha
- `verdadeiro_falso`: Verdadeiro ou falso
- `dissertativa`: Resposta dissertativa
- `correspondencia`: Correspondência entre itens

**Response:** 201 Created

### GET /api/lessons/:lessonId/quizzes

Listar quizzes de uma aula.

**Auth:** Requer autenticação

**Response:** 200 OK

---

## Matrículas (Enrollments)

Base: `/api/students/enroll`

Gestão de matrículas de estudantes em cursos.

### POST /api/students/enroll

Matricular estudante em curso.

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "studentId": "student123",
  "courseId": "course123",
  "enrollmentDate": "2024-01-10T19:00:00.000Z",
  "startDate": "2024-02-01T00:00:00.000Z",
  "expectedCompletionDate": "2025-12-31T23:59:59.000Z",
  "status": "ativo",
  "paymentMethod": "boleto",
  "installments": 12,
  "scholarshipPercentage": 50,
  "contactEmail": "aluno@exemplo.com",
  "contactPhone": "+5511999999999",
  "metadata": {
    "origem": "vestibular",
    "campus": "Centro"
  }
}
```

**Status de Matrícula:**

- `ativo`: Matrícula ativa
- `suspenso`: Matrícula suspensa
- `concluido`: Curso concluído
- `cancelado`: Matrícula cancelada
- `trancado`: Matrícula trancada

**Response:** 201 Created

### GET /api/students/:studentId/enrollments

Listar matrículas de um estudante.

**Auth:** Requer autenticação (próprio estudante ou admin)

**Response:** 200 OK

---

## Progresso (Progress)

Base: `/api/students/:studentId/progress`

Acompanhamento do progresso de aprendizagem.

### POST /api/students/:studentId/progress

Registrar progresso em uma aula.

**Auth:** Requer autenticação (próprio estudante ou admin)

**Request:**

```json
{
  "lessonId": "lesson123",
  "watchedMinutes": 30,
  "totalMinutes": 45,
  "completionPercentage": 67,
  "status": "em_progresso",
  "notes": "Anotações do estudante"
}
```

**Status de Progresso:**

- `nao_iniciada`: Não iniciada
- `em_progresso`: Em progresso
- `concluida`: Concluída

**Response:** 201 Created

### GET /api/students/:studentId/progress

Obter progresso completo do estudante.

**Auth:** Requer autenticação (próprio estudante ou admin)

**Query Parameters:**

- `courseId`: Filtrar por curso
- `disciplineId`: Filtrar por disciplina
- `status`: Filtrar por status

**Response:** 200 OK

---

## Certificados (Certificates)

Base: `/api/certificates`

Gestão de certificados de conclusão.

### POST /api/certificates

Gerar certificado.

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "studentId": "student123",
  "courseId": "course123",
  "certificateType": "conclusao",
  "completionDate": "2024-12-15T00:00:00.000Z",
  "overallScore": 8.5,
  "certificateNumber": "CERT-2024-001",
  "studentName": "Nome do Aluno",
  "studentRegistration": "2024001",
  "courseName": "Técnico em Informática",
  "courseCode": "TEC001",
  "totalHours": 1200,
  "signatureLine1": "Diretor",
  "signatureLine1Title": "Direção Geral",
  "digitalSignature": true
}
```

**Tipos de Certificado:**

- `conclusao`: Conclusão de curso
- `participacao`: Participação
- `extensao`: Curso de extensão

**Status de Certificado:**

- `gerado`: Gerado
- `emitido`: Emitido
- `revogado`: Revogado

**Response:** 201 Created

### GET /api/certificates/:id

Obter certificado por ID.

**Auth:** Requer autenticação

**Response:** 200 OK

### GET /api/students/:studentId/certificates

Listar certificados de um estudante.

**Auth:** Requer autenticação (próprio estudante ou admin)

**Response:** 200 OK

---

## Relatórios (Reports)

Base: `/api/reports`

Geração de relatórios analíticos.

### GET /api/reports/course-analytics

Analytics de cursos (matrículas, engajamento, conclusões).

**Auth:** Requer `admin` ou `super_admin`

**Query Parameters:**

- `courseId`: ID do curso
- `startDate`: Data inicial
- `endDate`: Data final

**Response:** 200 OK

```json
{
  "data": {
    "courseId": "course123",
    "courseName": "Técnico em Informática",
    "period": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-12-31T23:59:59.000Z"
    },
    "enrollments": {
      "total": 150,
      "active": 120,
      "completed": 25,
      "dropped": 5
    },
    "engagement": {
      "averageWatchTime": 78.5,
      "completionRate": 65.3,
      "quizAverageScore": 7.8
    },
    "performance": {
      "passRate": 82.5,
      "averageGrade": 7.5
    }
  }
}
```

---

## Dashboard

Base: `/api/students/:studentId/dashboard`

Visão consolidada do estudante.

### GET /api/students/:studentId/dashboard

Obter dashboard do estudante.

**Auth:** Requer autenticação (próprio estudante ou admin)

**Response:** 200 OK

```json
{
  "data": {
    "student": {
      "id": "student123",
      "name": "Nome do Aluno",
      "email": "aluno@exemplo.com"
    },
    "enrollments": [
      {
        "courseId": "course123",
        "courseName": "Técnico em Informática",
        "status": "ativo",
        "progress": 45.5,
        "nextLesson": {
          "id": "lesson456",
          "title": "Próxima Aula"
        }
      }
    ],
    "recentActivity": [
      {
        "type": "lesson_completed",
        "lessonId": "lesson123",
        "timestamp": "2024-01-10T15:30:00.000Z"
      }
    ],
    "upcomingQuizzes": [
      {
        "quizId": "quiz789",
        "title": "Quiz Final",
        "dueDate": "2024-01-15T23:59:59.000Z"
      }
    ]
  }
}
```

---

## Instrutores (Instructors)

Base: `/api/instructors/:instructorId/courses`

Gestão de instrutores e suas atribuições.

### GET /api/instructors/:instructorId/courses

Listar cursos e disciplinas de um instrutor.

**Auth:** Requer autenticação

**Response:** 200 OK

```json
{
  "data": {
    "instructor": {
      "id": "instructor123",
      "name": "Professor Nome",
      "email": "professor@exemplo.com"
    },
    "courses": [
      {
        "courseId": "course123",
        "courseName": "Técnico em Informática",
        "role": "coordenador"
      }
    ],
    "disciplines": [
      {
        "disciplineId": "disc456",
        "disciplineName": "Matemática I",
        "courseId": "course123"
      }
    ]
  }
}
```

---

## Notificações (Notifications)

Base: `/api/notifications`

Sistema de notificações para usuários.

### POST /api/notifications/send-batch

Enviar notificações em massa.

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "targetType": "role",
  "targetValue": "user",
  "filters": {
    "courseId": "course123"
  },
  "notification": {
    "title": "Nova Aula Disponível",
    "message": "A aula de hoje já está disponível",
    "type": "info",
    "link": "/courses/course123/lessons/lesson456"
  }
}
```

**Tipos de Alvo:**

- `all`: Todos os usuários
- `role`: Por papel (user, admin, super_admin)
- `course`: Matriculados em curso específico
- `individual`: Usuário específico

**Response:** 200 OK

```json
{
  "data": {
    "sent": 120,
    "failed": 0,
    "notificationIds": ["notif1", "notif2", "..."]
  }
}
```

### GET /api/notifications

Listar notificações do usuário autenticado.

**Auth:** Requer autenticação

**Query Parameters:**

- `page`: Página
- `limit`: Itens por página
- `read`: Filtrar por lidas (true/false)

**Response:** 200 OK

---

## Uploads

Base: `/api/uploads`

Gestão de arquivos enviados.

### POST /api/uploads

Fazer upload de arquivo.

**Auth:** Requer autenticação

**Request:** multipart/form-data

```
file: [arquivo binário]
```

**Limites:**

- Tamanho máximo: 10MB
- Tipos permitidos: imagens (jpg, png, gif), documentos (pdf), vídeos (mp4)

**Response:** 201 Created

```json
{
  "data": {
    "id": "upload123",
    "filename": "arquivo-uuid.jpg",
    "originalName": "foto.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "url": "/uploads/arquivo-uuid.jpg",
    "createdAt": "2024-01-10T19:00:00.000Z"
  }
}
```

### GET /api/uploads

Listar uploads do usuário.

**Auth:** Requer autenticação

**Response:** 200 OK

### GET /uploads/:filename

Servir arquivo (rota pública).

**Auth:** Não requerida

**Response:** Arquivo binário

---

## Operações em Massa (Bulk)

Base: `/api/bulk`

Operações de importação em massa.

### POST /api/bulk/import-courses

Importar cursos em massa.

**Auth:** Requer `admin` ou `super_admin`

**Request:**

```json
{
  "courses": [
    {
      "codigo": "TEC001",
      "nome": "Curso 1",
      "nivel": "tecnico",
      "cargaHorariaTotal": 1200,
      "duracaoSemestres": 3
    },
    {
      "codigo": "TEC002",
      "nome": "Curso 2",
      "nivel": "tecnico",
      "cargaHorariaTotal": 1500,
      "duracaoSemestres": 4
    }
  ]
}
```

**Response:** 200 OK

```json
{
  "data": {
    "processed": 2,
    "created": 2,
    "failed": 0,
    "errors": [],
    "summary": {
      "created": ["TEC001", "TEC002"]
    }
  }
}
```

---

## Anexos

### Rate Limiting

A API implementa rate limiting por usuário/IP:

| Papel         | Requisições/minuto |
| ------------- | ------------------ |
| Anônimo       | 60                 |
| `user`        | 120                |
| `admin`       | 240                |
| `super_admin` | 480                |

Quando excedido, retorna:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

Headers de rate limit:

- `X-RateLimit-Limit`: Limite de requisições
- `X-RateLimit-Remaining`: Requisições restantes
- `X-RateLimit-Reset`: Timestamp de reset

### Logs e Monitoramento

Níveis de log configuráveis via `LOG_LEVEL`:

| Nível      | Descrição                                 |
| ---------- | ----------------------------------------- |
| `minimal`  | Apenas erros                              |
| `normal`   | Requisições HTTP e eventos de negócio     |
| `detailed` | Inclui debug e queries SQL                |
| `verbose`  | Tudo incluindo bodies de request/response |

### Testando a API

#### Com cURL

```bash
# Login
curl -X POST http://localhost:8080/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@exemplo.com", "password": "senha123"}' \
  -c cookies.txt

# Listar cursos
curl http://localhost:8080/api/courses \
  -b cookies.txt

# Criar curso
curl -X POST http://localhost:8080/api/courses \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "codigo": "TEC001",
    "nome": "Novo Curso",
    "nivel": "tecnico",
    "cargaHorariaTotal": 1200,
    "duracaoSemestres": 3
  }'
```

#### Com JavaScript/TypeScript

```typescript
// Usar com fetch ou axios
const response = await fetch('http://localhost:8080/api/courses', {
  method: 'GET',
  credentials: 'include', // Importante para cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

const data = await response.json();
```

### Documentação Interativa

Acesse a documentação interativa (Scalar UI) em:

```
http://localhost:8080/docs
```

Recursos:

- ✅ Testar endpoints diretamente
- ✅ Ver schemas completos
- ✅ Exemplos de requisição/resposta
- ✅ Busca rápida de endpoints
- ✅ Tema dark por padrão

### Versionamento

A API segue versionamento semântico:

- **MAJOR**: Mudanças incompatíveis com versões anteriores
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis

Versão atual: **1.0.0**

### Suporte e Contato

Para dúvidas ou problemas:

- Documentação: `/docs`
- Issues: GitHub repository
- Email: suporte@exemplo.com

---

**Última atualização:** 10 de Janeiro de 2024  
**Versão da API:** 1.0.0  
**Maintido por:** Equipe de Desenvolvimento Coltec
