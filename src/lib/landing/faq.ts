export type FaqItem = {
  question: string
  answer: string
  link?: { label: string; href: string }
}

export const FAQ: FaqItem[] = [
  {
    question: 'O que é o CRM Imob?',
    answer:
      'Um CRM imobiliário para corretores e imobiliárias que trabalham com lançamento e revenda. Reúne funil de leads, follow-up, tarefas, metas, imóveis, vendas e relatórios, com IA para priorizar os atendimentos.',
  },
  {
    question: 'A IA substitui o corretor?',
    answer:
      'Não. A IA dá uma nota para cada lead e explica o motivo, para você saber com quem falar primeiro. O atendimento e a negociação continuam com o corretor.',
  },
  {
    question: 'Funciona para lançamento e para revenda?',
    answer:
      'Sim. Você cadastra empreendimentos e imóveis de revenda, cada um com seus próprios status, e acompanha as vendas dos dois no mesmo funil.',
  },
  {
    question: 'Como funcionam as metas?',
    answer:
      'Você define metas para a imobiliária, para cada equipe e para cada corretor. O sistema acompanha o funil diário — leads, visitas e propostas — e mostra quem está no ritmo para bater o mês.',
  },
  {
    question: 'Cada corretor vê só os próprios leads?',
    answer:
      'Sim. São cinco níveis de acesso: diretor, gerente, coordenador, corretor e administrativo. O corretor vê os próprios leads, o coordenador vê a equipe e a diretoria vê tudo.',
  },
  {
    question: 'Meus dados ficam separados de outras imobiliárias?',
    answer:
      'Sim. Cada imobiliária tem seu espaço isolado no banco de dados, e nenhuma conta enxerga os dados de outra.',
  },
  {
    question: 'Funciona no celular?',
    answer:
      'Sim. O CRM Imob roda no navegador e pode ser instalado na tela inicial do celular, com atalho rápido para criar leads e tarefas.',
  },
  {
    question: 'Quanto custa?',
    answer:
      'Os planos vão de R$ 89,90 a R$ 699 por mês. Nos planos Equipe e Imobiliária, cada usuário além dos inclusos custa R$ 30 por mês. Veja a tabela completa em',
    link: { label: 'Planos e preços', href: '#planos' },
  },
]

export function faqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.link ? `${item.answer} ${item.link.label}.` : item.answer,
      },
    })),
  }
}
