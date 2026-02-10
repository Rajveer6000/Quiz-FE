/**
 * Allocation Details Page
 * Displays detailed status of a specific bulk allocation
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader, Card, Table, Button } from '../components/common';
import { getAllocation, processAllocation } from '../api/allocationsApi';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    Mail,
    CreditCard,
    FileText,
    Download,
    Users,
    RefreshCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { STATUS, STATUS_LABELS } from '../constants/constants';

const AllocationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [allocation, setAllocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await getAllocation(id);
            if (response.success) {
                setAllocation(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch allocation details', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDetails();
    }, [id]);

    const handleReprocess = async () => {
        setProcessing(true);
        try {
            const response = await processAllocation(id);
            if (response.success) {
                showToast('Allocation processing started', 'success');
                fetchDetails();
            } else {
                showToast(response.message || 'Failed to reprocess', 'error');
            }
        } catch (error) {
            showToast('An error occurred', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const StatusBadge = ({ status, errorMessage }) => {
        if (status === STATUS.COMPLETED || status === 11) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    Success
                </span>
            );
        }
        if (status === STATUS.FAILED || status === 12) {
            return (
                <div className="flex flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                        <XCircle className="w-3 h-3" />
                        Failed
                    </span>
                </div>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                <Clock className="w-3 h-3" />
                {STATUS_LABELS[status] || 'Pending'}
            </span>
        );
    };

    const columns = [
        {
            key: 'email',
            label: 'Recipient',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">{row.email}</span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} errorMessage={row.errorMessage} />
        },
        {
            key: 'message',
            label: 'Details',
            render: (row) => {
                if (row.status === STATUS.COMPLETED || row.status === 11) {
                    return <span className="text-xs text-emerald-400">User added successfully</span>;
                }
                return <span className="text-xs text-slate-400">{row.errorMessage || '-'}</span>;
            }
        }
    ];

    if (loading && !allocation) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-20 bg-slate-800/50 rounded-xl" />
                <div className="h-64 bg-slate-800/50 rounded-xl" />
            </div>
        );
    }

    if (!allocation) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Allocation not found</p>
                <Button variant="ghost" className="mt-4" onClick={() => navigate('/allocations')}>
                    Go Back
                </Button>
            </div>
        );
    }

    const hasFailures = allocation.members?.some(m => m.status === STATUS.FAILED || m.status === STATUS.PENDING || m.status === 12 || m.status === 10);

    return (
        <div className="space-y-6">
            <PageHeader
                icon={<ArrowLeft className="w-5 h-5 cursor-pointer" onClick={() => navigate('/allocations')} />}
                title={`Allocation #${allocation.id}`}
                subtitle={allocation.entityName ? `Details for ${allocation.entityType}: ${allocation.entityName}` : `Details for ${allocation.entityType} allocation`}
                actions={
                    <div className="flex items-center gap-3">
                        {hasFailures && (
                            <Button
                                variant="primary"
                                onClick={handleReprocess}
                                isLoading={processing}
                                className="bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry Allocation
                            </Button>
                        )}
                        {allocation.razorpayOrderId && (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-white/5 text-xs text-slate-400">
                                <CreditCard className="w-3 h-3" />
                                Order: {allocation.razorpayOrderId}
                            </span>
                        )}
                        <Button variant="secondary" onClick={() => navigate('/allocations')}>
                            Back to List
                        </Button>
                    </div>
                }
            />

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Item Purchased</p>
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-violet-400" />
                        <span className="font-medium text-white capitalize">
                            {allocation.entityName || `${allocation.entityType} #${allocation.entityId}`}
                        </span>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Total Recipients</p>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        <span className="font-medium text-white">
                            {allocation.totalRequested} Users
                        </span>
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-1">Success Rate</p>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span className="font-medium text-white">
                            {allocation.totalSucceeded} / {allocation.totalRequested}
                            {allocation.totalRequested > 0 && (
                                <span className="text-xs text-slate-500 ml-2">
                                    ({Math.round((allocation.totalSucceeded / allocation.totalRequested) * 100)}%)
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Recipients Table */}
            <Card title="Recipients Status">
                <Table
                    columns={columns}
                    data={allocation.members || []}
                    loading={false}
                    emptyMessage="No recipients found"
                />
            </Card>

            {/* Payment Details */}
            {allocation.paymentDetails && (
                <Card title="Payment Information">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Amount Paid</p>
                            <p className="text-lg font-medium text-white">
                                {new Intl.NumberFormat('en-IN', {
                                    style: 'currency',
                                    currency: allocation.paymentDetails.currency || 'INR'
                                }).format((allocation.paymentDetails.amountPaid || 0) / 100)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Payment Status</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${allocation.paymentDetails.status === 'captured' || allocation.paymentDetails.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-slate-700 text-slate-300'
                                }`}>
                                {allocation.paymentDetails.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 mb-1">Receipt ID</p>
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-300 font-mono">
                                    {allocation.paymentDetails.receipt}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default AllocationDetails;
