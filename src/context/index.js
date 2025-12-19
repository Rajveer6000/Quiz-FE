/**
 * Context Index
 * Re-exports all context providers and hooks
 */

export { AuthProvider, useAuth } from './AuthContext';
export { 
  ProtectedRoute, 
  StaffRoute, 
  ExamineeRoute, 
  PermissionRoute,
  PublicRoute 
} from './ProtectedRoute';
