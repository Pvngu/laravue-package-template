import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Every class in the package carries the `ml:` prefix (see src/styles/lib.css), so tailwind-merge needs to know it.
// Marked pure so an app that uses no component with cn() can drop it, and tailwind-merge with it.
const twMerge = /* @__PURE__ */ extendTailwindMerge({ prefix: 'ml' })

// Joins classes (strings, arrays, { class: condition } objects) and lets later ones override conflicting earlier ones
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
