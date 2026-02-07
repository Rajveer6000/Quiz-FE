/**
 * Allocate Modal Component
 * Handles bulk allocation of tests to examinees via email, file upload, or existing group
 */

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Card } from '../common';
import { initiateAllocation, extractEmailsFromFile } from '../../api/allocationsApi';
import { listGroups } from '../../api/groupsApi';
import { createOrder, verifyPayment, getPaymentConfig } from '../../api/paymentsApi';
import { Users, Upload, FileSpreadsheet, Plus, X, Search, CreditCard, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AllocateModal = ({ isOpen, onClose, entityType = 'TEST', entity, onSuccess }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Select Method, 2: Configure, 3: Payment
    const [method, setMethod] = useState('manual'); // 'manual', 'file', 'group'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Data states
    const [emails, setEmails] = useState([]);
    const [invalidEmails, setInvalidEmails] = useState([]); // Track invalid emails for highlighting
    const [emailInput, setEmailInput] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [groups, setGroups] = useState([]);
    const [createGroup, setCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');

    // File upload state
    const [uploading, setUploading] = useState(false);
    const [fileError, setFileError] = useState(null);

    // Payment state
    const [allocationResult, setAllocationResult] = useState(null);

    useEffect(() => {
        if (isOpen && method === 'group') {
            fetchGroups();
        }
    }, [isOpen, method]);

    const fetchGroups = async () => {
        try {
            const response = await listGroups(0, 100); // Fetch first 100 groups for now
            if (response.success) {
                setGroups(response.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch groups', err);
        }
    };

    const resetState = () => {
        setStep(1);
        setMethod('manual');
        setEmails([]);
        setEmailInput('');
        setSelectedGroupId(null);
        setCreateGroup(false);
        setGroupName('');
        setGroupDesc('');
        setError(null);
        setInvalidEmails([]);
        setAllocationResult(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    // --- Email Handling (similar to GroupForm) ---
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    const addEmails = (inputValue) => {
        const newEmails = inputValue
            .split(/[,;\n\s]+/)
            .map(email => email.trim().toLowerCase())
            .filter(email => email && validateEmail(email));

        const uniqueEmails = [...new Set([...emails, ...newEmails])];
        setEmails(uniqueEmails);
        setEmailInput('');
        setError(null); // Clear global error on input change
        // We generally clear invalid emails or keep them until removed. 
        // For simplicity, we can keep them or clear them. 
        // Ideally if user is correcting, they might remove them.
    };

    const handleEmailKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (emailInput.trim()) addEmails(emailInput);
        }
    };

    const removeEmail = (emailToRemove) => {
        const nextEmails = emails.filter(e => e !== emailToRemove);
        const nextInvalidEmails = invalidEmails.filter(e => e !== emailToRemove);

        setEmails(nextEmails);
        setInvalidEmails(nextInvalidEmails);

        if (nextInvalidEmails.length === 0 && error && error.startsWith('Cannot add administrators')) {
            setError(null);
        }
    };

    // --- File Handling ---
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            setFileError('Please upload an Excel (.xlsx, .xls) or CSV file');
            return;
        }

        setUploading(true);
        setFileError(null);

        try {
            const response = await extractEmailsFromFile(file);
            if (response.success && response.data?.length > 0) {
                const uniqueEmails = [...new Set([...emails, ...response.data.map(e => e.toLowerCase())])];
                setEmails(uniqueEmails);
            } else {
                setFileError('No valid emails found in the file');
            }
        } catch (error) {
            console.error('Failed to extract emails:', error);
            setFileError('Failed to process file');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // --- Submission & Payment ---
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);

        const payload = {
            entityType,
            entityId: entity?.id,
        };

        if (method === 'group') {
            if (!selectedGroupId) {
                setError('Please select a group');
                setLoading(false);
                return;
            }
            payload.groupId = selectedGroupId;
        } else {
            if (emails.length === 0) {
                setError('Please add at least one email');
                setLoading(false);
                return;
            }
            payload.emails = emails;
            if (createGroup) {
                if (!groupName.trim()) {
                    setError('Group name is required');
                    setLoading(false);
                    return;
                }
                payload.createGroup = true;
                payload.groupName = groupName;
                payload.groupDescription = groupDesc;
            }
        }

        try {
            // 1. Initiate Allocation
            const response = await initiateAllocation(payload);
            console.log('Allocation Response:', response);

            if (response.success) {
                setAllocationResult(response.data);

                // If amount is 0 or payment not required (handled by backend logic mostly, but checking here)
                if (response.data.amount === 0) {
                    // Success immediately
                    if (onSuccess) onSuccess();
                    navigate(`/allocations/${response.data.allocationId}`);
                    return;
                }

                // 2. Start Payment
                const res = await loadRazorpay();
                if (!res) {
                    setError('Razorpay SDK failed to load');
                    setLoading(false);
                    return;
                }

                const options = {
                    key: response.data.razorpayKeyId,
                    amount: response.data.amount,
                    currency: response.data.currency,
                    name: 'Quiz Platform',
                    description: `Allocation for ${response.data.entityName}`,
                    order_id: response.data.razorpayOrderId,
                    handler: async function (paymentResponse) {
                        try {
                            await verifyPayment(
                                paymentResponse.razorpay_order_id,
                                paymentResponse.razorpay_payment_id,
                                paymentResponse.razorpay_signature
                            );

                            if (onSuccess) onSuccess();
                            navigate(`/allocations/${response.data.allocationId}`);
                        } catch (paymentErr) {
                            console.error(paymentErr);
                            setError('Payment verification failed');
                        }
                    },
                    prefill: {
                        name: 'Admin User', // Could take from user context
                        email: 'admin@example.com',
                        contact: '9999999999'
                    },
                    theme: {
                        color: '#6366f1' // Primary color
                    },
                    modal: {
                        ondismiss: function () {
                            setLoading(false);
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();

            } else {
                setError(response.message || 'Failed to initiate allocation');
                // Handle invalid emails
                if (response.invalidEmails && response.invalidEmails.length > 0) {
                    setInvalidEmails(response.invalidEmails);
                    setError(`Cannot add administrators: ${response.invalidEmails.join(', ')}`);
                } else {
                    setInvalidEmails([]);
                }
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'An error occurred');
            setLoading(false);
        }
    };

    // Content for different methods
    const renderMethodcontent = () => {
        if (method === 'group') {
            return (
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">Select Group</label>
                    {groups.length === 0 ? (
                        <div className="text-center p-4 bg-slate-800 rounded-lg text-gray-400">
                            No groups found. Please create a group first or use manual entry.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                            {groups.map(group => (
                                <div
                                    key={group.id}
                                    onClick={() => setSelectedGroupId(group.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedGroupId === group.id
                                        ? 'bg-primary-500/20 border-primary-500/50 text-white'
                                        : 'bg-slate-800/50 border-white/5 hover:border-white/20 text-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{group.name}</span>
                                        {selectedGroupId === group.id && <CheckCircle className="w-4 h-4 text-primary-400" />}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1 flex justify-between">
                                        <span>{group.memberCount || 0} members</span>
                                        <span>{group.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Manual or File (both populate emails array)
        return (
            <div className="space-y-6">
                {/* Email Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Add Emails Manually</label>
                    <div className="flex gap-2">
                        <Input
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={handleEmailKeyDown}
                            placeholder="Enter emails (comma separated)"
                            className="flex-1"
                        />
                        <Button variant="secondary" onClick={() => emailInput.trim() && addEmails(emailInput)}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* File Upload - Only show if manual selected but we can combine functionalities */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Or Upload Excel/CSV</label>
                    <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-primary-500/50 hover:bg-slate-800/30 transition-all">
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                        {uploading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                        ) : (
                            <>
                                <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                                <span className="text-sm text-slate-400">Click to upload</span>
                            </>
                        )}
                    </label>
                    {fileError && <p className="text-xs text-red-400 mt-1">{fileError}</p>}
                </div>

                {/* Email Tags */}
                {emails.length > 0 && (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-300">Recipients ({emails.length})</label>
                            <button onClick={() => {
                                setEmails([]);
                                setInvalidEmails([]);
                                if (error && error.startsWith('Cannot add administrators')) setError(null);
                            }} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                        </div>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-xl max-h-32 overflow-y-auto">
                            {/* Sort emails: Invalid ones first */}
                            {[...emails].sort((a, b) => {
                                const isA = invalidEmails.includes(a);
                                const isB = invalidEmails.includes(b);
                                return (isA === isB) ? 0 : isA ? -1 : 1;
                            }).map(email => {
                                const isInvalid = invalidEmails.includes(email);
                                return (
                                    <span
                                        key={email}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${isInvalid
                                            ? 'bg-red-500/20 text-red-200 border-red-500/30 ring-1 ring-red-500/50'
                                            : 'bg-primary-500/20 text-primary-300 border-transparent'
                                            }`}
                                    >
                                        {email}
                                        <button onClick={() => removeEmail(email)} className={`hover:text-white ${isInvalid ? 'text-red-300' : 'text-primary-400'}`}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Create Group Option */}
                {emails.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer mb-4">
                            <input
                                type="checkbox"
                                checked={createGroup}
                                onChange={(e) => setCreateGroup(e.target.checked)}
                                className="rounded border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500/50"
                            />
                            <span className="text-sm text-gray-300">Save these emails as a new group</span>
                        </label>

                        {createGroup && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <Input
                                    label="Group Name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="e.g. Batch A Students"
                                    required
                                />
                                <Input
                                    label="Description (Optional)"
                                    value={groupDesc}
                                    onChange={(e) => setGroupDesc(e.target.value)}
                                    placeholder="Group description"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Allocate ${entityType === 'TEST' ? 'Test' : 'Series'}`}
            size="lg"
            footer={null} // Custom footer
        >
            <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                    <h4 className="text-white font-medium">{entity?.name}</h4>
                    <p className="text-sm text-slate-400 mt-1">{entity?.description}</p>
                </div>

                {/* Method Tabs */}
                <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
                    <button
                        onClick={() => setMethod('manual')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'manual' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Enter Emails
                    </button>
                    <button
                        onClick={() => setMethod('group')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'group' ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Select Group
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-[300px]">
                    {renderMethodcontent()}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <Button variant="ghost" onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={loading}
                        disabled={method === 'group' ? !selectedGroupId : emails.length === 0}
                    >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Proceed to Pay
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AllocateModal;
