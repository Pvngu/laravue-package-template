import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import path from 'node:path'

// Safely recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@assets': path.resolve(__dirname, 'src/assets'),
    }
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CustomVueCalendar',
      fileName: (format) => `laravue-package-template.${format}.js`
    },
    rollupOptions: {
      // Externalize BOTH vue and ant-design-vue
      external: ['vue', 'ant-design-vue'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          'ant-design-vue': 'antd'
        }
      }
    }
  }
})
