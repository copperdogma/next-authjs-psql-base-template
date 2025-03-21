'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

// Extracted component classes with @apply for complex patterns
const buttonStyles = {
  base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  variant: {
    default: 'bg-primary-600 text-white hover:bg-primary-700',
    outline: 'border border-accent text-foreground hover:bg-accent',
    ghost: 'text-foreground hover:bg-accent hover:text-foreground',
    link: 'text-primary-600 underline-offset-4 hover:underline',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  },
  size: {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-8 text-base',
    icon: 'h-9 w-9 p-0'
  }
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(
          buttonStyles.base,
          buttonStyles.variant[variant],
          buttonStyles.size[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button }; 