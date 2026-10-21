import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "ml:inline-flex ml:items-center ml:justify-center ml:gap-2 ml:whitespace-nowrap ml:rounded-md ml:text-sm ml:font-medium ml:transition-all ml:disabled:pointer-events-none ml:disabled:opacity-50 ml:[&_svg]:pointer-events-none ml:[&_svg:not([class*='size-'])]:size-4 ml:shrink-0 ml:[&_svg]:shrink-0 ml:outline-none ml:focus-visible:border-ring ml:focus-visible:ring-ring/50 ml:focus-visible:ring-[3px] ml:aria-invalid:ring-destructive/20 ml:dark:aria-invalid:ring-destructive/40 ml:aria-invalid:border-destructive ml:cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "ml:bg-primary ml:text-primary-foreground ml:hover:bg-primary/90",
        destructive:
          "ml:bg-destructive ml:text-white ml:hover:bg-destructive/90 ml:focus-visible:ring-destructive/20 ml:dark:focus-visible:ring-destructive/40 ml:dark:bg-destructive/60",
        outline:
          "ml:border ml:bg-background ml:shadow-xs ml:hover:bg-accent ml:hover:text-accent-foreground ml:dark:bg-input/30 ml:dark:border-input ml:dark:hover:bg-input/50",
        secondary:
          "ml:bg-secondary ml:text-secondary-foreground ml:hover:bg-secondary/80",
        ghost:
          "ml:hover:bg-accent ml:hover:text-accent-foreground ml:dark:hover:bg-accent/50",
        link: "ml:text-primary ml:underline-offset-4 ml:hover:underline",
      },
      size: {
        "default": "ml:h-9 ml:px-4 ml:py-2 ml:has-[>svg]:px-3",
        "sm": "ml:h-8 ml:rounded-md ml:gap-1.5 ml:px-3 ml:has-[>svg]:px-2.5",
        "lg": "ml:h-10 ml:rounded-md ml:px-6 ml:has-[>svg]:px-4",
        "icon": "ml:size-9",
        "icon-sm": "ml:size-8",
        "icon-lg": "ml:size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
