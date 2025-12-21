/**
 * Table Component
 * Reusable dark-mode data table using Tailwind utilities
 */

import Loader from './Loader';

const alignClassMap = {
  center: 'text-center',
  right: 'text-right',
};

const Table = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyState,
  rowKey = 'id',
  onRowClick,
  className = '',
}) => {
  const getCellAlignment = (align) => alignClassMap[align] || 'text-left';

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-1">
      {emptyState || (
        <>
          <div className="w-12 h-12 rounded-full border border-white/10 bg-gradient-to-br from-primary-500/20 to-accent-500/15 shadow-lg shadow-primary-500/30" />
          <p className="text-white font-semibold">No records found</p>
          <p className="text-sm text-slate-400">Try adjusting your filters or add a new record.</p>
        </>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg overflow-hidden ${className}`}>
        <div className="flex justify-center py-12">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg overflow-hidden ${className}`}>
        {renderEmpty()}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${getCellAlignment(column.align)} px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 ${column.headerClassName || ''}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, index) => (
              <tr
                key={row[rowKey] ?? index}
                className={`${onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : ''} transition-colors`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${getCellAlignment(column.align)} px-6 py-4 text-slate-200 ${column.className || ''}`}
                  >
                    {column.render ? column.render(row, index) : (row[column.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
