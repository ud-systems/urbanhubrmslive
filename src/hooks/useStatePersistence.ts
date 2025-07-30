// React hook for state persistence
// Provides easy access to state persistence functionality for components

import { useEffect, useCallback, useState } from 'react';
import { statePersistence, saveAppState, loadAppState, clearAppState } from '@/lib/statePersistence';

interface UseStatePersistenceOptions {
  key?: string;
  ttl?: number;
  autoSave?: boolean;
  autoRestore?: boolean;
}

export const useStatePersistence = (options: UseStatePersistenceOptions = {}) => {
  const {
    key = 'component-state',
    ttl = 24 * 60 * 60 * 1000, // 24 hours
    autoSave = true,
    autoRestore = true
  } = options;

  const [isRestoring, setIsRestoring] = useState(false);

  // Save state
  const saveState = useCallback((state: any) => {
    try {
      statePersistence.saveState(state, { key, ttl });
      if (autoSave) {
        saveAppState({ [key]: state });
      }
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [key, ttl, autoSave]);

  // Load state
  const loadState = useCallback(<T = any>(): T | null => {
    try {
      const state = statePersistence.loadState<T>({ key });
      return state;
    } catch (error) {
      console.error('Error loading state:', error);
      return null;
    }
  }, [key]);

  // Clear state
  const clearState = useCallback(() => {
    try {
      statePersistence.clearState(key);
    } catch (error) {
      console.error('Error clearing state:', error);
    }
  }, [key]);

  // Auto-restore state on mount
  useEffect(() => {
    if (autoRestore) {
      setIsRestoring(true);
      const savedState = loadState();
      if (savedState) {
        console.log(`🔄 Auto-restoring state for key: ${key}`, savedState);
        // Trigger a custom event for components to handle restoration
        window.dispatchEvent(new CustomEvent('stateRestored', {
          detail: { key, state: savedState }
        }));
      }
      setIsRestoring(false);
    }
  }, [key, autoRestore, loadState]);

  // Listen for state restoration events
  useEffect(() => {
    const handleStateRestored = (event: CustomEvent) => {
      if (event.detail?.key === key) {
        console.log(`🎯 State restored for key: ${key}`, event.detail.state);
      }
    };

    const handleCrossTabChange = (event: CustomEvent) => {
      if (event.detail?.key === key) {
        console.log(`🔄 Cross-tab state change for key: ${key}`, event.detail.state);
      }
    };

    window.addEventListener('stateRestored', handleStateRestored as EventListener);
    window.addEventListener('crossTabStateChange', handleCrossTabChange as EventListener);

    return () => {
      window.removeEventListener('stateRestored', handleStateRestored as EventListener);
      window.removeEventListener('crossTabStateChange', handleCrossTabChange as EventListener);
    };
  }, [key]);

  return {
    saveState,
    loadState,
    clearState,
    isRestoring,
    // Utility functions
    saveAppState,
    loadAppState,
    clearAppState,
    // State persistence instance
    statePersistence
  };
};

// Hook for route state persistence
export const useRoutePersistence = () => {
  const saveRouteState = useCallback((route: string, tab?: string) => {
    saveAppState({
      currentRoute: route,
      currentTab: tab || 'dashboard',
      timestamp: Date.now()
    });
  }, []);

  const loadRouteState = useCallback(() => {
    return loadAppState();
  }, []);

  return {
    saveRouteState,
    loadRouteState
  };
};

// Hook for form state persistence
export const useFormPersistence = (formKey: string) => {
  const saveFormState = useCallback((formData: any) => {
    statePersistence.saveState(formData, { 
      key: `form-${formKey}`,
      ttl: 60 * 60 * 1000 // 1 hour
    });
  }, [formKey]);

  const loadFormState = useCallback(<T = any>(): T | null => {
    return statePersistence.loadState<T>({ key: `form-${formKey}` });
  }, [formKey]);

  const clearFormState = useCallback(() => {
    statePersistence.clearState(`form-${formKey}`);
  }, [formKey]);

  return {
    saveFormState,
    loadFormState,
    clearFormState
  };
};

export default useStatePersistence; 