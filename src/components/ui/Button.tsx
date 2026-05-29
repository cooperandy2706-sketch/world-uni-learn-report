// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glass'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-60',
          {
            // Variants
            'bg-violet-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:bg-violet-700 hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] border border-violet-500/20': variant === 'primary',
            'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700': variant === 'secondary',
            'bg-red-500 text-white shadow-[0_4px_14px_rgba(239,68,68,0.3)] hover:bg-red-600': variant === 'danger',
            'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300': variant === 'ghost',
            'border-2 border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300': variant === 'outline',
            'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20': variant === 'glass',
            
            // Sizes
            'h-8 px-3 text-xs rounded-lg gap-1.5': size === 'sm',
            'h-11 px-5 text-sm rounded-xl gap-2': size === 'md',
            'h-14 px-8 text-base rounded-2xl gap-3': size === 'lg',
            'h-10 w-10 rounded-xl p-0': size === 'icon', // For square icon buttons
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'