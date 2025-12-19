/**
 * Examinee Registration Page
 * Self-registration for students
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input } from '../components/common';
import { registerExaminee } from '../api/examineesApi';
import { resolveOrganization, listOrganizations } from '../api/organizationsApi';
import { STORAGE_KEYS } from '../constants/constants';

const ExamineeRegister = () => {
  const navigate = useNavigate();
  
  const [organizations, setOrganizations] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [formData, setFormData] = useState({
    organizationId: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dob: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initOrganizations();
  }, []);

  const initOrganizations = async () => {
    try {
      const origin = window.location.hostname;
      const response = await resolveOrganization(origin);
      
      if (response.success && response.data) {
        setOrganization(response.data);
        setFormData(prev => ({ ...prev, organizationId: response.data.id }));
      } else {
        // Fetch all organizations for dropdown
        const orgsResponse = await listOrganizations();
        if (orgsResponse.success) {
          setOrganizations(orgsResponse.data.list || []);
        }
      }
    } catch (err) {
      const stored = localStorage.getItem(STORAGE_KEYS.ORGANIZATION);
      if (stored) {
        const org = JSON.parse(stored);
        setOrganization(org);
        setFormData(prev => ({ ...prev, organizationId: org.id }));
      } else {
        try {
          const orgsResponse = await listOrganizations();
          if (orgsResponse.success) {
            setOrganizations(orgsResponse.data.list || []);
          }
        } catch (e) {
          console.error('Failed to fetch organizations:', e);
        }
      }
    }
  };

  const validate = () => {
    if (!formData.organizationId) {
      setError('Organization ID is required');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await registerExaminee({
        organizationId: parseInt(formData.organizationId),
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        dob: formData.dob || undefined,
      });
      
      if (response.success) {
        navigate('/login/examinee', { 
          state: { message: 'Registration successful! Please login.' } 
        });
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">QuizApp</h1>
          <p className="text-gray-400">
            {organization?.name || 'Student Registration'}
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Create Account</h2>
              <p className="text-gray-400 text-sm mt-1">Register as a student</p>
            </div>

            {error && (
              <div className="p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg text-danger-400 text-sm">
                {error}
              </div>
            )}

            {!organization && (
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="student@example.com"
              required
            />

            <Input
              label="Phone (Optional)"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 43210"
            />

            <Input
              label="Date of Birth (Optional)"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              helperText="Minimum 8 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
            />

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full" 
              isLoading={loading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-glass-border text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link to="/login/examinee" className="text-primary-400 hover:text-primary-300">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExamineeRegister;
