import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins strings, arrays and conditional objects, skipping empty values', () => {
    expect(cn('ml:flex', undefined, null, ['ml:gap-2', { 'ml:p-2': true, 'ml:m-2': false }])).toBe(
      'ml:flex ml:gap-2 ml:p-2',
    )
  })

  it('lets a later prefixed class override a conflicting earlier one', () => {
    expect(cn('ml:p-2 ml:text-sm', 'ml:p-4')).toBe('ml:text-sm ml:p-4')
    expect(cn('ml:hover:bg-primary', 'ml:hover:bg-accent')).toBe('ml:hover:bg-accent')
    expect(cn('ml:px-2 ml:py-1', 'ml:p-3')).toBe('ml:p-3')
  })

  it("leaves classes without the prefix alone: they're the app's, not Tailwind classes of the package", () => {
    expect(cn('p-2', 'ml:p-4', 'p-6')).toBe('p-2 ml:p-4 p-6')
  })
})
