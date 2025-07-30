// State Persistence Layer
// Handles state persistence across browser tabs and page refreshes

interface AppState {
  currentRoute: string;
  currentTab: string;
  expandedRows: Set<number>;
  filters: Record<string, any>;
  formData: Record<string, any>;
  timestamp: number;
}

interface StatePersistenceConfig {
  key: string;
  ttl?: number; // Time to live in milliseconds
  encrypt?: boolean;
}

class StatePersistence {
  private static instance: StatePersistence;
  private storageKey = 'urbanhub-app-state';
  private defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    try {
      this.initializeVisibilityHandlers();
      this.initializeFocusHandlers();
      this.initializeStorageHandlers();
    } catch (error) {
      console.warn('StatePersistence initialization failed:', error);
    }
  }

  static getInstance(): StatePersistence {
    if (!StatePersistence.instance) {
      StatePersistence.instance = new StatePersistence();
    }
    return StatePersistence.instance;
  }

  // Save state to localStorage
  saveState(state: Partial<AppState>, config?: StatePersistenceConfig): void {
    try {
      const key = config?.key || this.storageKey;
      const timestamp = Date.now();
      const ttl = config?.ttl || this.defaultTTL;

      const stateToSave = {
        ...state,
        timestamp,
        expiresAt: timestamp + ttl
      };

      const serializedState = JSON.stringify(stateToSave);
      localStorage.setItem(key, serializedState);

      // Also save to sessionStorage for immediate access
      sessionStorage.setItem(key, serializedState);

      console.log('💾 State saved:', key, stateToSave);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  // Load state from localStorage
  loadState<T = AppState>(config?: StatePersistenceConfig): T | null {
    try {
      const key = config?.key || this.storageKey;
      
      // Try sessionStorage first (faster)
      let serializedState = sessionStorage.getItem(key);
      
      if (!serializedState) {
        // Fallback to localStorage
        serializedState = localStorage.getItem(key);
      }

      if (!serializedState) {
        return null;
      }

      const state = JSON.parse(serializedState) as T & { expiresAt?: number };

      // Check if state has expired
      if (state.expiresAt && Date.now() > state.expiresAt) {
        this.clearState(key);
        return null;
      }

      console.log('📂 State loaded:', key, state);
      return state;
    } catch (error) {
      console.error('Error loading state:', error);
      return null;
    }
  }

  // Clear specific state
  clearState(key?: string): void {
    const stateKey = key || this.storageKey;
    localStorage.removeItem(stateKey);
    sessionStorage.removeItem(stateKey);
    console.log('🗑️ State cleared:', stateKey);
  }

  // Clear all app state
  clearAllState(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('urbanhub-') || key.startsWith('app-state')
    );
    
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    console.log('🗑️ All app state cleared');
  }

  // Initialize visibility change handlers
  private initializeVisibilityHandlers(): void {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - restore state if needed
        this.restoreStateOnVisibility();
      } else {
        // Page became hidden - save current state
        this.saveCurrentState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // Initialize focus handlers
  private initializeFocusHandlers(): void {
    const handleFocus = () => {
      // Window gained focus - restore state
      this.restoreStateOnFocus();
    };

    const handleBlur = () => {
      // Window lost focus - save state
      this.saveCurrentState();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
  }

  // Initialize storage event handlers (for cross-tab communication)
  private initializeStorageHandlers(): void {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith('urbanhub-')) {
        // State changed in another tab - update current tab
        this.handleCrossTabStateChange(event);
      }
    };

    window.addEventListener('storage', handleStorageChange);
  }

  // Save current application state
  private saveCurrentState(): void {
    try {
      const currentState: Partial<AppState> = {
        currentRoute: window.location.pathname + window.location.search,
        currentTab: this.getCurrentTabFromURL(),
        timestamp: Date.now()
      };

      this.saveState(currentState);
    } catch (error) {
      console.error('Error saving current state:', error);
    }
  }

  // Restore state when page becomes visible
  private restoreStateOnVisibility(): void {
    try {
      const savedState = this.loadState();
      if (savedState && savedState.currentRoute) {
        // Only restore if we're not already on the correct route
        const currentRoute = window.location.pathname + window.location.search;
        if (currentRoute !== savedState.currentRoute) {
          console.log('🔄 Restoring route on visibility:', savedState.currentRoute);
          window.history.replaceState(null, '', savedState.currentRoute);
        }
      }
    } catch (error) {
      console.error('Error restoring state on visibility:', error);
    }
  }

  // Restore state when window gains focus
  private restoreStateOnFocus(): void {
    try {
      const savedState = this.loadState();
      if (savedState) {
        console.log('🎯 Restoring state on focus:', savedState);
        // Trigger a custom event for components to listen to
        window.dispatchEvent(new CustomEvent('stateRestored', { 
          detail: savedState 
        }));
      }
    } catch (error) {
      console.error('Error restoring state on focus:', error);
    }
  }

  // Handle cross-tab state changes
  private handleCrossTabStateChange(event: StorageEvent): void {
    try {
      if (event.newValue) {
        const newState = JSON.parse(event.newValue);
        console.log('🔄 Cross-tab state change detected:', newState);
        
        // Trigger event for components to update
        window.dispatchEvent(new CustomEvent('crossTabStateChange', { 
          detail: newState 
        }));
      }
    } catch (error) {
      console.error('Error handling cross-tab state change:', error);
    }
  }

  // Get current tab from URL
  private getCurrentTabFromURL(): string {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') || 'dashboard';
  }

  // Check if state is stale
  isStateStale(key?: string): boolean {
    const state = this.loadState(key);
    if (!state) return true;

    const maxAge = 30 * 60 * 1000; // 30 minutes
    return Date.now() - (state.timestamp || 0) > maxAge;
  }

  // Get state age in minutes
  getStateAge(key?: string): number {
    const state = this.loadState(key);
    if (!state || !state.timestamp) return Infinity;

    return Math.floor((Date.now() - state.timestamp) / (1000 * 60));
  }
}

// Export singleton instance
export const statePersistence = StatePersistence.getInstance();

// Hook for React components
export const useStatePersistence = () => {
  return statePersistence;
};

// Utility functions
export const saveAppState = (state: Partial<AppState>) => {
  statePersistence.saveState(state);
};

export const loadAppState = <T = AppState>() => {
  return statePersistence.loadState<T>();
};

export const clearAppState = () => {
  statePersistence.clearAllState();
};

export default statePersistence; 