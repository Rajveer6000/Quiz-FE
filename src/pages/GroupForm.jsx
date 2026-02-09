/**
 * Group Form Page
 * Create a new group with emails (manual entry or Excel upload)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, PageHeader } from '../components/common';
import { createGroup, extractEmailsFromFile } from '../api/groupsApi';
import { UsersRound, Upload, X, Plus, FileSpreadsheet } from 'lucide-react';

const GroupForm = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [emails, setEmails] = useState([]);
    const [emailInput, setEmailInput] = useState('');
    const [errors, setErrors] = useState({});
    const [invalidEmails, setInvalidEmails] = useState([]); // Emails that can't be added (admin/user emails)

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    };

    const addEmails = (inputValue) => {
        // Split by comma, semicolon, newline, or space
        const newEmails = inputValue
            .split(/[,;\n\s]+/)
            .map(email => email.trim().toLowerCase())
            .filter(email => email && validateEmail(email));

        // Add only unique emails
        const uniqueEmails = [...new Set([...emails, ...newEmails])];
        setEmails(uniqueEmails);
        setEmailInput('');

        // Clear email error if we have emails now
        if (uniqueEmails.length > 0 && errors.emails) {
            setErrors(prev => ({ ...prev, emails: null }));
        }
    };

    const handleEmailInputKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (emailInput.trim()) {
                addEmails(emailInput);
            }
        }
    };

    const handleEmailInputBlur = () => {
        if (emailInput.trim()) {
            addEmails(emailInput);
        }
    };

    const removeEmail = (emailToRemove) => {
        setEmails(emails.filter(email => email !== emailToRemove));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];

        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            setErrors(prev => ({ ...prev, file: 'Please upload an Excel (.xlsx, .xls) or CSV file' }));
            return;
        }

        setUploading(true);
        setErrors(prev => ({ ...prev, file: null }));

        try {
            const response = await extractEmailsFromFile(file);
            if (response.success && response.data?.length > 0) {
                const uniqueEmails = [...new Set([...emails, ...response.data.map(e => e.toLowerCase())])];
                setEmails(uniqueEmails);
            } else {
                setErrors(prev => ({ ...prev, file: 'No valid emails found in the file' }));
            }
        } catch (error) {
            console.error('Failed to extract emails:', error);
            setErrors(prev => ({ ...prev, file: 'Failed to process file' }));
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Group name is required';
        }
        if (emails.length === 0) {
            newErrors.emails = 'At least one email is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setInvalidEmails([]); // Clear previous invalid emails

        try {
            const response = await createGroup({
                name: formData.name.trim(),
                description: formData.description.trim(),
                emails,
            });

            console.log('GroupForm - createGroup response:', response);

            if (response.success) {
                navigate('/groups');
            } else {
                console.log('GroupForm - Error response, invalidEmails:', response.invalidEmails);
                // Check if there are invalid emails to highlight
                if (response.invalidEmails && response.invalidEmails.length > 0) {
                    const invalidList = response.invalidEmails.map(e => e.toLowerCase());
                    console.log('GroupForm - Setting invalidEmails state:', invalidList);
                    setInvalidEmails(invalidList);
                    setErrors({
                        submit: 'Some emails belong to administrators and cannot be added. Please remove the highlighted emails.',
                    });
                } else {
                    setErrors({ submit: response.message || 'Failed to create group' });
                }
            }
        } catch (error) {
            console.error('Failed to create group:', error);
            setErrors({ submit: error.message || 'Failed to create group' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <PageHeader
                icon={<UsersRound className="w-5 h-5" />}
                title="Create Group"
                subtitle="Create a new group and add members"
            />

            <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
                {errors.submit && (
                    <div className="p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl text-danger-400">
                        {errors.submit}
                    </div>
                )}

                {/* Group Information */}
                <Card>
                    <Card.Header>
                        <Card.Title>Group Information</Card.Title>
                    </Card.Header>
                    <Card.Content className="space-y-4">
                        <Input
                            label="Group Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={errors.name}
                            placeholder="e.g., Batch Feb 2026 - A"
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                            <textarea
                                className="input min-h-20"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe this group..."
                            />
                        </div>
                    </Card.Content>
                </Card>

                {/* Email Members */}
                <Card>
                    <Card.Header>
                        <Card.Title>Members</Card.Title>
                        <p className="text-sm text-slate-400 mt-1">Add member emails manually or upload an Excel file</p>
                    </Card.Header>
                    <Card.Content className="space-y-4">
                        {/* Manual Email Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Add Emails
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    onKeyDown={handleEmailInputKeyDown}
                                    onBlur={handleEmailInputBlur}
                                    placeholder="Enter emails (comma or space separated)"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => emailInput.trim() && addEmails(emailInput)}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Press Enter or comma to add. Paste multiple emails at once.
                            </p>
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Or Upload Excel/CSV File
                            </label>
                            <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-primary-500/50 hover:bg-slate-800/30 transition-all">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                                        <span className="text-slate-400">Processing file...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-6 h-6 text-slate-400" />
                                        <span className="text-slate-400">Click to upload Excel or CSV file</span>
                                    </>
                                )}
                            </label>
                            {errors.file && (
                                <p className="text-sm text-danger-400 mt-1">{errors.file}</p>
                            )}
                        </div>

                        {/* Email Tags Display */}
                        {emails.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-300">
                                        Added Emails ({emails.length})
                                    </label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEmails([])}
                                        className="text-slate-400 hover:text-danger-400"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                                {/* Warning for invalid emails */}
                                {invalidEmails.length > 0 && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-2">
                                        <strong>⚠️ The following emails belong to administrators and cannot be added:</strong>
                                        <div className="mt-1">
                                            {invalidEmails.join(', ')}
                                        </div>
                                        <p className="mt-2 text-red-300">Please remove these emails to continue.</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-xl max-h-48 overflow-y-auto">
                                    {/* Sort emails so invalid ones appear at top */}
                                    {[...emails].sort((a, b) => {
                                        const aInvalid = invalidEmails.includes(a.toLowerCase());
                                        const bInvalid = invalidEmails.includes(b.toLowerCase());
                                        if (aInvalid && !bInvalid) return -1;
                                        if (!aInvalid && bInvalid) return 1;
                                        return 0;
                                    }).map((email) => {
                                        const isInvalid = invalidEmails.includes(email.toLowerCase());
                                        return (
                                            <span
                                                key={email}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${isInvalid
                                                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                                                    : 'bg-primary-500/20 text-primary-300'
                                                    }`}
                                                title={isInvalid ? 'This email belongs to an administrator and cannot be added. Please remove it.' : ''}
                                            >
                                                {email}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        removeEmail(email);
                                                        // Clear from invalid list too
                                                        setInvalidEmails(prev => prev.filter(e => e !== email.toLowerCase()));
                                                    }}
                                                    className={`transition-colors ${isInvalid ? 'hover:text-white' : 'hover:text-red-400'}`}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {errors.emails && (
                            <p className="text-sm text-danger-400">{errors.emails}</p>
                        )}
                    </Card.Content>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => navigate('/groups')}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={loading}>
                        Create Group
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default GroupForm;
