import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const { loading: authLoading } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Show loader initially
    setShowLoader(true);

    // Check if we need to restore state
    const savedState = localStorage.getItem('urbanhub-app-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.currentRoute && state.currentRoute !== window.location.pathname + window.location.search) {
          setIsRestoring(true);
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }

    // Hide loader after a short delay to ensure smooth transition
    const timer = setTimeout(() => {
      setShowLoader(false);
      setIsRestoring(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleImmediateStateRestored = () => {
      setIsRestoring(false);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // When tab becomes visible, show loader briefly
        setShowLoader(true);
        setIsRestoring(true);
        
        setTimeout(() => {
          setShowLoader(false);
          setIsRestoring(false);
        }, 300);
      }
    };

    window.addEventListener('immediateStateRestored', handleImmediateStateRestored as EventListener);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('immediateStateRestored', handleImmediateStateRestored as EventListener);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Show loader if auth is loading, state is restoring, or we're in the initial loading phase
  if (authLoading || isRestoring || showLoader) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {isRestoring ? 'Restoring your session...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppLoader; 