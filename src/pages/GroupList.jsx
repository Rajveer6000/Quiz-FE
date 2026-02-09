/**
 * Group List Page
 * Group management for staff - list all groups with pagination
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Table, PageHeader } from '../components/common';
import { listGroups, deleteGroup, getGroup } from '../api/groupsApi';
import { UsersRound, Plus, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const GroupList = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        pageNo: 0,
        pageSize: 10,
        totalPages: 0,
        totalRecords: 0,
    });
    const [deleteModal, setDeleteModal] = useState({ open: false, group: null });
    const [viewModal, setViewModal] = useState({ open: false, group: null, loading: false });

    const fetchGroups = async (pageNo = 0, pageSize = 10) => {
        setLoading(true);
        try {
            const response = await listGroups(pageNo, pageSize);
            if (response.success) {
                setGroups(response.data || []);
                setPagination(response.pagination || {
                    pageNo: 0,
                    pageSize: 10,
                    totalPages: 0,
                    totalRecords: 0,
                });
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handlePageChange = (newPage) => {
        fetchGroups(newPage, pagination.pageSize);
    };

    const handleDelete = async () => {
        if (!deleteModal.group) return;
        try {
            await deleteGroup(deleteModal.group.id);
            setDeleteModal({ open: false, group: null });
            fetchGroups(pagination.pageNo, pagination.pageSize);
        } catch (error) {
            console.error('Failed to delete group:', error);
        }
    };

    const handleView = async (group) => {
        setViewModal({ open: true, group: null, loading: true });
        try {
            const response = await getGroup(group.id);
            if (response.success) {
                setViewModal({ open: true, group: response.data, loading: false });
            } else {
                setViewModal({ open: false, group: null, loading: false });
            }
        } catch (error) {
            console.error('Failed to fetch group details:', error);
            setViewModal({ open: false, group: null, loading: false });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const columns = [
        {
            key: 'name',
            title: 'Group',
            render: (group) => (
                <div>
                    <p className="text-white font-semibold">{group.name}</p>
                    {group.description && (
                        <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            title: 'Status',
            render: (group) => (
                <Badge variant={group.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {group.status}
                </Badge>
            ),
        },
        {
            key: 'created_at',
            title: 'Created',
            render: (group) => (
                <span className="text-slate-400">{formatDate(group.created_at)}</span>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'right',
            render: (group) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(group)}
                    >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger-400 hover:text-danger-300"
                        onClick={() => setDeleteModal({ open: true, group })}
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                icon={<UsersRound className="w-5 h-5" />}
                title="Groups"
                subtitle="Manage examinee groups"
                actions={
                    <Button variant="primary" onClick={() => navigate('/groups/new')}>
                        <Plus className="w-4 h-4" />
                        Create Group
                    </Button>
                }
            />

            <div className="space-y-6">
                <Table
                    columns={columns}
                    data={groups}
                    rowKey="id"
                    isLoading={loading}
                    emptyState={
                        <Card className="text-center py-12 w-full">
                            <div className="text-gray-500">
                                <UsersRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No groups found</p>
                                <p className="text-sm mt-1">Create your first group to manage examinees</p>
                                <Button variant="primary" className="mt-4" onClick={() => navigate('/groups/new')}>
                                    <Plus className="w-4 h-4" />
                                    Create Group
                                </Button>
                            </div>
                        </Card>
                    }
                />

                {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePageChange(pagination.pageNo - 1)}
                            disabled={pagination.pageNo === 0}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-slate-400">
                            Page {pagination.pageNo + 1} of {pagination.totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePageChange(pagination.pageNo + 1)}
                            disabled={pagination.pageNo >= pagination.totalPages - 1}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, group: null })}
                title="Delete Group"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteModal({ open: false, group: null })}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p>Are you sure you want to delete the group "{deleteModal.group?.name}"?</p>
                <p className="text-sm text-slate-400 mt-2">This action cannot be undone.</p>
            </Modal>

            {/* View Group Modal */}
            <Modal
                isOpen={viewModal.open}
                onClose={() => setViewModal({ open: false, group: null, loading: false })}
                title={viewModal.group?.name || 'Group Details'}
                size="lg"
            >
                {viewModal.loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                ) : viewModal.group ? (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-slate-400">Description</p>
                            <p className="text-white">{viewModal.group.description || 'No description'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Status</p>
                            <Badge variant={viewModal.group.status === 'ACTIVE' ? 'success' : 'secondary'}>
                                {viewModal.group.status}
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 mb-2">Members ({viewModal.group.members?.length || 0})</p>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {viewModal.group.members?.length > 0 ? (
                                    viewModal.group.members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                            <div>
                                                <p className="text-white text-sm">
                                                    {member.user ? `${member.user.firstName} ${member.user.lastName}` : member.memberEmail}
                                                </p>
                                                <p className="text-xs text-slate-400">{member.memberEmail}</p>
                                            </div>
                                            <Badge variant={member.wasExistingUser ? 'primary' : 'secondary'} size="sm">
                                                {member.wasExistingUser ? 'Registered' : 'Invited'}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm">No members</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default GroupList;
