import { ScoreBadge } from './ui'

type KanbanCard = { name: string; score: number; detail: string; highlight?: boolean }
type KanbanColumn = { title: string; vgv: string; cards: KanbanCard[] }

const SIDEBAR = ['Dashboard', 'Leads', 'Tarefas', 'Metas', 'Imóveis', 'Vendas', 'Relatórios']

const COLUMNS: KanbanColumn[] = [
  {
    title: 'Novo lead',
    vgv: 'R$ 2,1 mi',
    cards: [
      { name: 'Mariana Souza', score: 91, detail: 'Lançamento · 2 dorm.' },
      { name: 'Rafael Lima', score: 54, detail: 'Revenda · Casa' },
    ],
  },
  {
    title: 'Atendimento',
    vgv: 'R$ 3,4 mi',
    cards: [
      { name: 'Juliana Prado', score: 87, detail: 'Follow-up hoje · 14h', highlight: true },
      { name: 'Carlos Mendes', score: 62, detail: 'Revenda · Apto' },
    ],
  },
  {
    title: 'Visita',
    vgv: 'R$ 1,8 mi',
    cards: [{ name: 'Ana Ribeiro', score: 78, detail: 'Decorado · sábado' }],
  },
  {
    title: 'Proposta',
    vgv: 'R$ 960 mil',
    cards: [{ name: 'Pedro Alves', score: 94, detail: 'Aguardando banco' }],
  },
]

export function KanbanMockup() {
  return (
    <figure className="overflow-hidden rounded-[20px] bg-white text-left shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)]">
      <figcaption className="sr-only">
        Exemplo da tela de funil de vendas do CRM Imob em Kanban, com o VGV de cada etapa e o score de IA de cada lead.
      </figcaption>
      <div className="flex items-center gap-3 bg-[#EAE7E3] px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-[#D6D1CB]" />
          <span className="h-3 w-3 rounded-full bg-[#D6D1CB]" />
          <span className="h-3 w-3 rounded-full bg-[#D6D1CB]" />
        </div>
        <div className="mx-auto w-full max-w-[360px] truncate rounded-[8px] bg-white px-3 py-1 text-center text-[12px] text-[#57534E]">
          app.crmimob.com.br/leads
        </div>
        <div className="w-[42px]" aria-hidden="true" />
      </div>
      <div className="flex">
        <ul className="hidden w-[180px] shrink-0 space-y-1 border-r border-[#E6E2DD] p-3 md:block">
          {SIDEBAR.map((item) => (
            <li
              key={item}
              className={`rounded-[10px] px-3 py-2 text-[13px] ${
                item === 'Leads' ? 'bg-[#FFF0F3] font-semibold text-[#C8104A]' : 'font-medium text-[#57534E]'
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <p className="text-[14px] font-bold text-[#1C1B1A]">
            Funil de vendas <span className="font-medium text-[#57534E]">· Equipe Lançamentos · Novembro</span>
          </p>
          {/* O Kanban rola na horizontal dentro do card em telas estreitas */}
          <div className="mt-4 overflow-x-auto pb-2" tabIndex={0} aria-label="Colunas do funil">
            <div className="flex gap-3">
              {COLUMNS.map((column) => (
                <div key={column.title} className="w-[210px] shrink-0 rounded-[14px] bg-[#EFECE8] p-2.5">
                  <div className="flex items-baseline justify-between gap-2 px-1 pb-2">
                    <span className="text-[13px] font-bold text-[#1C1B1A]">{column.title}</span>
                    <span className="text-[11px] font-semibold text-[#57534E]">VGV {column.vgv}</span>
                  </div>
                  <div className="space-y-2">
                    {column.cards.map((card) => (
                      <div
                        key={card.name}
                        className={`rounded-[10px] bg-white p-3 ${
                          card.highlight ? 'border-2 border-[#FF385C]' : 'border border-[#E6E2DD]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-semibold text-[#1C1B1A]">{card.name}</span>
                          <ScoreBadge score={card.score} />
                        </div>
                        <p className="mt-1 text-[12px] text-[#57534E]">{card.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </figure>
  )
}
