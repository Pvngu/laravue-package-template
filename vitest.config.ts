import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Format dates in UTC so results don't depend on the machine's time zone
process.env.TZ = 'UTC'

// Separate from vite.config.ts: tests need neither the Tailwind build nor the library/declaration plugins
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      // Generated shadcn-vue primitives are tested through the components that use them
      exclude: ['src/components/ui/**', 'src/**/*.d.ts'],
      reporter: ['text-summary', 'html'],
      // A floor, not a target: raise it as coverage grows so it can't quietly drop
      thresholds: { lines: 80, statements: 80, functions: 70, branches: 70 },
    },
  },
})
