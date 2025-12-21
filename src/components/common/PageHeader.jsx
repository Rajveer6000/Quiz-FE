/**
 * Page Header Component
 * Reusable header with icon, title, subtitle, search, and actions
 */

const PageHeader = ({ 
  icon, 
  title, 
  subtitle, 
  searchValue, 
  onSearchChange, 
  searchPlaceholder = "Search...",
  actions 
}) => {
  return (
    <div className="flex items-center justify-between gap-6 mb-4 px-2">
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-3">
        {/* {icon && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
            {icon}
          </div>
        )} */}
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-3">
        {onSearchChange && (
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={onSearchChange}
              className="w-56 pl-9 pr-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
            />
          </div>
        )}
        {actions}
      </div>
    </div>
  );
};

export default PageHeader;
