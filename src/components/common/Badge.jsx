/**
 * Badge Component
 * Status indicator with variants
 */

const variants = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  accent: 'badge-accent',
};

const Badge = ({
  children,
  variant = 'primary',
  className = '',
  dot = false,
  ...props
}) => {
  return (
    <span
      className={`${variants[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          variant === 'success' ? 'bg-success-400' :
          variant === 'warning' ? 'bg-warning-400' :
          variant === 'danger' ? 'bg-danger-400' :
          variant === 'accent' ? 'bg-accent-400' :
          'bg-primary-400'
        }`} />
      )}
      {children}
    </span>
  );
};

export default Badge;
