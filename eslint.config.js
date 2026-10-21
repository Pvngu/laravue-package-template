import { defineConfig, globalIgnores } from 'eslint/config'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier/flat'

export default defineConfig(
  globalIgnores(['dist', 'coverage', 'public']),

  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
    rules: {
      // vue-tsc already checks names; ESLint can't see types or auto-imported globals in templates
      'no-undef': 'off',
    },
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      // Typed props on <script setup> make default values optional
      'vue/require-default-prop': 'off',
      // Prettier (semi: false) puts each statement of `@click="a = 1; b = 2"` on its own line without the `;`,
      // which vue-tsc accepts but Vue's template compiler can't parse
      'vue/no-restricted-syntax': [
        'error',
        {
          selector: 'VOnExpression[body.length>1]',
          message: 'Move multi-statement event handlers into a function in <script>.',
        },
      ],
    },
  },

  // shadcn-vue primitives and the playground root use single-word names (Button, Dialog, App)
  {
    files: ['src/components/ui/**', 'playground/**'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },

  // Tests define small harness components inline
  {
    files: ['tests/**'],
    rules: { 'vue/one-component-per-file': 'off' },
  },

  // Node scripts and config files
  {
    files: ['scripts/**', '*.config.{js,ts}'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly', URL: 'readonly' } },
  },

  // Formatting is Prettier's job; turn off the rules that would fight it
  prettier,
)
