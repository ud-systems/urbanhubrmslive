import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const InitialRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while determining auth state
  if (loading) {
    return <LoadingSpinner fullScreen text="Checking authentication..." size="lg" />;
  }

  // If user exists, only redirect if we're on the root path
  if (user) {
    // Only redirect from root path - let users stay on their current page
    if (location.pathname === '/') {
      if (user.role === 'student') {
        return <Navigate to={`/student/${user.id}`} replace />;
      }
      return <Navigate to="/modules" replace />;
    }
    
    // User is authenticated and on a specific page - don't redirect, let the page load
    return null; // Let the current route handle the page
  }

  // No user, redirect to login
  return <Navigate to="/signin" replace />;
};

export default InitialRoute; 