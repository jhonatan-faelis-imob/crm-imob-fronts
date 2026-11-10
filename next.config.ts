import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Nenhuma página HTML em cache: sem a rota "start-url" do next-pwa (que guardava o "/" para abrir offline).
  // O start_url do manifesto não muda.
  cacheStartUrl: false,
  dynamicStartUrl: false,
  runtimeCaching: [
    // Navegações (HTML) — SEMPRE rede. Primeira regra, vale antes de qualquer outra
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkOnly',
    },
    // Fontes — cache longo
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gstatic-fonts-cache',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    // Imagens — cache médio
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // JS e CSS do build — só da mesma origem, em /_next/static/ e com hash no nome (chunk.0a1b2c3d4e5f6789.js).
    // Arquivo sem hash (ex.: o JS do `next dev`) nunca entra no cache
    {
      urlPattern: ({ url, sameOrigin }) =>
        sameOrigin && url.pathname.startsWith('/_next/static/') && /[.-][0-9a-f]{8,}\.(?:js|css)$/i.test(url.pathname),
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-resources' },
    },
    // API — NUNCA cachear, sempre rede
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkOnly',
    },
    // Rotas protegidas e o link público /i/ — NUNCA cachear páginas HTML
    {
      urlPattern: /^\/(dashboard|meu-dia|leads|tarefas|metas|equipe|empreendimentos|relatorios|cadencias|documentos|integracoes|mensagens|simulador|perfil|i)(\/.*)?$/i,
      handler: 'NetworkOnly',
    },
    // Rota raiz e login — NetworkFirst com fallback
    {
      urlPattern: /^\/(login|cadastro|$)/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'auth-pages',
        expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})

const nextConfig: NextConfig = {
  /* config options here */
}

// @types/next-pwa está desatualizado e embute sua própria cópia (mais antiga) dos
// tipos do Next.js, incompatível com o NextConfig do Next 16 — isola o cast aqui.
export default (withPWAConfig as unknown as (config: NextConfig) => NextConfig)(nextConfig)
