/**
 * User Form Page
 * Create or edit a user
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Loader, PageHeader } from '../components/common';
import { createUser, getUser, updateUser } from '../api/usersApi';
import { listRoles } from '../api/rolesApi';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRoles();
    if (isEditing) {
      fetchUser();
    }
  }, [id]);

  const fetchRoles = async () => {
    try {
      const response = await listRoles();
      if (response.success) {
        setRoles(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await getUser(id);
      if (response.success) {
        const user = response.data;
        setFormData({
          email: user.email || '',
          password: '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          roleId: user.roles?.[0]?.id || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!isEditing && !formData.password) newErrors.password = 'Password is required';
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.roleId) newErrors.roleId = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      };

      if (!isEditing) {
        payload.email = formData.email;
        payload.password = formData.password;
        payload.roleId = parseInt(formData.roleId);
        await createUser(payload);
      } else {
        await updateUser(id, payload);
      }
      
      navigate('/users');
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to save user' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div>
      <PageHeader
        icon="U"
        title={isEditing ? 'Edit User' : 'Create User'}
        subtitle={isEditing ? 'Update user details' : 'Add a new user'}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {errors.submit && (
          <div className="p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl text-danger-400">
            {errors.submit}
          </div>
        )}

        <Card>
          <Card.Header>
            <Card.Title>User Information</Card.Title>
          </Card.Header>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                error={errors.firstName}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                error={errors.lastName}
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              disabled={isEditing}
              required={!isEditing}
            />

            {!isEditing && (
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                helperText="Minimum 8 characters"
                required
              />
            )}

            <Input
              label="Phone (Optional)"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Role <span className="text-danger-400">*</span>
              </label>
              <select
                className={`input ${errors.roleId ? 'input-error' : ''}`}
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                disabled={isEditing}
              >
                <option value="">Select a role</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
              {errors.roleId && <p className="text-xs text-danger-400 mt-1">{errors.roleId}</p>}
            </div>
          </Card.Content>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/users')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={saving}>
            {isEditing ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
