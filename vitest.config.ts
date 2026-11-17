import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

config({ path: '.env' })

export default defineConfig({
  resolve: {
    alias: {
      '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
  },
})
