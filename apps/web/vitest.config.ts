import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Unit tests cover non-trivial logic only (ALLET_PLAN.md §9): i18n key parity,
    // filter (de)serialisation, module registry consistency.
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
