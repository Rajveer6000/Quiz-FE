/**
 * Button Component
 * Versatile button with multiple variants using Tailwind CSS
 */

import { forwardRef } from 'react';

const baseStyles = 'inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-3xl font-semibold text-sm transition-all duration-200 cursor-pointer whitespace-nowrap shadow-md disabled:opacity-50 disabled:cursor-not-allowed';

const variantStyles = {
  primary: 'bg-blue-500/90 text-white hover:bg-blue-500/80 hover:shadow-lg hover:shadow-blue-500/30 active:bg-blue-500',
  accent: 'bg-violet-500/90 text-white hover:bg-violet-500/80 hover:shadow-lg hover:shadow-violet-500/30 active:bg-violet-500',
  success: 'bg-emerald-500/90 text-white hover:bg-emerald-500/80 hover:shadow-lg hover:shadow-emerald-500/30 active:bg-emerald-500',
  danger: 'bg-red-500/90 text-white hover:bg-red-500/80 hover:shadow-lg hover:shadow-red-500/30 active:bg-red-500',
  ghost: 'bg-white/5 text-gray-400 shadow-none hover:bg-white/10 hover:text-white active:bg-white/15',
  outline: 'bg-transparent border-2 border-blue-500/50 text-blue-400 shadow-none hover:bg-blue-500/10 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-2xl',
  md: 'px-5 py-2.5 text-sm rounded-3xl',
  lg: 'px-6 py-3 text-base rounded-3xl',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
