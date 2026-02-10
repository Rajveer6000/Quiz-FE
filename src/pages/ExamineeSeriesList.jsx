import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Loader, PageHeader } from '../components/common';
import { seriesApi } from '../api';
import { Layers, Search, ArrowRight, Calendar, Tag } from 'lucide-react';
import { STATUS, STATUS_LABELS } from '../constants/constants';

const formatPrice = (currency, amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  const symbol = currency === 'INR' ? '₹' : currency ? `${currency} ` : '';
  const value = typeof amount === 'number' ? amount.toFixed(0) : amount;
  return `${symbol}${value}`;
};

const ExamineeSeriesList = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 0, limit: 10, total: 0 });

  const loadSeries = async (page = pagination.page, term = search) => {
    setLoading(true);
    setError(null);
    try {
      const response = await seriesApi.getSeriesCatalog({
        page,
        limit: pagination.limit,
        search: term?.trim() ? term.trim() : undefined,
      });

      if (response.success) {
        setSeries(response.data?.list || []);
        setPagination(prev => ({
          ...prev,
          page,
          total: response.data?.totalRecords ?? 0,
        }));
      } else {
        setError(response.message || 'Unable to load series.');
        setSeries([]);
      }
    } catch (err) {
      console.error('Failed to fetch series catalog', err);
      setError('Unable to load series.');
      setSeries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSeries(pagination.page, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [pagination.page, search]);

  const handleSearchChange = (e) => {
    const next = e.target.value;
    setSearch(next);
    if (pagination.page !== 0) {
      setPagination(prev => ({ ...prev, page: 0 }));
    }
  };

  const totalPages = Math.max(1, Math.ceil((pagination.total || 0) / pagination.limit));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Layers className="w-5 h-5" />}
        title="Series Library"
        subtitle="Browse curated bundles of quizzes"
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            className="input w-full pl-10"
            placeholder="Search series by name or code..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="text-sm text-gray-400">
          Showing page {pagination.page + 1} of {totalPages}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size="lg" />
        </div>
      ) : error ? (
        <Card className="text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <Button variant="primary" onClick={() => loadSeries()}>
            Retry
          </Button>
        </Card>
      ) : series.length === 0 ? (
        <Card className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 flex items-center justify-center">
            <Layers className="w-7 h-7 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No series available</h3>
          <p className="text-gray-400">Please check back later or adjust your search.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {series.map((item) => {
            const statusLabel = STATUS_LABELS[item.status] || 'Draft';
            const statusVariant = item.status === STATUS.PUBLISHED ? 'success' : 'warning';

            return (
              <Card key={item.id} hover className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="accent" dot>{item.code}</Badge>
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-white leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {item.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <p className="text-xs text-gray-500">Offer</p>
                    <p className="text-2xl font-bold text-emerald-400 leading-tight">
                      {formatPrice(item.currency, item.offerPrice)}
                    </p>
                    <p className="text-xs text-gray-500 line-through">
                      {formatPrice(item.currency, item.listPrice)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-sm text-gray-400">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                    </span>
                    {item.validityDays && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {item.validityDays} days validity
                      </span>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/examinee/series/${item.id}`)}
                  >
                    Details
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && pagination.total > pagination.limit && (
        <div className="flex justify-center items-center gap-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={pagination.page === 0}
            onClick={() => setPagination(prev => ({ ...prev, page: Math.max(0, prev.page - 1) }))}
          >
            Previous
          </Button>
          <span className="text-gray-400 text-sm">
            Page {pagination.page + 1} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={(pagination.page + 1) >= totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExamineeSeriesList;
