import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// Radius/height/contrast follow docs/DASHBOARD_STYLE_PLAN.md section 2/3:
// 10px corners (pills are reserved for small status badges elsewhere), 44px
// default height, and navy-on-orange instead of white-on-orange for
// `primary` -- white text on the brand orange fails WCAG AA contrast.
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-orange text-navy hover:bg-orange/90 focus-visible:ring-navy',
        action: 'bg-action-blue text-white hover:bg-action-blue/90 focus-visible:ring-action-blue',
        secondary:
          'border-2 border-navy text-navy bg-transparent hover:bg-navy/5 focus-visible:ring-navy',
        ghost: 'text-navy hover:bg-navy/5 focus-visible:ring-navy',
        link: 'text-action-blue underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-14 px-8 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
