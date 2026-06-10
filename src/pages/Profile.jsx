/**
 * Profile Page
 * View and edit current user profile
 */

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Badge, PageHeader } from '../components/common';
import { useAuth } from '../context';
import { resetPassword } from '../api/usersApi';
import { updateProfile } from '../api/profileApi';
import { ROLE_NAMES } from '../constants/constants';

const Profile = () => {
  const { user, refreshProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    youtubeUrl: '',
    websiteUrl: '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        bio: user.bio || '',
        youtubeUrl: user.youtubeUrl || '',
        websiteUrl: user.websiteUrl || '',
      });
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await updateProfile(formData);
      if (response.success) {
        setSuccess('Profile updated successfully');
        setEditing(false);
        await refreshProfile();
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err?.result?.responseDescription || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setError('');
    try {
      const response = await updateProfile({}, file);
      if (response.success) {
        setSuccess('Avatar uploaded successfully');
        await refreshProfile();
      } else {
        setError(response.message || 'Failed to upload avatar');
      }
    } catch (err) {
      setError(err?.result?.responseDescription || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
      <PageHeader
        icon="P"
        title="Profile"
        subtitle="View and manage your account"
      />

      <div className="space-y-6 max-w-2xl">
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

        <Card>
          <div className="flex items-start gap-6">
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl font-bold text-white">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                isLoading={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Change Avatar
              </Button>
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

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <Card.Title>Profile Details</Card.Title>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </Card.Header>
          <Card.Content>
            {editing ? (
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
                <Input
                  label="YouTube URL"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                />
                <Input
                  label="Website URL"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                />
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" isLoading={loading}>
                    Save
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
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
                {user.bio && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bio</label>
                    <p className="text-white">{user.bio}</p>
                  </div>
                )}
                {user.youtubeUrl && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">YouTube</label>
                    <a href={user.youtubeUrl} className="text-primary-400 hover:underline" target="_blank" rel="noreferrer">
                      {user.youtubeUrl}
                    </a>
                  </div>
                )}
                {user.websiteUrl && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Website</label>
                    <a href={user.websiteUrl} className="text-primary-400 hover:underline" target="_blank" rel="noreferrer">
                      {user.websiteUrl}
                    </a>
                  </div>
                )}
              </div>
            )}
          </Card.Content>
        </Card>

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
