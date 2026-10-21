import { describe, expect, it } from 'vitest'
import { publicDeclarations } from '../../scripts/publicDeclarations'

const dist = '/pkg/dist'
const emitted = (files: Record<string, string>) =>
  new Map(Object.entries(files).map(([path, content]) => [`${dist}/${path}`, content]))
const check = (files: Record<string, string>) => publicDeclarations(emitted(files), `${dist}/index.d.ts`, ['vue'])

describe('publicDeclarations', () => {
  it('follows the entry through components, folders and type imports', () => {
    const { reached, problems } = check({
      'index.d.ts': "export { default as Chat } from './components/Chat.vue'\nexport * from './types'",
      'components/Chat.vue.d.ts': "import type { DefineComponent } from 'vue'\ntype P = import('../types/item').Item",
      'types/index.d.ts': "export * from './item'",
      'types/item.d.ts': 'export interface Item { id: string }',
      'components/ui/Button.vue.d.ts': "import type { PrimitiveProps } from 'reka-ui'",
    })

    expect(problems).toEqual([])
    expect([...reached].map((path) => path.slice(dist.length + 1)).sort()).toEqual([
      'components/Chat.vue.d.ts',
      'index.d.ts',
      'types/index.d.ts',
      'types/item.d.ts',
    ])
  })

  it("flags packages apps don't install, in any import form", () => {
    const { problems } = check({
      'index.d.ts': [
        '/// <reference types="node" />', // only honoured at the top of a file
        "import type { Ref } from 'vue'",
        "import type { RenderFunction } from 'vue/dist/vue.d.mts'",
        "export type { PrimitiveProps } from 'reka-ui'",
        "export type Variants = import('class-variance-authority').VariantProps<never>",
      ].join('\n'),
    })

    expect(problems).toEqual([
      `${dist}/index.d.ts: imports "reka-ui", which apps don't install with this package`,
      `${dist}/index.d.ts: imports "class-variance-authority", which apps don't install with this package`,
      `${dist}/index.d.ts: imports "node", which apps don't install with this package`,
    ])
  })

  it('flags relative imports that were not emitted', () => {
    const { problems } = check({ 'index.d.ts': "export * from './missing'" })
    expect(problems).toEqual([`${dist}/index.d.ts: "./missing" wasn't emitted`])
  })

  it('adds the .js extension of the file each relative import reaches', () => {
    const { problems, rewritten } = check({
      'index.d.ts': [
        "export { default as Card } from './components/Card.vue'",
        "export * from './plugin'",
        'export * from "./ui"',
        "export * from './done.js'",
      ].join('\n'),
      'components/Card.vue.d.ts': "type Options = import('../plugin').Options",
      'plugin.d.ts': 'export interface Options { id: string }',
      'ui/index.d.ts': 'export {}',
      'done.d.ts': 'export {}',
    })

    expect(problems).toEqual([])
    expect(Object.fromEntries([...rewritten].map(([path, content]) => [path.slice(dist.length + 1), content]))).toEqual(
      {
        'index.d.ts': [
          "export { default as Card } from './components/Card.vue.js'",
          "export * from './plugin.js'",
          'export * from "./ui/index.js"',
          "export * from './done.js'",
        ].join('\n'),
        'components/Card.vue.d.ts': "type Options = import('../plugin.js').Options",
      },
    )
  })

  it('ignores import-like text in comments', () => {
    const { problems } = check({
      'index.d.ts': "/**\n * @example\n * import { Button } from 'reka-ui'\n */\nexport declare const x: number",
    })
    expect(problems).toEqual([])
  })
})
