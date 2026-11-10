// Casos compartilhados do render de mensagens. O backend (render-template.spec.ts) deve rodar os mesmos:
// ao mudar uma regra, mudar aqui e lá. Horários em UTC (São Paulo = UTC-3, sem horário de verão)

export interface RenderFixture {
  name: string
  content: string
  values: Record<string, string | null>
  expected: { text: string; missing: string[] }
}

export const RENDER_FIXTURES: RenderFixture[] = [
  {
    name: 'nome composto: {{nome}} completo e {{primeiro_nome}} só a primeira palavra',
    content: 'Olá, {{primeiro_nome}}! Confirmo o cadastro de {{nome}}.',
    values: { nome: 'Maria da Silva Souza', primeiro_nome: 'Maria' },
    expected: { text: 'Olá, Maria! Confirmo o cadastro de Maria da Silva Souza.', missing: [] },
  },
  {
    name: 'nome de uma palavra só',
    content: '{{primeiro_nome}} / {{nome}}',
    values: { nome: 'Joaquim', primeiro_nome: 'Joaquim' },
    expected: { text: 'Joaquim / Joaquim', missing: [] },
  },
  {
    name: 'variável sem valor fica no texto e entra em missing',
    content: 'Sobre o {{empreendimento}}, {{primeiro_nome}}',
    values: { primeiro_nome: 'Ana', empreendimento: null },
    expected: { text: 'Sobre o {{empreendimento}}, Ana', missing: ['empreendimento'] },
  },
  {
    name: 'variável vazia conta como sem valor',
    content: 'Fale com {{corretor}} pelo {{telefone_corretor}}',
    values: { corretor: 'João', telefone_corretor: '' },
    expected: { text: 'Fale com João pelo {{telefone_corretor}}', missing: ['telefone_corretor'] },
  },
  {
    name: 'variável desconhecida permanece intacta (e entra em missing)',
    content: 'Oi {{apelido}} e {{ nome }}',
    values: { nome: 'Rita' },
    expected: { text: 'Oi {{apelido}} e Rita', missing: ['apelido'] },
  },
  {
    name: 'valor com $& e com {{...}} não é reinterpretado',
    content: '{{nome}} - {{imobiliaria}}',
    values: { nome: 'Ana $& {{corretor}}', imobiliaria: 'Imob' },
    expected: { text: 'Ana $& {{corretor}} - Imob', missing: [] },
  },
]

export const GREETING_FIXTURES: { utc: string; saoPaulo: string; expected: string }[] = [
  { utc: '2026-11-10T14:59:00Z', saoPaulo: '11:59', expected: 'Bom dia' },
  { utc: '2026-11-10T15:00:00Z', saoPaulo: '12:00', expected: 'Boa tarde' },
  { utc: '2026-11-10T20:59:00Z', saoPaulo: '17:59', expected: 'Boa tarde' },
  { utc: '2026-11-10T21:00:00Z', saoPaulo: '18:00', expected: 'Boa noite' },
  { utc: '2026-11-11T03:30:00Z', saoPaulo: '00:30', expected: 'Bom dia' },
]
