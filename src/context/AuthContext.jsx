/**
 * Authentication Context
 * Provides auth state and methods throughout the app
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  login as apiLogin, 
  loginExaminee as apiLoginExaminee,
  getProfile,
  decodeToken,
  isTokenExpired,
  getStoredToken,
  logout as apiLogout
} from '../api/authApi';
import { STORAGE_KEYS, ROLES } from '../constants/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from stored token
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = getStoredToken();
    
    if (token && !isTokenExpired(token)) {
      try {
        const decoded = decodeToken(token);
        console.log('Decoded token:', decoded); // Debug
        
        if (decoded) {
          setPermissions(decoded.perms || {});
          
          // Build user from token data first (as fallback)
          const tokenUser = {
            id: decoded.sub,
            email: decoded.email,
            organizationId: decoded.organizationId,
            roles: decoded.roles || [],
          };
          
          // Try to fetch full profile
          try {
            const response = await getProfile();
            console.log('Profile response:', response); // Debug
            if (response.success && response.data) {
              setUser(response.data);
            } else {
              // Use token data as user if profile fails
              setUser(tokenUser);
            }
          } catch (profileError) {
            console.log('Profile fetch failed, using token data:', profileError);
            setUser(tokenUser);
          }
          
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        clearAuth();
      }
    }
    
    setIsLoading(false);
  };

  const clearAuth = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    setUser(null);
    setPermissions({});
    setIsAuthenticated(false);
  };

  const login = async (credentials) => {
    try {
      const response = await apiLogin(credentials);
      console.log('Login response in context:', response); // Debug
      
      if (response.success) {
        const token = getStoredToken();
        if (token) {
          const decoded = decodeToken(token);
          console.log('Decoded after login:', decoded); // Debug
          setPermissions(decoded?.perms || {});
          
          // Build user from token
          const tokenUser = {
            id: decoded?.sub,
            email: decoded?.email,
            organizationId: decoded?.organizationId,
            roles: decoded?.roles || [],
          };
          
          // Try to fetch profile
          try {
            const profileResponse = await getProfile();
            if (profileResponse.success && profileResponse.data) {
              setUser(profileResponse.data);
            } else {
              setUser(tokenUser);
            }
          } catch (e) {
            setUser(tokenUser);
          }
          
          setIsAuthenticated(true);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const loginExaminee = async (credentials) => {
    try {
      const response = await apiLoginExaminee(credentials);
      
      if (response.success) {
        const token = getStoredToken();
        if (token) {
          const decoded = decodeToken(token);
          setPermissions(decoded?.perms || {});
          
          const tokenUser = {
            id: decoded?.sub,
            email: decoded?.email,
            organizationId: decoded?.organizationId,
            roles: decoded?.roles || [],
            isExaminee: true,
          };
          
          try {
            const profileResponse = await getProfile();
            if (profileResponse.success && profileResponse.data) {
              setUser(profileResponse.data);
            } else {
              setUser(tokenUser);
            }
          } catch (e) {
            setUser(tokenUser);
          }
          
          setIsAuthenticated(true);
        }
      }
      
      return response;
    } catch (error) {
      console.error('Examinee login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const logout = () => {
    clearAuth();
    apiLogout();
  };

  // Role checks - compare as strings to handle both string/number IDs from JWT
  const isExaminee = useCallback(() => {
    const examineeId = String(ROLES.EXAMINEE);
    return user?.roles?.some(r => String(r.id) === examineeId || r.name === 'Examinee') || user?.isExaminee;
  }, [user]);

  const isOrgAdmin = useCallback(() => {
    const orgAdminId = String(ROLES.ORG_ADMIN);
    return user?.roles?.some(r => String(r.id) === orgAdminId || r.name === 'Organization Admin');
  }, [user]);

  const isSuperAdmin = useCallback(() => {
    const superAdminId = String(ROLES.SUPER_ADMIN);
    return user?.roles?.some(r => String(r.id) === superAdminId || r.name === 'Super Admin');
  }, [user]);

  const isStaff = useCallback(() => {
    return isOrgAdmin() || isSuperAdmin();
  }, [isOrgAdmin, isSuperAdmin]);

  // Permission checks
  const hasPermission = useCallback((module, action) => {
    if (isSuperAdmin()) return true;
    return permissions[module]?.[action] === true;
  }, [permissions, isSuperAdmin]);

  const canRead = useCallback((module) => hasPermission(module, 'read'), [hasPermission]);
  const canCreate = useCallback((module) => hasPermission(module, 'create'), [hasPermission]);
  const canUpdate = useCallback((module) => hasPermission(module, 'update'), [hasPermission]);
  const canDelete = useCallback((module) => hasPermission(module, 'delete'), [hasPermission]);

  const value = {
    user,
    permissions,
    isLoading,
    isAuthenticated,
    login,
    loginExaminee,
    logout,
    isExaminee,
    isOrgAdmin,
    isSuperAdmin,
    isStaff,
    hasPermission,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    refreshProfile: initializeAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
