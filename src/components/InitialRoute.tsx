import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEffect, useState } from 'react';
import { statePersistence } from '@/lib/statePersistence';

const InitialRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isRestoring, setIsRestoring] = useState(false);

  // Check if we should restore a previous route
  useEffect(() => {
    if (!loading && user && location.pathname === '/') {
      const savedState = statePersistence.loadState({ silent: true });
      if (savedState?.currentRoute && savedState.currentRoute !== '/') {
        setIsRestoring(true);
        // Use a small delay to ensure the component is fully mounted
        setTimeout(() => {
          window.location.href = savedState.currentRoute;
        }, 100);
      }
    }
  }, [loading, user, location.pathname]);

  // Show loading while determining auth state or restoring route
  if (loading || isRestoring) {
    return <LoadingSpinner fullScreen text="Checking authentication..." size="lg" />;
  }

  // If user exists, only redirect if we're on the root path and no saved route
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