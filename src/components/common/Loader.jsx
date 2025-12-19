/**
 * Loader Component
 * Loading spinner with size variants
 */

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
};

const Loader = ({
  size = 'md',
  className = '',
  fullScreen = false,
}) => {
  const spinner = (
    <div className={`loader ${sizes[size]} ${className}`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loader;
