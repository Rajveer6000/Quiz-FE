/**
 * Badge Component
 * Status indicator with vibrant Tailwind-only styling
 */

const variantClasses = {
  primary: 'bg-blue-500/15 text-blue-100 ring-blue-400/30',
  success: 'bg-emerald-500/15 text-emerald-100 ring-emerald-400/30',
  warning: 'bg-amber-500/15 text-amber-100 ring-amber-400/30',
  danger: 'bg-rose-500/15 text-rose-100 ring-rose-400/30',
  accent: 'bg-purple-500/15 text-purple-100 ring-purple-400/30',
};

const Badge = ({
  children,
  variant = 'primary',
  className = '',
  dot = false,
  ...props
}) => {
  const colors = {
    primary: 'bg-blue-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-300',
    danger: 'bg-rose-400',
    accent: 'bg-purple-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${colors[variant]}`} />}
      {children}
    </span>
  );
};

export default Badge;
