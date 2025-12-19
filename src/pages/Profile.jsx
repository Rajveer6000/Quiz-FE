/**
 * Profile Page
 * View and edit current user profile
 */

import { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/common';
import { Header } from '../components/layout';
import { useAuth } from '../context';
import { resetPassword } from '../api/usersApi';
import { ROLE_NAMES } from '../constants/constants';

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(user.id, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        setSuccess('Password changed successfully');
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setChangingPassword(false);
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <Header title="Profile" />

      <div className="space-y-6 mt-6 max-w-2xl">
        {error && (
          <div className="p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl text-danger-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-success-500/10 border border-success-500/30 rounded-xl text-success-400">
            {success}
          </div>
        )}

        {/* Profile Overview */}
        <Card>
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-400">{user.email}</p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {user.roles?.map(role => (
                  <Badge key={role.id} variant="primary">
                    {ROLE_NAMES[role.id] || role.name}
                  </Badge>
                ))}
                {user.organization && (
                  <Badge variant="accent">{user.organization.name}</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Details */}
        <Card>
          <Card.Header>
            <Card.Title>Profile Details</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">First Name</label>
                  <p className="text-white">{user.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                  <p className="text-white">{user.lastName}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <p className="text-white">{user.email}</p>
              </div>

              {user.phone && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <p className="text-white">{user.phone}</p>
                </div>
              )}

              {user.dob && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date of Birth</label>
                  <p className="text-white">{new Date(user.dob).toLocaleDateString()}</p>
                </div>
              )}

              {user.organization && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Organization</label>
                  <p className="text-white">{user.organization.name}</p>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Change Password */}
        <Card>
          <Card.Header>
            <Card.Title>Security</Card.Title>
          </Card.Header>
          <Card.Content>
            {changingPassword ? (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  helperText="Minimum 8 characters"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" isLoading={loading}>
                    Change Password
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setChangingPassword(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="outline" onClick={() => setChangingPassword(true)}>
                Change Password
              </Button>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
