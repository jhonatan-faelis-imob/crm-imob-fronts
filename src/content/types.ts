/** Uma página legal: o texto vem em Markdown (ver src/lib/markdown.ts para o que é aceito) */
export interface LegalDocument {
  /** Usado no título da aba e quando o Markdown não abre com um # */
  title: string
  /** Descrição curta para buscadores */
  description: string
  /** Data exibida no topo e na faixa de versão preliminar */
  updatedAt: string
  markdown: string
}
