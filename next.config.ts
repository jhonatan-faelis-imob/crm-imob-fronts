import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const withPWAConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
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
    // JS e CSS estáticos
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-resources' },
    },
    // API — NUNCA cachear, sempre rede
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkOnly',
    },
    // Rotas protegidas — NUNCA cachear páginas HTML autenticadas
    {
      urlPattern: /^\/(dashboard|leads|tarefas|metas|equipe|empreendimentos|relatorios)(\/.*)?$/i,
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
