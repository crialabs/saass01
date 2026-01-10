## Arquitetura de Rotas - Marketing Section

### Estrutura Implementada

```
(marketing)/
├── layout.tsx              # Layout compartilhado para todas as rotas marketing
├── page.tsx                # / (home page)
├── _components/            # Componentes globais do marketing
│   ├── Hero.tsx
│   └── Institucional.tsx
│
├── blog/
│   ├── page.tsx           # /blog
│   ├── layout.tsx         # Layout específico do blog
│   ├── loading.tsx        # Carregamento do blog
│   ├── [slug]/
│   │   ├── page.tsx       # /blog/[slug]
│   │   ├── loading.tsx    # Loading state
│   │   └── error.tsx      # Error boundary
│   ├── categoria/
│   │   └── [categoria]/
│   │       └── page.tsx   # /blog/categoria/[categoria]
│   └── _components/
│       ├── BlogCard.tsx
│       └── BlogPagination.tsx
│
├── sobre/
│   ├── page.tsx           # /sobre
│   ├── historia/
│   │   └── page.tsx       # /sobre/historia
│   ├── missao-visao-valores/
│   │   └── page.tsx       # /sobre/missao-visao-valores
│   └── equipe/
│       └── page.tsx       # /sobre/equipe
│
├── contato/
│   ├── page.tsx           # /contato
│   ├── formulario/
│   │   └── page.tsx       # /contato/formulario
│   ├── localizacao/
│   │   └── page.tsx       # /contato/localizacao
│   ├── agenda-visita/
│   │   └── page.tsx       # /contato/agenda-visita
│   ├── _components/
│   │   └── ContactForm.tsx
│   └── _lib/
│       ├── api.ts
│       └── validation.ts
│
├── cursos/
│   ├── page.tsx           # /cursos
│   ├── loading.tsx        # Loading para cursos
│   ├── [nivel]/
│   │   ├── page.tsx       # /cursos/[nivel]
│   │   ├── loading.tsx
│   │   └── [slug]/
│   │       ├── page.tsx   # /cursos/[nivel]/[slug]
│   │       ├── loading.tsx
│   │       └── error.tsx
│   ├── [categoria]/       # Estrutura anterior
│   │   └── [cursoSlug]/
│   │       └── page.tsx
│   ├── _components/
│   │   ├── CursoCard.tsx
│   │   └── CursoFilter.tsx
│
├── admissao/
│   ├── page.tsx           # /admissao
│   ├── processo-seletivo/
│   │   └── page.tsx
│   ├── inscricao/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── bolsas-financiamento/
│   │   └── page.tsx
│   ├── faq/
│   │   └── page.tsx
│   ├── _components/
│   │   ├── InscricaoForm.tsx
│   │   └── BolsasTable.tsx
│   └── _lib/
│       ├── api.ts
│       └── validation.ts
│
├── vida-no-campus/
│   ├── page.tsx           # /vida-no-campus
│   ├── infraestrutura/
│   │   └── page.tsx
│   ├── atividades-extracurriculares/
│   │   └── page.tsx
│   ├── eventos/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── depoimentos/
│   │   └── page.tsx
│   └── _components/
│       ├── EventCard.tsx
│       └── TestimonialCarousel.tsx
│
└── carreira/
    ├── page.tsx           # /carreira
    ├── estagios/
    │   ├── page.tsx
    │   └── loading.tsx
    ├── egresados/
    │   └── page.tsx
    ├── oportunidades-emprego/
    │   ├── page.tsx
    │   └── loading.tsx
    └── _components/
        ├── VagaCard.tsx
        └── VagaFilter.tsx
```

### Padrões Utilizados

#### 1. **Route Groups** `(marketing)/`

- Organiza rotas sem afetar URL
- Múltiplos layouts na mesma URL base
- Não aparece na URL final

#### 2. **Private Folders** `_name`

- Componentes e utilitários não roteáveis
- Não aparecem em URLs
- Mantêm lógica relacionada perto das rotas

#### 3. **Dynamic Routes** `[param]`

- `/blog/[slug]` - artigos individuais
- `/cursos/[nivel]/[slug]` - cursos por nível
- `/blog/categoria/[categoria]` - artigos por categoria

#### 4. **Special Files**

- `layout.tsx` - Layout compartilhado
- `page.tsx` - Torna rota pública
- `loading.tsx` - Suspense boundary
- `error.tsx` - Error boundary

### Componentes por Seção

#### Blog (`_components/`)

- `BlogCard` - Card individual de artigo
- `BlogPagination` - Paginação de artigos

#### Contato (`_lib/`)

- `api.ts` - Chamadas para enviar contatos
- `validation.ts` - Validações de formulário

#### Cursos (`_components/`)

- `CursoCard` - Card do curso
- `CursoFilter` - Filtro por nível

#### Admissão (`_components/` e `_lib/`)

- `InscricaoForm` - Formulário de inscrição
- `BolsasTable` - Tabela de bolsas
- `api.ts` - Chamadas de API
- `validation.ts` - Validações

#### Vida no Campus (`_components/`)

- `EventCard` - Card de evento
- `TestimonialCarousel` - Carrossel de depoimentos

#### Carreira (`_components/`)

- `VagaCard` - Card de vaga
- `VagaFilter` - Filtro por tipo de vaga

#### Marketing (`_components/`)

- `Hero` - Seção hero
- `Institucional` - Informações institucionais

### Benefícios

✅ **Organização** - Estrutura clara e escalável
✅ **Manutenibilidade** - Fácil localizar e modificar
✅ **Reutilização** - Componentes compartilhados
✅ **Performance** - Loading states adequados
✅ **UX** - Error boundaries para melhor experiência
✅ **Type Safety** - TypeScript em todos os arquivos
