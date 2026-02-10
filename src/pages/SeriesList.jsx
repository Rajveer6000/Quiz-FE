
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, PageHeader } from '../components/common';
import { seriesApi } from '../api';
import {
    BookOpen,
    Plus,
    Eye,
    MoreVertical,
    Layers,
    Calendar,
    DollarSign,
    Tag
} from 'lucide-react';
import { STATUS, STATUS_LABELS } from '../constants/constants';

const SeriesList = () => {
    const navigate = useNavigate();
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });

    const fetchSeries = async () => {
        setLoading(true);
        try {
            const params = {
                pageNo: pagination.page,
                pageSize: pagination.pageSize,
                // status: 'DRAFT' // Optional: if we want to filter by default
            };

            const response = await seriesApi.getSeriesList(params);
            if (response.success && response.data?.list) {
                setSeries(response.data.list);
                setPagination(prev => ({ ...prev, total: response.data.totalRecords }));
            }
        } catch (error) {
            console.error('Failed to fetch series:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeries();
    }, [pagination.page]);

    const SeriesCard = ({ seriesItem }) => {
        return (
            <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-slate-800/70 transition-all duration-300 overflow-hidden">
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${seriesItem.status === STATUS.PUBLISHED
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                        }`}>
                        {STATUS_LABELS[seriesItem.status] || 'Unknown'}
                    </span>
                </div>

                {/* Series Info */}
                <div className="pr-20 min-w-0">
                    <h3
                        className="text-lg font-semibold text-white truncate capitalize"
                        title={seriesItem.name}
                    >
                        {seriesItem.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className='text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded'>{seriesItem.code}</span>
                    </div>
                    {seriesItem.description ? (
                        <p
                            className="text-sm text-gray-400 mt-2 line-clamp-2 break-words"
                            title={seriesItem.description}
                        >
                            {seriesItem.description}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-500 mt-2 italic">No description</p>
                    )}
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-white/5">
                    <div className="text-center min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 mx-auto rounded-lg bg-emerald-500/10 mb-2">
                            <DollarSign className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-lg font-bold text-white truncate">
                            {seriesItem.currency} {seriesItem.offerPrice}
                        </p>
                        <p className="text-xs text-gray-500 line-through truncate">
                            {seriesItem.listPrice}
                        </p>
                    </div>
                    <div className="text-center min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 mx-auto rounded-lg bg-blue-500/10 mb-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-sm font-medium text-white mt-1 truncate">
                            {seriesItem.created_at ? new Date(seriesItem.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">Created</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-5 pt-5 border-t border-white/5">
                    <button
                        onClick={() => navigate(`/series/${seriesItem.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all text-sm font-medium"
                    >
                        <Eye className="w-4 h-4" />
                        View Details
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div>
            <PageHeader
                icon={<Layers className="w-5 h-5" />}
                title="Series Management"
                subtitle="Create and manage test series"
                actions={
                    <Button variant="primary" onClick={() => navigate('/series/new')}>
                        <Plus className="w-4 h-4" />
                        Create Series
                    </Button>
                }
            />

            <div className="space-y-6">
                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-slate-800/50 border border-white/10 rounded-2xl p-5 animate-pulse">
                                <div className="h-6 bg-slate-700 rounded w-3/4 mb-3" />
                                <div className="h-4 bg-slate-700 rounded w-1/2 mb-6" />
                                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-white/5">
                                    <div className="h-16 bg-slate-700 rounded-xl" />
                                    <div className="h-16 bg-slate-700 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Series Grid */}
                {!loading && series.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {series.map((item) => (
                            <SeriesCard key={item.id} seriesItem={item} />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && series.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                            <Layers className="w-10 h-10 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No series found</h3>
                        <p className="text-gray-400 mb-6">Create your first test series to get started</p>
                        <Button variant="primary" onClick={() => navigate('/series/new')}>
                            <Plus className="w-4 h-4" />
                            Create Series
                        </Button>
                    </div>
                )}

                {/* Pagination */}
                {pagination.total > pagination.pageSize && (
                    <div className="flex justify-center gap-4 pt-6">
                        <button
                            disabled={pagination.page === 0}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="flex items-center px-4 text-gray-400">
                            Page {pagination.page + 1} of {Math.ceil(pagination.total / pagination.pageSize)}
                        </span>
                        <button
                            disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeriesList;
