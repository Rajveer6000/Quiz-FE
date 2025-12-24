/**
 * Examinee Login Page
 * Student portal login requiring organization ID
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input, Loader } from '../components/common';
import { useAuth } from '../context';
import { resolveOrganization, listOrganizations } from '../api/organizationsApi';
import { STORAGE_KEYS } from '../constants/constants';

const ExamineeLogin = () => {
  const navigate = useNavigate();
  const { loginExaminee } = useAuth();

  const [organizations, setOrganizations] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [formData, setFormData] = useState({
    organizationId: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    initOrganizations();
  }, []);

  const initOrganizations = async () => {
    try {
      // First try to resolve organization from domain
      const origin = window.location.hostname;
      const response = await resolveOrganization(origin);

      if (response.success && response.data) {
        setOrganization(response.data);
        setFormData(prev => ({ ...prev, organizationId: response.data.id }));
        localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(response.data));
      } else {
        // If domain resolution fails, fetch all organizations for dropdown
        const orgsResponse = await listOrganizations();
        if (orgsResponse.success) {
          setOrganizations(orgsResponse.data.list || []);
        }
      }
    } catch (err) {
      // Try to get from localStorage or fetch list
      const stored = localStorage.getItem(STORAGE_KEYS.ORGANIZATION);
      if (stored) {
        const org = JSON.parse(stored);
        setOrganization(org);
        setFormData(prev => ({ ...prev, organizationId: org.id }));
      } else {
        // Fetch organizations list as fallback
        try {
          const orgsResponse = await listOrganizations();
          if (orgsResponse.success) {
            setOrganizations(orgsResponse.data.list || []);
          }
        } catch (e) {
          console.error('Failed to fetch organizations:', e);
        }
      }
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.organizationId) {
      setError('Organization ID is required');
      return;
    }

    setLoading(true);

    try {
      const response = await loginExaminee({
        organizationId: parseInt(formData.organizationId),
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        navigate('/examinee');
      } else {
        setError('Login credentials are wrong');
      }
    } catch (err) {
      setError('Login credentials are wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {organization?.logoUrl ? (
            <img
              src={organization.logoUrl}
              alt={organization.name}
              className="h-16 mx-auto mb-4"
            />
          ) : (
            <h1 className="text-4xl font-bold text-gradient mb-2">QuizApp</h1>
          )}
          <p className="text-gray-400">
            {organization?.name || 'Student Portal'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Student Login</h2>
              <p className="text-gray-400 text-sm mt-1">Access your tests and results</p>
            </div>

            {error && (
              <div className="p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg text-danger-400 text-sm">
                {error}
              </div>
            )}

            {!organization && !resolving && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Organization <span className="text-danger-400">*</span>
                </label>
                <select
                  className="input w-full"
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  required
                >
                  <option value="">Select your organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-glass-border text-center">
            <p className="text-gray-400 text-sm">
              New student?{' '}
              <Link to="/register/examinee" className="text-primary-400 hover:text-primary-300">
                Register here
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-6">
          Are you an admin?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ExamineeLogin;
