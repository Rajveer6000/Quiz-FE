/**
 * Allocation List Page
 * Displays history of bulk allocations
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, Table, Button } from '../components/common';
import { listAllocations } from '../api/allocationsApi';
import {
    Users,
    Calendar,
    Search,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    FileText
} from 'lucide-react';
import { STATUS, STATUS_LABELS } from '../constants/constants';

const AllocationList = () => {
    const navigate = useNavigate();
    const [allocations, setAllocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ pageNo: 0, pageSize: 10, totalRecords: 0 });

    const fetchAllocations = async () => {
        setLoading(true);
        try {
            const response = await listAllocations(pagination.pageNo, pagination.pageSize);
            if (response.success) {
                setAllocations(response.data || []);
                if (response.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        totalRecords: response.pagination.totalRecords,
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch allocations', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllocations();
    }, [pagination.pageNo, pagination.pageSize]);

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, pageNo: newPage }));
    };

    const StatusBadge = ({ succeeded, total }) => {
        if (succeeded === total && total > 0) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                </span>
            );
        }
        if (succeeded === 0) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                    <Clock className="w-3 h-3" />
                    Pending
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                <RefreshCw className="w-3 h-3" />
                Partial ({Math.round((succeeded / total) * 100)}%)
            </span>
        );
    };

    const columns = [
        {
            key: 'id',
            label: 'ID',
            render: (row) => <span className="text-slate-400">#{row.id}</span>
        },
        {
            key: 'entityType',
            label: 'Type',
            render: (row) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${row.entityType === 'TEST'
                    ? 'bg-violet-500/10 text-violet-400'
                    : 'bg-pink-500/10 text-pink-400'
                    }`}>
                    {row.entityType}
                </span>
            )
        },
        {
            key: 'allocationType',
            label: 'Method',
            render: (row) => (
                <span className="capitalize text-slate-300">
                    {row.allocationType?.replace('_', ' ').toLowerCase() || 'Manual'}
                </span>
            )
        },
        {
            key: 'stats',
            label: 'Progress',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-xs">
                        <span className="text-slate-300">Total: {row.totalRequested}</span>
                        <span className="text-emerald-400">Success: {row.totalSucceeded}</span>
                        {row.totalFailed > 0 && (
                            <span className="text-red-400">Failed: {row.totalFailed}</span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge succeeded={row.totalSucceeded} total={row.totalRequested} />
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/allocations/${row.id}`)}
                >
                    View Details
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                icon={<Users className="w-5 h-5" />}
                title="Allocations"
                subtitle="Manage bulk test allocations"
                actions={
                    <Button variant="secondary" onClick={fetchAllocations}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                }
            />

            <Card>
                <Table
                    columns={columns}
                    data={allocations}
                    loading={loading}
                    emptyMessage="No allocations found"
                />

                {/* Custom Pagination (if common table doesn't support manual control fully or matches TestList style) */}
                {allocations.length > 0 && pagination.totalRecords > pagination.pageSize && (
                    <div className="flex justify-center gap-4 py-4 border-t border-white/5">
                        <Button
                            variant="ghost"
                            disabled={pagination.pageNo === 0}
                            onClick={() => handlePageChange(pagination.pageNo - 1)}
                        >
                            Previous
                        </Button>
                        <span className="flex items-center text-sm text-slate-400">
                            Page {pagination.pageNo + 1} of {Math.ceil(pagination.totalRecords / pagination.pageSize)}
                        </span>
                        <Button
                            variant="ghost"
                            disabled={(pagination.pageNo + 1) * pagination.pageSize >= pagination.totalRecords}
                            onClick={() => handlePageChange(pagination.pageNo + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AllocationList;
