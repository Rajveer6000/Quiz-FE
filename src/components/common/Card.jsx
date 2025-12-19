/**
 * Card Component
 * Glass-effect content container
 */

const Card = ({
  children,
  className = '',
  hover = false,
  padding = true,
  ...props
}) => {
  const baseClass = hover ? 'glass-card-hover' : 'glass-card';
  const paddingClass = padding ? 'p-6' : '';

  return (
    <div
      className={`${baseClass} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '' }) => (
  <div className={`border-b border-glass-border pb-4 mb-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold text-white ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-400 mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`border-t border-glass-border pt-4 mt-4 flex items-center justify-end gap-3 ${className}`}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
