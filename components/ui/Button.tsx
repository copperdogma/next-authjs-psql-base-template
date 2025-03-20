'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-blue-800 text-white hover:bg-blue-900 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700': variant === 'default',
            'border border-gray-700 text-gray-900 dark:border-gray-300 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800': variant === 'outline',
            'text-gray-900 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800': variant === 'ghost',
            'h-10 px-4 py-2': size === 'default',
            'h-8 px-3 text-xs': size === 'sm',
            'h-12 px-8 text-base': size === 'lg',
          },
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