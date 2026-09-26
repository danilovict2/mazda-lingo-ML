export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE || 'http://localhost:8000',
    },
  },

  typescript: {
    strict: true,
  },

  experimental: {
    payloadExtraction: false,
  },
})
