/**
 * Role List Page
 * Role management for staff
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Table, PageHeader } from '../components/common';
import { listRoles, deleteRole } from '../api/rolesApi';

const RoleList = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, role: null });

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await listRoles();
      if (response.success) {
        setRoles(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async () => {
    if (!deleteModal.role) return;
    try {
      await deleteRole(deleteModal.role.id);
      setDeleteModal({ open: false, role: null });
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const isSystemRole = (roleId) => [1, 2, 3].includes(roleId);

  const columns = [
    {
      key: 'name',
      title: 'Role',
      render: (role) => (
        <div className="flex items-center gap-3">
          <div>
            <p className="text-white font-semibold">{role.name}</p>
            {role.description && (
              <p className="text-xs text-slate-400">{role.description}</p>
            )}
          </div>
          {isSystemRole(role.id) && (
            <Badge variant="accent">System</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      title: 'Type',
      render: (role) => (
        <Badge variant={isSystemRole(role.id) ? 'accent' : 'primary'}>
          {isSystemRole(role.id) ? 'Built-in' : 'Custom'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      align: 'right',
      render: (role) => (
        isSystemRole(role.id) ? (
          <span className="text-gray-500 text-sm">Managed</span>
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/roles/${role.id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger-400 hover:text-danger-300"
              onClick={() => setDeleteModal({ open: true, role })}
            >
              Delete
            </Button>
          </div>
        )
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        icon="R"
        title="Roles"
        subtitle="Manage user roles and permissions"
        actions={
          <Button variant="primary" onClick={() => navigate('/roles/new')}>
            + Create Role
          </Button>
        }
      />

      <div className="space-y-6">
        <Table
          columns={columns}
          data={roles}
          rowKey="id"
          isLoading={loading}
          emptyState={
            <Card className="text-center py-12 w-full">
              <div className="text-gray-500">
                <p className="text-lg">No roles found</p>
                <Button variant="primary" className="mt-4" onClick={() => navigate('/roles/new')}>
                  + Create Role
                </Button>
              </div>
            </Card>
          }
        />
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, role: null })}
        title="Delete Role"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, role: null })}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete the role "{deleteModal.role?.name}"?</p>
      </Modal>
    </div>
  );
};

export default RoleList;
