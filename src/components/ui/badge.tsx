import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all duration-150 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary text-primary-foreground shadow-xs [a]:hover:bg-primary/90",
        secondary:
          "border-border/60 bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 [a]:hover:bg-rose-500/25",
        outline:
          "border-border/80 bg-background/50 text-foreground [a]:hover:bg-muted [a]:hover:text-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 [a]:hover:bg-emerald-500/25",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 [a]:hover:bg-amber-500/25",
        info:
          "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 [a]:hover:bg-sky-500/25",
        purple:
          "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 [a]:hover:bg-violet-500/25",
        cyan:
          "border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 [a]:hover:bg-cyan-500/25",
        ghost:
          "border-transparent bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      pill: {
        true: "rounded-full px-2.5",
        false: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      pill: false,
    },
  }
)

function Badge({
  className,
  variant = "default",
  pill = false,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, pill }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
