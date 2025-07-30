import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles = ['admin', 'manager', 'salesperson', 'accountant', 'cleaner'],
  redirectTo 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for authentication AND role validation to complete
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-600">Validating access permissions...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Ensure user role exists before checking access
  if (!user.role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user has access to this route
  const hasAccess = allowedRoles.includes(user.role);

  if (!hasAccess) {
    // If no specific redirect is provided, use role-based default
    if (!redirectTo) {
      if (user.role === 'student') {
        // Students should go to their portal
        return <Navigate to={`/student/${user.id}`} replace />;
      } else {
        // Other roles go to module selection
        return <Navigate to="/modules" replace />;
      }
    } else {
      return <Navigate to={redirectTo} replace />;
    }
  }
  return <>{children}</>;
};

export default RoleBasedRoute; 