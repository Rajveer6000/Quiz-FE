/**
 * Role List Page
 * Role management for staff
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Modal, Loader } from '../components/common';
import { Header } from '../components/layout';
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

  return (
    <div>
      <Header
        title="Roles"
        actions={
          <Button variant="primary" onClick={() => navigate('/roles/new')}>
            + Create Role
          </Button>
        }
      />

      <div className="space-y-6 mt-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : roles.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg">No roles found</p>
              <Button variant="primary" className="mt-4" onClick={() => navigate('/roles/new')}>
                + Create Role
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {roles.map((role) => (
              <Card key={role.id} hover>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{role.name}</h3>
                      {isSystemRole(role.id) && (
                        <Badge variant="accent">System</Badge>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-gray-400 mt-1">{role.description}</p>
                    )}
                  </div>

                  {!isSystemRole(role.id) && (
                    <div className="flex gap-2">
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
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
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
