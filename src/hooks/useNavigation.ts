import { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRoutePersistence } from './useStatePersistence';

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveCurrentRoute, saveRouteState } = useRoutePersistence();

  // Save current route whenever location changes
  useEffect(() => {
    saveCurrentRoute();
  }, [location.pathname, location.search, saveCurrentRoute]);

  // Enhanced navigate function that saves route state
  const navigateWithPersistence = useCallback((to: string, options?: { replace?: boolean; state?: any }) => {
    // Save the current route before navigating
    saveCurrentRoute();
    
    // Navigate to the new route
    if (options?.replace) {
      navigate(to, { replace: true, state: options.state });
    } else {
      navigate(to, { state: options.state });
    }
    
    // Save the new route after a short delay to ensure navigation is complete
    setTimeout(() => {
      saveRouteState(to);
    }, 100);
  }, [navigate, saveCurrentRoute, saveRouteState]);

  // Navigate back with persistence
  const navigateBack = useCallback(() => {
    saveCurrentRoute();
    navigate(-1);
  }, [navigate, saveCurrentRoute]);

  // Navigate forward with persistence
  const navigateForward = useCallback(() => {
    saveCurrentRoute();
    navigate(1);
  }, [navigate, saveCurrentRoute]);

  return {
    navigate: navigateWithPersistence,
    navigateBack,
    navigateForward,
    location,
    saveCurrentRoute
  };
};

export default useNavigation; 