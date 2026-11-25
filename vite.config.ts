import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testes/configuracao.ts'],
    env: {
      // Origem fictícia para os testes do cliente HTTP (msw)
      VITE_API_URL: 'http://api.teste',
    },
  },
})
