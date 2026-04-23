import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // If true, requires login
  requiredPermission?: 'canRegisterUsers' | 'canUpdateSensors' | 'canInvestigateReports' | 'canResolveReports';
}

/**
 * Protected Route Component
 * 
 * Usage:
 * <ProtectedRoute requireAuth={true}>
 *   <SomePage />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute requireAuth={true} requiredPermission="canRegisterUsers">
 *   <AdminPage />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = false,
  requiredPermission 
}) => {
  const { isAuthenticated, permissions } = useAuth();

  // If authentication is required but user is not logged in
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific permission is required
  if (requiredPermission && permissions) {
    const hasPermission = permissions[requiredPermission];
    
    if (!hasPermission) {
      // Redirect to dashboard with error message
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
