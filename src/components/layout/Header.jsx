/**
 * Header Component
 * Top header bar with search and actions
 */

const Header = ({ title, actions }) => {
  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-950/95 via-slate-900/90 to-slate-950/95 backdrop-blur-2xl border-b border-white/10">
      <div className="max-w-7xl mx-auto h-full px-6 lg:px-8 flex items-center justify-between gap-6 relative">
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500/30 via-accent-500/30 to-primary-500/40 flex items-center justify-center text-white font-bold">
            {title?.[0]?.toUpperCase() || 'Q'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{title}</h1>
            <p className="text-xs text-slate-400">Manage and monitor your data at a glance</p>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="w-72 pl-10 pr-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Notifications */}
          <button className="p-2.5 rounded-2xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
          </button>

          {/* Custom actions */}
          {actions}
        </div>
      </div>
    </header>
  );
};

export default Header;
