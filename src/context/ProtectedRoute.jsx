/**
 * Protected Route Component
 * Wraps routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader } from '../components/common';

/**
 * ProtectedRoute - Requires authentication
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * StaffRoute - Requires staff role (org admin or super admin)
 */
export const StaffRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isStaff, isExaminee } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isExaminee() && !isStaff()) {
    return <Navigate to="/examinee" replace />;
  }

  return children;
};

/**
 * ExamineeRoute - Requires examinee role
 */
export const ExamineeRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isExaminee, isStaff } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login/examinee" state={{ from: location }} replace />;
  }

  if (isStaff() && !isExaminee()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * PermissionRoute - Requires specific permission
 */
export const PermissionRoute = ({ children, module, action = 'read' }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasPermission(module, action)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * PublicRoute - Redirects authenticated users
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isExaminee } = useAuth();

  if (isLoading) {
    return <Loader fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={isExaminee() ? '/examinee' : '/'} replace />;
  }

  return children;
};
