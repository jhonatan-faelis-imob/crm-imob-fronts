import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supportWhatsappUrl } from './constants'

/** Abre o WhatsApp do suporte (NEXT_PUBLIC_SUPPORT_PHONE). Sem número configurado, não aparece */
export function SupportButton({ className, text }: { className?: string; text?: string }) {
  const url = supportWhatsappUrl(text)
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-success px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90',
        className,
      )}
    >
      <MessageCircle className="h-4 w-4" />
      Falar com o suporte
    </a>
  )
}
