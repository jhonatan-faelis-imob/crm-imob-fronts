---
name: crm-imob
description: >
  Skill de desenvolvimento do projeto CRM Imobiliário — SaaS multi-tenant para gestão
  de leads, follow-up, metas e equipes de imobiliárias. Use esta skill SEMPRE que o
  usuário mencionar o CRM imobiliário, pedir para codar qualquer feature do sistema,
  configurar o ambiente, criar módulos NestJS, componentes Next.js/React Native, modelar
  banco, criar telas, relatórios, metas, kanban, follow-up, ou qualquer funcionalidade
  descrita neste projeto. Também use quando o usuário falar em corretor, lead, funil,
  imobiliária, empreendimento, lançamento, revenda, VGV, follow-up, meta de vendas,
  kanban imobiliário, equipe de corretores, ou hierarquia de usuários do CRM.
---

# CRM Imobiliário — Skill de Desenvolvimento

## O Produto

SaaS multi-tenant para imobiliárias gerenciarem leads, follow-up, metas e equipes.
Focado em corretores de **lançamento e revenda** que perdem clientes por falta de follow-up
e precisam de controle de metas de VGV.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend Web | Next.js 14 (App Router) |
| Mobile | React Native + Expo |
| Backend | NestJS + TypeScript strict |
| Banco de dados | PostgreSQL (Neon.tech) + Prisma ORM |
| Auth | Supabase Auth ou JWT próprio |
| Storage (docs/fotos) | Supabase Storage |
| Filas / Jobs | BullMQ + Redis (Upstash) |
| IA (score de lead) | Google Gemini API (gratuito) |
| Email | Resend |
| Push notifications | OneSignal |
| Pagamentos | Stripe |
| Deploy Frontend | Vercel |
| Deploy Backend | Railway |
| UI | Tailwind CSS + shadcn/ui |
| Validação Frontend | Zod |
| Validação Backend | class-validator + class-transformer |

---

## Arquitetura Multi-tenant

- **Estratégia:** 1 banco, separação por `organization_id` em todas as tabelas
- **Isolamento:** Row Level Security (RLS) no PostgreSQL
- **Como funciona:** o backend seta `SET app.current_tenant = '<org_id>'` a cada request
- **Nunca** criar banco separado por cliente — tudo na mesma instância Neon

---

## Hierarquia de Usuários (Roles)

```
Diretor       → acesso total à organização
  └── Gerente → acesso total à organização
        └── Coordenador → acesso apenas à sua equipe (team_id)
              └── Corretor    → acesso apenas aos seus leads
              └── Administrativo → acesso configurável
```

**Regra de visibilidade:**
- `diretor` e `gerente`: veem tudo da organização
- `coordenador`: veem apenas usuários e leads do seu `team_id`
- `corretor`: veem apenas seus próprios leads (`owner_id = user.id`)
- `administrativo`: acesso configurável (sem leads por padrão)

---

## Modelo de Dados — Tabelas Principais

```
organizations                          → tenants (imobiliárias)
  ├── teams                            → equipes (1 coordenador por equipe)
  ├── users                            → todos os perfis (role + team_id)
  ├── funnel_stages                    → etapas do kanban (padrão + customizadas)
  ├── properties                       → empreendimentos (lançamento) e imóveis (revenda)
  ├── leads                            → clientes/leads (rico: financeiro + contrato + IA)
  │     ├── lead_properties            → vínculo lead ↔ imóvel/empreendimento
  │     ├── interactions               → histórico de follow-up
  │     ├── tasks                      → tarefas encadeadas (has_next_task flag)
  │     └── documents                  → documentos do cliente (futuro)
  ├── goals                            → metas (organização | equipe | individual)
  │     └── goal_daily_entries         → preenchimento diário do funil do corretor
  └── sales                            → vendas realizadas (base dos relatórios)
```

O arquivo `schema.sql` completo está em `/schema.sql` (raiz do projeto).

---

## Módulos NestJS

```
src/modules/
  ├── auth/               → JWT, login, refresh token
  ├── organizations/      → CRUD de organizações + onboarding
  ├── users/              → CRUD usuários + hierarquia
  ├── teams/              → CRUD equipes + coordenador
  ├── leads/              → CRUD leads + filtros + score IA
  ├── interactions/       → histórico de follow-up
  ├── tasks/              → tarefas encadeadas + lembretes
  ├── properties/         → empreendimentos e revenda
  ├── funnel/             → etapas do kanban (padrão + custom)
  ├── goals/              → metas + funil individual + entradas diárias
  ├── sales/              → registro de vendas + comissão
  ├── reports/            → relatórios (período, VGV, equipe, corretor)
  ├── ai/                 → integração Gemini (score + próximos passos)
  └── notifications/      → jobs de follow-up (BullMQ + OneSignal)
```

### Padrão de Camadas (obrigatório em todos os módulos)

```
Controller  → recebe request, valida DTO, chama Service
Service     → regra de negócio pura, chama Repository
Repository  → acessa Prisma, sem lógica de negócio
```

---

## Páginas — Frontend (Next.js)

```
app/
  ├── (auth)/
  │   ├── login/
  │   └── cadastro/
  └── (dashboard)/
      ├── page.tsx                  → Dashboard principal
      ├── leads/
      │   ├── page.tsx              → Lista + Kanban
      │   └── [id]/page.tsx         → Detalhe do lead
      ├── tarefas/page.tsx          → Tarefas em aberto
      ├── empreendimentos/
      │   ├── page.tsx
      │   └── [id]/page.tsx
      ├── equipe/page.tsx           → Gestão da equipe
      ├── metas/
      │   ├── page.tsx              → Visão geral das metas
      │   └── [id]/page.tsx         → Detalhe + funil diário
      └── relatorios/page.tsx       → Relatórios
```

---

## Dashboard — Componentes

O dashboard tem as seguintes seções:

1. **Alertas importantes** — leads sem contato há N dias, tarefas vencidas
2. **Tarefas em aberto** — lista rápida com due_date
3. **Funil de vendas** — visual com contagem de leads por `funnel_stage`
4. **Assinados por empreendimento** — vendas agrupadas por `property_id`
5. **Ranking TOP 5 por quantidade** — corretores com mais vendas no período
6. **Ranking TOP 5 por VGV** — corretores com maior VGV no período
7. **Filtro de período** — mês atual (padrão), qualquer mês ou ano todo

---

## Kanban de Leads

- Etapas vêm da tabela `funnel_stages` (order_index define a ordem)
- **Etapas padrão** (`is_default = true`): não podem ser deletadas, apenas renomeadas
- **Etapas customizadas**: CRUD livre pelo usuário
- Etapas padrão do sistema:
  `Novo → Contato → Qualificação → Simulação → Agendamento → Negociação → Ganho → Perdido`
- Drag & drop atualiza `lead.funnel_stage_id`

---

## Follow-up — Lógica de Encadeamento

```
Task concluída (status = 'concluida')
  └── has_next_task = true?
        └── Abre formulário inline para criar próxima task
              └── Nova task com parent_task_id = task atual
```

Campos obrigatórios de uma task:
- `title`, `type`, `due_date`, `assigned_to`, `priority`
- `has_next_task` (checkbox no formulário)

---

## Score de IA (Gemini)

- **Acionado manualmente** pelo corretor (botão "Analisar com IA" no detalhe do lead)
- **Input para o Gemini:** histórico de `interactions` + dados financeiros do lead
- **Output esperado (JSON):**
```json
{
  "score": 78,
  "summary": "Cliente demonstra interesse real, renda compatível, aguarda simulação.",
  "next_steps": ["Enviar simulação até sexta", "Agendar visita ao decorado"]
}
```
- Salva em `leads.ai_score`, `leads.ai_summary`, `leads.ai_next_steps`, `leads.ai_updated_at`

---

## Metas — 3 Níveis

| Nível | `team_id` | `user_id` | Quem cria |
|---|---|---|---|
| Organização | NULL | NULL | Diretor / Gerente |
| Equipe | preenchido | NULL | Diretor / Gerente / Coordenador |
| Individual | NULL | preenchido | Qualquer um para si mesmo |

### Funil Individual do Corretor

Na criação da meta individual, o corretor preenche:
- VGV desejado (`target_vgv`)
- Ticket médio das unidades (`avg_ticket`)
- % de comissão (`commission_pct`)

O sistema calcula automaticamente:
```
goal_units = target_vgv / avg_ticket
// Taxas de conversão aplicadas para estimar o funil:
goal_closings      = goal_units
goal_appointments  = goal_closings * 3
goal_simulations   = goal_appointments * 2
goal_qualifications = goal_simulations * 2
goal_prospects     = goal_qualifications * 3
goal_calls         = goal_prospects * 5
```

O corretor preenche `goal_daily_entries` diariamente com o realizado em cada etapa.

---

## Cruzamento Renda ↔ Empreendimento

Quando um lead é cadastrado ou sua renda é atualizada:
1. Busca `properties` onde `min_income <= lead.income <= max_income` e `active = true`
2. Retorna sugestões de empreendimentos compatíveis no radar do lead

---

## Relatórios disponíveis

- Vendas por período (filtro: data início / fim)
- VGV por empreendimento
- Vendas por faixa de renda do cliente
- Vendas por faixa etária
- Ranking por equipe
- Ranking por gerência
- Ranking por corretor

Todos os relatórios têm como base a tabela `sales` + JOINs com `leads`, `properties`, `users`, `teams`.

---

## Design System

Inspirado no Airbnb — clean, acolhedor, tipografia forte, vermelho coral icônico.

### Cores

```css
/* Brand */
--brand:       #FF385C;   /* principal — botões, destaques, score IA */
--brand-dark:  #E31C5F;   /* hover do brand */
--brand-light: #FF6B81;   /* versão clara */
--brand-bg:    #FFF0F2;   /* fundo de badges brand */

/* Neutros (quentes, não frios) */
--neutral-900: #222222;   /* texto principal */
--neutral-600: #484848;   /* texto secundário */
--neutral-400: #767676;   /* texto muted / labels */
--neutral-200: #DDDDDD;   /* bordas */
--neutral-100: #F7F7F7;   /* superfície de cards internos */

/* Fundo da aplicação */
--page-bg:     #F7F5F3;   /* warm gray — fundo de todas as páginas */

/* Semânticas */
--success:     #008A05;
--warning:     #C45800;
--info:        #0070F3;
--danger:      #D93B30;

/* Semânticas — backgrounds (badges, banners) */
--success-bg:  #E8F5E9;
--warning-bg:  #FFF3E0;
--info-bg:     #EBF5FF;
--danger-bg:   #FFEBEE;
```

### Tipografia

**Fonte:** `Plus Jakarta Sans` (Google Fonts)

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
font-family: 'Plus Jakarta Sans', sans-serif;
```

| Uso | Tamanho | Peso |
|---|---|---|
| Título de página | 28px | 600 |
| Título de seção | 20px | 600 |
| Body strong | 16px | 500 |
| Body muted | 14px | 400 |
| Caption / label | 12px | 400 |
| Badge / tag | 11–12px | 500 |

### Border radius

| Elemento | Raio |
|---|---|
| Badges / pills | 50px |
| Botões | 8px |
| Inputs | 12px |
| Cards | 16px |

### Bordas

Sempre `0.5px solid #DDDDDD` (var(--neutral-200)) em cards e inputs em repouso.
Em foco/hover de input: `1.5px solid var(--brand)`.

### Botões

```css
/* Primário */
background: var(--brand); color: white; border-radius: 8px; font-weight: 500;

/* Secundário */
background: transparent; color: var(--neutral-900);
border: 1.5px solid var(--neutral-900); border-radius: 8px;

/* Ghost */
background: transparent; color: var(--neutral-600);
border: 0.5px solid var(--neutral-200); border-radius: 8px;
```

### Badges de status do funil

```css
Novo:         bg #EBF5FF  · color #0070F3
Contato:      bg #F3E8FF  · color #7C3AED
Qualificação: bg #FFF0F2  · color #E31C5F
Simulação:    bg #FFF7E0  · color #B45309
Agendamento:  bg #FFF3E0  · color #C45800
Negociação:   bg #FFF0F2  · color #FF385C
Ganho:        bg #E8F5E9  · color #008A05
Perdido:      bg #FFF3E0  · color #C45800
```

### Estrutura visual das páginas

```
background: var(--page-bg)  →  #F7F5F3 (warm gray em todas as páginas)
  └── cards: background white, border-radius 16px, border 0.5px #DDDDDD
        └── elementos internos: background #F7F7F7, border-radius 12px
```

### Layout e navegação

- **Menu:** lateral fixo no desktop (`lg:`), ícones flutuantes no bottom em mobile
- **Mobile first** — toda tela pensada primeiro para 375px
- **UI base:** Tailwind CSS + shadcn/ui

### Breakpoints

| Breakpoint | Largura | Contexto |
|---|---|---|
| base | 0px+ | Mobile (prioridade) |
| `sm` | 640px+ | Mobile grande |
| `md` | 768px+ | Tablet |
| `lg` | 1024px+ | Desktop |

### Checklist por tela nova

- [ ] Funciona em 375px (iPhone SE)?
- [ ] Touch targets ≥ 44px?
- [ ] font-size dos inputs ≥ 16px (evita zoom no iOS)?
- [ ] Sem overflow horizontal?
- [ ] Navegação acessível com o polegar (bottom nav no mobile)?

---

## Convenções de Código

- TypeScript `strict: true` em todo o projeto
- Nomes de domínio em **português** (`lead`, `corretor`, `meta`, `empreendimento`)
- Nomes de infra em **inglês** (`service`, `repository`, `controller`, `dto`, `guard`)
- Sempre validar input: `class-validator` no NestJS, `Zod` no Next.js
- Repository nunca contém lógica de negócio
- Service nunca acessa Prisma diretamente
- Sempre incluir `organization_id` nos filtros de query (nunca esquecer o tenant)

---

## Variáveis de Ambiente

```env
# Backend
DATABASE_URL=              # Neon PostgreSQL
REDIS_URL=                 # Upstash Redis
JWT_SECRET=
FRONTEND_URL=              # Origem do frontend em produção, liberada no CORS
GEMINI_API_KEY=
RESEND_API_KEY=
ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Frontend
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Estado Atual — Frontend Implementado (mockado, sem backend)

> Esta seção documenta o que **já existe em código** em `imob-front/crm-imob-front`, para servir de baseline
> entre sessões. As seções acima (Módulos NestJS, `schema.sql`, etc.) continuam sendo o **plano** de backend —
> nada disso foi implementado ainda. Todo o frontend hoje roda 100% sobre dados mockados por feature
> (`mock-data.ts`); "salvar" em qualquer formulário só faz `console.log(data)` e fecha o modal.

### Stack real em uso no frontend

Difere em alguns pontos do planejado na tabela "Stack Tecnológica" acima:

| Camada | Tecnologia real |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| UI primitives | `@base-ui/react` (não Radix puro) — Dialog, Sheet, Menu, Tabs, Avatar, Button, Badge em `src/components/ui/`, no padrão shadcn |
| Estilo | Tailwind CSS v4 via `@theme inline` em `globals.css` — **não existe** `tailwind.config.ts` |
| Formulários | `react-hook-form` + `zod` (`zodResolver`) em todo formulário complexo |
| Máscaras | `react-imask` (`IMaskInput` via `Controller`) — telefone, CPF, CEP, moeda BRL |
| Autocomplete de endereço | ViaCEP (`https://viacep.com.br/ws/{cep}/json/`) via `axios`, hook `useAddressLookup` |
| Ícones | `lucide-react` |
| Gráficos | `recharts` — usado em `/relatorios` (AreaChart, BarChart, PieChart), sempre dentro de `ResponsiveContainer` |
| Toast | `src/components/ui/toast.tsx` (Toast do `@base-ui/react`) — `<Toaster>` montado no `RootLayout`; disparar com `toast.add({ title, type })` |
| Estado global / data fetching | `zustand` e `@tanstack/react-query` instalados mas **sem uso real** — tudo é mock local em memória |

### Estrutura de pastas real

```
src/
  app/
    (auth)/login/page.tsx        → UI completa + validação zod; login é mockado (delay + console.log)
    (dashboard)/
      layout.tsx                 → Sidebar (desktop) + BottomNav (mobile)
      dashboard/page.tsx
      leads/page.tsx
      empreendimentos/page.tsx
      metas/page.tsx
    layout.tsx                   → RootLayout, fonte Plus Jakarta Sans, suppressHydrationWarning no <body>
    page.tsx                     → redirect('/dashboard')
  components/
    layout/                      → Sidebar, BottomNav
    ui/                          → primitives estilo shadcn sobre @base-ui/react
  features/
    leads/                       → kanban, list view, filtros, card, dialog de cadastro (4 abas)
      lead-form/                 → schema zod, options, masks, tabs, tags-input
      components/detail/         → página de detalhe do lead (tabs, sidebar, tarefas, timeline)
    empreendimentos/             → grid/list de imóveis, cards, dialogs (empreendimento + revenda)
      property-form/             → equivalente ao lead-form, para imóveis
    metas/                       → metas em 3 níveis, funil individual, ranking
    tarefas/                     → lista + calendário, encadeamento, modal de conclusão reutilizável
      components/                → complete-task-modal.tsx (usado também em leads/detail)
    equipe/                      → equipes, membros, hierarquia (Sheet), cadastro de membro/equipe
    relatorios/                  → gráficos recharts (VGV, ranking, funil de origem), histórico de vendas
  lib/utils.ts                   → cn(), formatCurrency(), getInitials(), daysSince()
  types/index.ts                 → fonte única de tipos do domínio no frontend
```

**Rotas implementadas:** `/`, `/login`, `/dashboard`, `/meu-dia`, `/leads`, `/leads/[id]`, `/empreendimentos`, `/metas`,
`/tarefas`, `/mensagens`, `/equipe`, `/relatorios`, `/cadencias`.

### Menu (Sidebar e sheet "Menu" do BottomNav)

- Nível principal: Dashboard, Meu dia, Leads, Tarefas, Empreendimentos, Metas, Relatórios e, no fim, o grupo
  **Configurações** (Settings, expansível com ChevronDown). Os subitens ficam em `src/components/layout/settings-nav.ts`:

  | Subitem | Rota | Quem vê |
  |---|---|---|
  | Mensagens | `/mensagens` | todos |
  | Equipe | `/equipe` | todos (mesma regra de antes) |
  | Cadências | `/cadencias` | gerente ou superior (`canManageCadences`) |

- Sem nenhum subitem visível, o grupo some. O grupo fica destacado e abre sozinho em `/mensagens`, `/equipe` e `/cadencias`
  (`useSettingsGroup`); fora delas começa recolhido. As três páginas mostram "Configurações" em muted acima do título.
- **Hidratação:** a primeira renderização usa a lista completa e estática; o filtro por cargo (e o nome do usuário no rodapé
  do Sidebar) só entra depois de `useHydrated()`. O lint (react-hooks 7) não aceita `setState` em `useEffect`, por isso o
  "mounted" é o `useHydrated`.
- O botão "Cadências" no cabeçalho de Leads continua, só para gerente ou superior.
**Sem páginas de detalhe ainda:** `empreendimentos/[id]`.

### Padrão de formulário/modal (repetido em leads e empreendimentos)

Todo cadastro complexo segue o mesmo esqueleto — ao criar uma nova tela de cadastro, copie este padrão:

- `Dialog` do `@base-ui/react` (não `Sheet`) — centralizado, `max-w-2xl`, `max-h-[90vh]`, `flex flex-col`
- Header fixo (título + abas), conteúdo com `overflow-y-auto`, footer fixo (Anterior / Próximo / Salvar)
- Uma aba = um `FieldGrid` (grid 2 colunas, 1 coluna no mobile) de `FormField`
- Schema zod dividido por aba (`z.object({ aba1: ..., aba2: ... })`); `trigger()` valida só a aba atual antes de avançar
- Campos com máscara usam o componente genérico `MaskedInput` (Controller + `IMaskInput`)
- Campo de CEP sempre acompanhado de botão "Auto completar" (ViaCEP)
- **Armadilha conhecida:** select nativo "opcional" reporta `''` (não `undefined`) quando nada foi escolhido —
  `z.enum(...).optional()` sozinho falha a validação em silêncio. Usar o helper `optionalSelectEnum` (aceita
  `''` como valor válido) já presente em `lead-form/schema.ts` e `new-property-dialog.tsx`.

Referências: `src/features/leads/new-lead-dialog.tsx` (4 abas) e
`src/features/empreendimentos/new-development-dialog.tsx` / `new-property-dialog.tsx` (2 abas cada).

### Tipos do domínio

`src/types/index.ts` é a fonte única de tipos do frontend (não é gerado a partir de `schema.sql`). Entidades
já tipadas: `Organization`, `Team`, `User`, `FunnelStage`, `Lead`, `Task`, `Property`, `Sale`, `Goal`,
`GoalDailyEntry`, `Interaction`, `Document`, `LeadTag`, `MessageTemplate`, `DailyActivity`, `SaleStatusHistory`.

Pontos de atenção:
- `Property` serve tanto `kind: 'empreendimento'` quanto `kind: 'revenda'` — `status: PropertyStatus` é um
  union combinado (`disponivel | reservado | vendido` para revenda + `lancamento | em_obras | pronto_morar |
  entregue | esgotado | suspenso` para empreendimento); cada feature usa só o subconjunto relevante
  (`DEVELOPMENT_STATUS_META` / `RESALE_STATUS_META` em `features/empreendimentos/constants.ts`)
- `Lead.urgency?: LeadUrgency` e `Lead.tags?: LeadTag[]` — exibidos no kanban (badge de urgência colorido +
  chips de tag, máx. 2 visíveis + contador)
- `Task` tem campos aditivos `nextTaskType/nextTaskTitle/nextTaskDaysAfter` (template da tarefa seguinte
  quando `hasNextTask = true`, usado pelo modal de conclusão)
- `Sale` tem campos aditivos `status: SaleStatus`, `leadName?`, `teamName?` (snapshot conveniente para tabelas,
  sem precisar de JOIN no mock) — usado em `/relatorios`
- Regra "nenhum `any`" é seguida à risca em todo o frontend

### Design system — implementação real

Os tokens `--brand`, `--neutral-*`, `--success/warning/info/danger` do "Design System" abaixo estão vivos em
`src/app/globals.css` (bloco `@theme inline`) e viram classes Tailwind automaticamente (`bg-brand`,
`text-neutral-400` etc). Os `-bg` (ex.: `--success-bg`) **não** são tokens Tailwind — são usados como valor
arbitrário (`bg-[#E8F5E9]`) direto no componente que precisa.

Convenção de badge (kanban, status de imóvel, urgência de lead): objeto `{ label, bg, text }` por valor de
enum, renderizado com `style={{ backgroundColor, color }}` — não usa o componente `Badge` genérico de `ui/`.

---

## Metas — regras atuais

- **Registros diários:** `goal_daily_entries` é a fonte oficial do funil. Um registro por meta, usuário e dia; salvar
  de novo substitui o total do dia. `daily_activities` está **sem uso** (só aparece em `prisma/reset.ts`) e não deve
  receber código novo.
- **Datas:** no front, `toLocalISODate()` de `src/lib/date.ts` (nunca `toISOString()` para montar dia). No back,
  `toDateOnly()` para colunas `@db.Date` e `businessDayBounds()` para filtrar colunas com horário pelo dia de
  America/Sao_Paulo, ambos em `src/common/utils/date.ts`.
- **Dia do registro:** o modal aceita qualquer dia de `periodStart` até hoje (ou até `periodEnd`, em meta encerrada) e
  a API rejeita o resto. Dia com registro salvo mostra o salvo; sem registro, o preenchimento automático.
- **Editar e excluir meta:** mesma regra, em `canManageGoal` (`goals.service.ts`) e `canEditGoal` (`features/metas/api.ts`).
  A exclusão é lógica (`active = false`): meta inativa responde 404 em todas as rotas e não entra em listas nem recálculos.
- **Histórico de etapas:** `lead_stage_history` recebe uma linha em `updateStage`, `markAsLost` e na criação de lead
  com etapa. `toStageName` guarda o nome normalizado (sem acento, minúsculo) e alimenta `GET /goals/auto-fill`, que
  conta leads distintos por etapa.
- **Taxas de conversão:** `Goal.conversionRates` (JSON) gera o funil de meta individual de VGV. Vazio usa o padrão
  3 / 2 / 2 / 3 / 5, equivalente aos multiplicadores 3, 6, 12, 36 e 180. Cada etapa arredonda para cima, igual em
  `goals.service.ts` e `features/metas/calculations.ts`.
- **Progresso:** `GET /goals/:id/summary` devolve `progress` conforme `Goal.type` e `pace`. O funil só existe em meta
  individual de VGV.

---

## Mensagens de WhatsApp — regras atuais

- **Módulo:** `message-templates` no backend, `features/mensagens` e `/mensagens` no front. Modelo público é da
  organização; privado só aparece para o dono. Sem nenhum modelo na organização, o `GET` cria os 7 padrão (`userId` nulo).
- **Permissão:** compartilhar exige coordenador ou superior. O dono edita e exclui o modelo privado; público, só gerente
  ou superior (`assertCanManage` e `canManageTemplate`).
- **Variáveis:** `{{nome}}`, `{{primeiro_nome}}`, `{{empreendimento}}`, `{{corretor}}`, `{{telefone_corretor}}`,
  `{{imobiliaria}}` e `{{saudacao}}` (horário de America/Sao_Paulo). Variável vazia ou desconhecida fica no texto e vai em
  `missing`; o botão de abrir fica desabilitado enquanto restar `{{...}}`.
- **Registrar interação ao abrir o WhatsApp:** "Abrir no WhatsApp" sempre chama `send-log` (ou `send-log-free`, na
  mensagem livre), que cria a interação `whatsapp`, atualiza `lastContactAt` e conta no preenchimento automático de
  ligações. Copiar texto e "Abrir sem mensagem" não registram.
- **Número:** sempre pelo helper `whatsappUrl` de `src/lib/whatsapp.ts`.

---

## Meu dia — regras atuais

- **Módulo:** `my-day` no backend (só leitura, sem tabela própria), `features/meu-dia` e `/meu-dia` no front. `GET /my-day`
  devolve `{ viewingUser, summary, items }` e `GET /my-day/summary` só o resumo, usado no badge do menu. O resumo conta
  todos os itens, não só os devolvidos.
- **Limites:** todos em `src/modules/my-day/my-day.config.ts`. Dias sem contato: 3 no geral, 2 em Simulação, Agendamento e
  Negociação, 1 com urgência imediata. Primeiro contato: 60 minutos de carência. Máximo de 100 itens e 500 leads lidos.
- **Pontuação** (`my-day.scoring.ts`): a maior entre os motivos, mais os bônus.

  | Motivo | Quando | Pontos |
  |---|---|---|
  | `tarefa_vencida` | Tarefa antes do início de hoje | 100 + min(dias, 10) × 2 |
  | `primeiro_contato` | Nunca contatado, passada a carência | 90 |
  | `urgencia_imediata` | `imediato` e sem contato no limite | 85 |
  | `tarefa_hoje` | Tarefa de hoje | 70 (+10 se o horário passou) |
  | `sem_contato` | Dias sem contato no limite da etapa | 50 + min(dias, 15) |
  | `sem_proxima_tarefa` | Nenhuma tarefa pendente no lead | 45 |

  Bônus: `imediato` +20, `um_mes` +10, `tres_meses` +5, etapa avançada +10. Faixas: 85 ou mais é `agora`, 60 a 84 é `hoje`,
  abaixo disso `atencao`. Empate ordena por `interestValue`.
- **Regra anti-ruído:** lead com tarefa pendente de data futura não gera `sem_contato` nem `sem_proxima_tarefa`, de qualquer
  responsável. `urgencia_imediata` e `primeiro_contato` continuam valendo.
- **Quem entra:** tarefas pendentes do usuário e leads dele, sempre fora de Ganho e Perdido (status ou etapa). Tarefa de lead
  encerrado fica só em `/tarefas`. Lead de outro corretor entra apenas pela tarefa atribuída ao usuário.
- **Ver como:** corretor só vê a si mesmo, coordenador a própria equipe, gerente e diretor a organização toda. Quem age na
  tela de outro cria a tarefa em nome do dono da fila.
- **Concluir tarefa (`TasksService.complete`):** com lead e tipo `ligacao`, `whatsapp`, `email`, `visita` ou `reuniao`, atualiza
  `lastContactAt`. Com texto e tipo `ligacao` ou `whatsapp`, cria também a interação, que soma em "Registrar atividades".
  Sem texto não cria, para não inflar as contagens. Reconcluir uma tarefa não repete nada disso.
- **Cache:** depois de qualquer ação que mude tarefa, contato ou etapa, chamar `invalidateMyDayQueries`. O badge não usa
  `useAuthStore`, para não quebrar a hidratação; na página, o que depende de usuário ou horário espera `useHydrated`.

---

## Cadências — regras atuais

- **Módulo:** `cadences` no backend (tabela `stage_cadence_steps`), `features/cadencias` e `/cadencias` no front.
  `GET /cadences` devolve as etapas em ordem com seus passos (por `orderIndex`, a ordem arrastada na tela, depois
  `offsetDays`) e é liberado para todos. `POST/PATCH/DELETE /cadences/steps` exigem gerente ou superior (`@Roles('gerente')`
  e `canManageCadences`). Máximo de 8 passos por etapa; a etapa de um passo não muda depois de criado; passo novo entra no
  fim da etapa.
- **Outros endpoints:**

  | Endpoint | Quem | O que faz |
  |---|---|---|
  | `GET /cadences/lead/:leadId` | quem vê o lead (`assertCanViewLead`) | `{ stage, steps, tasks }`: etapa atual, passos ativos e tarefas automáticas dela (qualquer status, com `assignee`) |
  | `POST /cadences/lead/:leadId/reapply` | quem vê o lead | Cria só os passos sem tarefa pendente, não cancela nada. `{ created }` |
  | `POST /cadences/stages/:stageId/apply-existing` | gerente+ | `{ dryRun }`. Leads ativos da etapa, com dono, sem tarefa pendente do passo. Prévia devolve `{ leads, tasksToCreate }`; sem `dryRun`, grava tudo numa transação e devolve também `created` |
  | `PATCH /cadences/steps/reorder` | gerente+ | `{ stageId, orderedIds }`, exatamente os passos da etapa (sem faltar, sobrar ou repetir) |

- **Limite:** no máximo 300 tarefas por aplicação (`MAX_TASKS_PER_APPLY`); acima disso, 400 "Muitas tarefas de uma vez.
  Aplique por partes." já na prévia.
- **Tarefas:** `GET /tasks?auto=true|false` filtra pela origem (filtro "Origem" em `/tarefas`). O `PATCH /tasks/:id` edita
  tarefa automática, mas descarta `autoGenerated`, `cadenceStageId` e `cadenceStepId` do corpo.
- **Detalhe do lead:** seção "Cadência" (`cadence-card.tsx`, abaixo de "Próxima tarefa"), query `['cadence-lead', id]`.
  `invalidateMyDayQueries` também invalida `cadence-lead`; ações da tela de cadências usam `invalidateCadenceQueries`.
- **Passos padrão:** organização com zero passos recebe os padrão (`default-steps.ts`) no `GET /cadences` e antes de qualquer
  mudança de etapa (`ensureDefaults`, com advisory lock para não duplicar). Associados pelo nome normalizado da etapa;
  etapa ausente é ignorada. Excluir todos os passos faz os padrão voltarem: para desligar, desative os passos.

  | Etapa | Passos |
  |---|---|
  | contato | +2 WhatsApp "Follow-up: retomar conversa com {{primeiro_nome}}" |
  | qualificacao | +1 ligação "Confirmar renda e coletar documentos…", +3 WhatsApp "Cobrar documentos pendentes…" |
  | simulacao | +1 WhatsApp "Enviar a simulação e tirar dúvidas…", +3 ligação "Retorno da simulação: {{nome}}" |
  | agendamento | +1 ligação "Confirmar o horário da visita…", +3 WhatsApp "Pós-visita: ouvir o feedback…" |
  | negociacao | +1 ligação "Acompanhar a proposta…", +3 ligação "Fechar pendências…" |
  | ganho | +30 WhatsApp "Pós-venda: pedir indicação a {{primeiro_nome}}" |

- **Quando aplica:** `CadencesService.applyOnStageChange(tx, …)`, na mesma transação do `lead_stage_history`. Chamado em
  `updateStage`, no `update()` genérico quando muda `funnelStageId`, na criação de lead com etapa (`fromStageId` nulo) e em
  `markAsLost` (`toStageId` nulo: só cancela, não cria). `PATCH /leads/:id/stage` devolve o lead mais `cadence: { created, cancelled }`.
- **Cancelamento:** se a etapa mudou, tarefas do lead com `status = 'pendente'`, `autoGenerated = true` e `cadenceStageId`
  diferente da etapa nova viram `cancelada`, com `completionNotes` "Cancelada automaticamente: o lead mudou de etapa".
  Tarefas manuais e concluídas nunca são tocadas.
- **Criação e duplicidade:** um passo `active` vira uma tarefa com `assignedTo = lead.ownerId` (ou quem moveu, sem dono),
  `createdBy` = quem moveu, `autoGenerated`, `cadenceStageId` e `cadenceStepId`. Se já existe tarefa pendente do lead com o
  mesmo `cadenceStepId`, o passo é pulado. `cadenceStepId` não tem chave estrangeira: excluir o passo não mexe nas tarefas.
- **Data (`cadence-date.ts`):** dia de hoje em America/Sao_Paulo + `offsetDays`, no `dueTime`. Com `skipWeekends`, sábado e
  domingo vão para segunda. `offsetDays = 0` com horário já passado vira agora + 30 minutos. Título aceita `{{nome}}` e
  `{{primeiro_nome}}` (via `renderTemplate`). A prévia do formulário usa a mesma conta em `features/cadencias/constants.ts`.
- **Front:** os quatro caminhos de mudança de etapa passam por `useMoveLeadToStage`, e a venda por `StageMoveProvider`; os
  dois montam o toast com `cadenceToastDescription`. Chip `AutoTaskChip` (Zap) em lista, calendário (só ícone), detalhe da
  tarefa, aba de tarefas do lead e Meu dia. Kanban mostra um Info com os passos ativos (`['cadences']`, staleTime 5 min) num
  Popover que abre no toque e no hover.

---

## Status do Projeto

- [x] Decisões de arquitetura
- [x] Modelagem do banco de dados (schema.sql)
- [x] Design system definido
- [ ] Setup NestJS + Prisma
- [x] Setup Next.js — App Router, Tailwind v4, base-ui, RHF+Zod, react-imask (ver seção acima)
- [ ] Auth (login + JWT + roles) — tela de login existe, mockada (sem JWT real)
- [ ] Módulo de Organizations (onboarding)
- [ ] Módulo de Users + Teams — backend pendente; **UI completa e mockada** em `/equipe`: equipes, membros,
      hierarquia visual (Sheet), cadastro de membro/equipe
- [ ] Módulo de Leads (CRUD + filtros) — backend pendente; **UI completa e mockada**: kanban, lista, filtros,
      cadastro em 4 abas com preponentes, urgência e tags, página de detalhe (`leads/[id]`) com timeline,
      tarefas e imóveis vinculados
- [ ] Kanban com funnel_stages — backend pendente; **UI mockada** com colunas fixas (não usa `funnel_stages` customizadas ainda)
- [ ] Módulo de Interactions (follow-up)
- [ ] Módulo de Tasks (encadeadas) — backend pendente; **UI completa e mockada** em `/tarefas`: lista agrupada
      por data, calendário mensal, modal de conclusão reutilizável (`CompleteTaskModal`, também usado no
      detalhe do lead), encadeamento via `parentTaskId`
- [ ] Módulo de Properties — backend pendente; **UI completa e mockada**: empreendimentos (lista) + revenda
      (grade/lista), cadastro de ambos os tipos
- [ ] Módulo de Goals + goal_daily_entries — backend pendente; **UI mockada** em `/metas`
- [ ] Módulo de Sales — backend pendente; **UI mockada** em `/relatorios` (gráficos recharts) e no histórico
      de vendas; `Sale.status` ainda não tem tela própria de gestão de status
- [ ] Dashboard — backend pendente; **UI mockada** completa (alertas, funil, tarefas, ranking, vendas por empreendimento)
- [ ] Integração Gemini (score IA)
- [ ] Módulo de Reports — backend pendente; **UI completa e mockada** em `/relatorios`: cards de resumo,
      evolução de VGV, vendas por empreendimento/equipe, origem de leads, ranking de corretores, faixa de
      renda, histórico de vendas paginado
- [ ] Notificações (BullMQ + OneSignal)
- [ ] App Mobile (React Native + Expo)
