/**
 * Staff Login Page
 * Admin portal login for organization staff
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Input } from '../components/common';
import { useAuth } from '../context';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(formData);
      
      if (response.success) {
        navigate('/');
      } else {
        setError(response.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">QuizApp</h1>
          <p className="text-gray-400">Admin Portal</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Welcome Back</h2>
              <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
            </div>

            {error && (
              <div className="p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg text-danger-400 text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@example.com"
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
              Are you a student?{' '}
              <Link to="/login/examinee" className="text-primary-400 hover:text-primary-300">
                Login here
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-gray-500 text-sm mt-6">
          Don't have an organization?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
