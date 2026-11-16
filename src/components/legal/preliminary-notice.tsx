// Faixa de versão preliminar. Sai quando o texto final for aprovado: apagar este arquivo
// e a linha <PreliminaryNotice /> em legal-document.tsx.
export function PreliminaryNotice({ updatedAt }: { updatedAt: string }) {
  return (
    <p
      role="note"
      className="rounded-[12px] border-[0.5px] border-[#F5C46B] bg-[#FFF7E0] px-4 py-3 text-[13px] font-medium leading-relaxed text-[#B45309]"
    >
      Versão preliminar, em revisão jurídica. Última atualização: {updatedAt}.
    </p>
  )
}
