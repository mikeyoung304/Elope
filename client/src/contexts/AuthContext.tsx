/**
 * Authentication Context
 *
 * Provides unified authentication state and methods for both platform admins and tenant admins.
 * Handles JWT token management, role-based access control, and automatic token refresh.
 *
 * @example
 * ```tsx
 * import { useAuth } from '@/contexts/AuthContext';
 *
 * function MyComponent() {
 *   const { user, role, login, logout, isPlatformAdmin } = useAuth();
 *
 *   if (isPlatformAdmin()) {
 *     return <PlatformAdminDashboard />;
 *   }
 *
 *   return <TenantAdminDashboard />;
 * }
 * ```
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../lib/api';
import {
  decodeJWT,
  payloadToUser,
  storeToken,
  clearAllTokens,
  getActiveUser,
  isTokenExpired,
  getTenantIdFromToken,
} from '../lib/auth';
import type {
  User,
  UserRole,
  AuthError,
  AuthErrorType,
} from '../types/auth';

/**
 * Authentication Context Type
 */
export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  tenantId: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isPlatformAdmin: () => boolean;
  isTenantAdmin: () => boolean;
  hasRole: (role: UserRole) => boolean;
  refreshAuth: () => void;
}

/**
 * Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Wraps the app to provide authentication state and methods.
 * Automatically restores auth state from localStorage on mount.
 * Checks for token expiration on mount and periodically.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Refresh authentication state from localStorage
   * Called on mount and after login
   */
  const refreshAuth = useCallback(() => {
    const activeUser = getActiveUser();

    if (activeUser) {
      setUser(activeUser.user);
      setToken(activeUser.token);
      setRole(activeUser.role);

      // Set tenant ID if tenant admin
      if (activeUser.role === 'TENANT_ADMIN') {
        const tid = getTenantIdFromToken(activeUser.token);
        setTenantId(tid);

        // Also set token in API client for tenant routes
        api.setTenantToken(activeUser.token);
      }
    } else {
      setUser(null);
      setToken(null);
      setRole(null);
      setTenantId(null);
    }

    setIsLoading(false);
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  /**
   * Periodically check for token expiration
   * Check every 60 seconds
   */
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (token && isTokenExpired(token)) {
        // Token expired, logout user
        logout();
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [token]);

  /**
   * Login method
   *
   * @param email - User email
   * @param password - User password
   * @param targetRole - User role (PLATFORM_ADMIN or TENANT_ADMIN)
   * @throws Error if login fails
   */
  const login = async (email: string, password: string, targetRole: UserRole): Promise<void> => {
    setIsLoading(true);

    try {
      let result;

      if (targetRole === 'PLATFORM_ADMIN') {
        // Call platform admin login endpoint
        result = await api.adminLogin({
          body: { email, password },
        });
      } else {
        // Call tenant admin login endpoint
        result = await api.tenantLogin({
          body: { email, password },
        });
      }

      // Check if login was successful
      if (result.status !== 200) {
        throw new Error('Invalid email or password');
      }

      const { token: authToken } = result.body;

      // Decode and validate token
      const payload = decodeJWT(authToken);
      const userData = payloadToUser(payload);

      // Verify the role matches what we expect
      if (userData.role !== targetRole) {
        throw new Error('Invalid credentials for this role');
      }

      // Store token
      storeToken(authToken, targetRole);

      // Update state
      setUser(userData);
      setToken(authToken);
      setRole(targetRole);

      // Set tenant ID if tenant admin
      if (targetRole === 'TENANT_ADMIN' && userData.role === 'TENANT_ADMIN') {
        setTenantId(userData.tenantId);
        // Also set token in API client for tenant routes
        api.setTenantToken(authToken);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout method
   *
   * Clears all auth state and redirects to login page
   */
  const logout = useCallback(() => {
    // Clear tokens from localStorage
    clearAllTokens();

    // Clear tenant token from API client
    api.logoutTenant();

    // Clear state
    setUser(null);
    setToken(null);
    setRole(null);
    setTenantId(null);
  }, []);

  /**
   * Check if current user is platform admin
   */
  const isPlatformAdmin = useCallback((): boolean => {
    return role === 'PLATFORM_ADMIN';
  }, [role]);

  /**
   * Check if current user is tenant admin
   */
  const isTenantAdmin = useCallback((): boolean => {
    return role === 'TENANT_ADMIN';
  }, [role]);

  /**
   * Check if current user has specific role
   */
  const hasRole = useCallback(
    (targetRole: UserRole): boolean => {
      return role === targetRole;
    },
    [role]
  );

  const value: AuthContextType = {
    user,
    role,
    tenantId,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    isPlatformAdmin,
    isTenantAdmin,
    hasRole,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 *
 * @throws Error if used outside AuthProvider
 * @returns Auth context value
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, login, logout, isPlatformAdmin } = useAuth();
 *
 *   if (!user) {
 *     return <LoginForm onLogin={login} />;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}</p>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

/**
 * Export AuthContext for advanced use cases
 */
export { AuthContext };

// Re-export types for convenience
export type { User, UserRole } from '../types/auth';
