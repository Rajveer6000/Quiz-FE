/**
 * Role Form Page
 * Create or edit a role with permissions
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Loader } from '../components/common';
import { Header } from '../components/layout';
import { createRole, getRole, updateRole } from '../api/rolesApi';
import { MODULES } from '../constants/constants';

const moduleList = [
  { id: 1, slug: MODULES.USERS, name: 'User Management' },
  { id: 2, slug: MODULES.ROLES, name: 'Role Management' },
  { id: 3, slug: MODULES.ORGANIZATIONS, name: 'Organization Management' },
  { id: 4, slug: MODULES.QUIZZES, name: 'Quiz/Test Management' },
  { id: 5, slug: MODULES.ANALYTICS, name: 'Analytics Dashboard' },
  { id: 7, slug: MODULES.EXAMINEE, name: 'Examinee Features' },
];

const RoleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    modules: moduleList.reduce((acc, mod) => ({
      ...acc,
      [mod.id]: { moduleId: mod.id, canCreate: false, canRead: false, canUpdate: false, canDelete: false }
    }), {}),
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchRole();
    }
  }, [id]);

  const fetchRole = async () => {
    try {
      const response = await getRole(id);
      if (response.success) {
        const role = response.data;
        const modules = { ...formData.modules };
        
        role.modules?.forEach(mod => {
          if (modules[mod.moduleId]) {
            modules[mod.moduleId] = {
              moduleId: mod.moduleId,
              canCreate: mod.canCreate || false,
              canRead: mod.canRead || false,
              canUpdate: mod.canUpdate || false,
              canDelete: mod.canDelete || false,
            };
          }
        });

        setFormData({
          name: role.name || '',
          description: role.description || '',
          modules,
        });
      }
    } catch (error) {
      console.error('Failed to fetch role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (moduleId, permission, value) => {
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleId]: {
          ...prev.modules[moduleId],
          [permission]: value,
        },
      },
    }));
  };

  const handleSelectAll = (moduleId, checked) => {
    setFormData(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleId]: {
          moduleId,
          canCreate: checked,
          canRead: checked,
          canUpdate: checked,
          canDelete: checked,
        },
      },
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Role name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const modules = Object.values(formData.modules)
        .filter(m => m.canCreate || m.canRead || m.canUpdate || m.canDelete);

      const payload = {
        name: formData.name,
        description: formData.description,
        modules,
      };

      if (isEditing) {
        await updateRole(id, payload);
      } else {
        await createRole(payload);
      }
      
      navigate('/roles');
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save role' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div>
      <Header title={isEditing ? 'Edit Role' : 'Create Role'} />

      <form onSubmit={handleSubmit} className="space-y-6 mt-6 max-w-4xl">
        {errors.submit && (
          <div className="p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl text-danger-400">
            {errors.submit}
          </div>
        )}

        <Card>
          <Card.Header>
            <Card.Title>Role Information</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <Input
              label="Role Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              placeholder="e.g., Content Manager"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                className="input min-h-20"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this role's responsibilities..."
              />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Permissions</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="text-left py-3 pr-4 text-gray-400 font-medium">Module</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">All</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Create</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Read</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Update</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleList.map(mod => {
                    const perms = formData.modules[mod.id];
                    const allChecked = perms?.canCreate && perms?.canRead && perms?.canUpdate && perms?.canDelete;
                    
                    return (
                      <tr key={mod.id} className="border-b border-glass-border/50">
                        <td className="py-3 pr-4 text-white font-medium">{mod.name}</td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={allChecked}
                            onChange={(e) => handleSelectAll(mod.id, e.target.checked)}
                            className="w-4 h-4 rounded accent-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perms?.canCreate || false}
                            onChange={(e) => handlePermissionChange(mod.id, 'canCreate', e.target.checked)}
                            className="w-4 h-4 rounded accent-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perms?.canRead || false}
                            onChange={(e) => handlePermissionChange(mod.id, 'canRead', e.target.checked)}
                            className="w-4 h-4 rounded accent-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perms?.canUpdate || false}
                            onChange={(e) => handlePermissionChange(mod.id, 'canUpdate', e.target.checked)}
                            className="w-4 h-4 rounded accent-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perms?.canDelete || false}
                            onChange={(e) => handlePermissionChange(mod.id, 'canDelete', e.target.checked)}
                            className="w-4 h-4 rounded accent-primary-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card.Content>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/roles')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEditing ? 'Update Role' : 'Create Role'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleForm;
