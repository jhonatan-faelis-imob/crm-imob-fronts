import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/cadastro']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Página pública do imóvel (/i/:token): aberta, e quem está logado também vê (pré-visualizar)
  if (pathname.startsWith('/i/')) return NextResponse.next()
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // Landing page: só a raiz exata e fora do fluxo do PWA (start_url = /?source=pwa)
  const isLanding = pathname === '/' && request.nextUrl.searchParams.get('source') !== 'pwa'

  // Verificar token no cookie ou header
  const token = request.cookies.get('accessToken')?.value

  if (isLanding) {
    return token ? NextResponse.redirect(new URL('/dashboard', request.url)) : NextResponse.next()
  }

  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|offline.html|sw.js|workbox-.*\\.js|icons/|screenshots/).*)',
  ],
}
