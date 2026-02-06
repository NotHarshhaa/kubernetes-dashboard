"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative h-4 w-4 shrink-0 rounded-sm border border-slate-200/50 bg-white shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white dark:border-slate-700/50 dark:bg-slate-800 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500 dark:focus-visible:ring-blue-500/30 dark:focus-visible:border-blue-500",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="absolute inset-0 flex items-center justify-center text-white transition-all duration-200"
      >
        <CheckIcon className="h-2.5 w-2.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
