/**
 * User List Page
 * User management for staff
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Table, PageHeader } from '../components/common';
import { listUsers, deleteUser } from '../api/usersApi';
import { ROLE_NAMES, USER_STATUS } from '../constants/constants';

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 0, pageSize: 10, total: 0 });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });

  // Debounce search term - 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPagination(prev => ({ ...prev, page: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        pageNo: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (debouncedSearchTerm.trim()) {
        params.searchTerm = debouncedSearchTerm.trim();
      }
      const response = await listUsers(params);
      if (response.success) {
        setUsers(response.data.list || []);
        setPagination(prev => ({ ...prev, total: response.data.totalRecords }));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;
    try {
      await deleteUser(deleteModal.user.id);
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const getInitials = (user) => {
    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.trim();
    return initials || (user.email?.[0]?.toUpperCase() || '?');
  };

  const columns = [
    {
      key: 'name',
      title: 'User',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/90 to-accent-500/80 flex items-center justify-center text-white font-semibold">
            {getInitials(user)}
          </div>
          <div>
            <p className="text-white font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      render: (user) => (
        <span className="text-gray-200">{user.email}</span>
      ),
    },
    {
      key: 'roles',
      title: 'Roles',
      render: (user) => (
        <div className="flex flex-wrap gap-2">
          {user.roles?.length ? (
            user.roles.map(role => (
              <Badge key={role.id} variant="primary">
                {ROLE_NAMES[role.id] || role.name}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (user) => (
        <Badge variant={user.status === USER_STATUS.ACTIVE ? 'success' : 'danger'} dot>
          {user.status === USER_STATUS.ACTIVE ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (user) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/users/${user.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-400 hover:text-danger-300"
            onClick={() => setDeleteModal({ open: true, user })}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon="U"
        title="Users"
        subtitle="Manage and monitor your staff at a glance"
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        actions={
          <Button variant="primary" onClick={() => navigate('/users/new')}>
            + Add User
          </Button>
        }
      />

      <div className="space-y-6">
        <Table
          columns={columns}
          data={users}
          rowKey="id"
          isLoading={loading}
          emptyState={
            <Card className="text-center py-12 w-full">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-lg">{searchTerm ? 'No users match your search' : 'No users found'}</p>
                {!searchTerm && (
                  <Button variant="primary" className="mt-4" onClick={() => navigate('/users/new')}>
                    + Add User
                  </Button>
                )}
              </div>
            </Card>
          }
        />

        {/* Pagination */}
        {pagination.total > pagination.pageSize && (
          <div className="flex justify-center gap-2">
            <Button
              variant="ghost"
              disabled={pagination.page === 0}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-gray-400">
              Page {pagination.page + 1} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <Button
              variant="ghost"
              disabled={(pagination.page + 1) * pagination.pageSize >= pagination.total}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        title="Delete User"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, user: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete "{deleteModal.user?.firstName} {deleteModal.user?.lastName}"?</p>
      </Modal>
    </div>
  );
};

export default UserList;
