import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGlobalFilter } from './GlobalFilterContext';

// Auth types
export interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  designation?: string;
  employeeId?: string;
}

export interface Jurisdiction {
  state: string | null;
  district: string | null;
  block: string | null;
  village: string | null;
}

export interface Permissions {
  canRegisterUsers: boolean;
  canUpdateSensors: boolean;
  canInvestigateReports: boolean;
  canResolveReports: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserInfo | null;
  jurisdiction: Jurisdiction | null;
  permissions: Permissions | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'arogyajal_auth';
const API_BASE_URL = 'http://localhost:8080';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
    jurisdiction: null,
    permissions: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { updateFilter } = useGlobalFilter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: AuthState = JSON.parse(saved);
        setAuthState(parsed);
        
        // Auto-apply jurisdiction filter
        if (parsed.jurisdiction) {
          if (parsed.jurisdiction.state) {
            updateFilter('state', parsed.jurisdiction.state);
          }
          if (parsed.jurisdiction.district) {
            updateFilter('district', parsed.jurisdiction.district);
          }
          if (parsed.jurisdiction.village) {
            updateFilter('village', parsed.jurisdiction.village);
          }
        }
      }
    } catch (err) {
      console.error('Error loading auth state:', err);
    }
  }, []);

  // Save auth state to localStorage
  const saveAuthState = (state: AuthState) => {
    setAuthState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      const newAuthState: AuthState = {
        isAuthenticated: true,
        token: data.token,
        user: data.user,
        jurisdiction: data.jurisdiction,
        permissions: data.permissions,
      };

      saveAuthState(newAuthState);

      // Auto-apply jurisdiction filter
      if (data.jurisdiction) {
        if (data.jurisdiction.state) {
          updateFilter('state', data.jurisdiction.state);
        }
        if (data.jurisdiction.district) {
          updateFilter('district', data.jurisdiction.district);
        }
        if (data.jurisdiction.village) {
          updateFilter('village', data.jurisdiction.village);
        }
      }

      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setIsLoading(false);
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    // Call logout API (optional)
    if (authState.token) {
      fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': authState.token,
        },
      }).catch(err => console.error('Logout API error:', err));
    }

    // Clear state
    const emptyState: AuthState = {
      isAuthenticated: false,
      token: null,
      user: null,
      jurisdiction: null,
      permissions: null,
    };
    
    saveAuthState(emptyState);
    localStorage.removeItem(STORAGE_KEY);
    
    // Reset filters
    updateFilter('state', null);
    updateFilter('district', null);
    updateFilter('village', null);
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
