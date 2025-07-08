import { useState, useEffect } from 'react';

export interface MobileConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  orientation: 'portrait' | 'landscape';
  touchEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  darkMode: boolean;
}

export const useMobile = (): MobileConfig => {
  const [config, setConfig] = useState<MobileConfig>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    screenSize: 'lg',
    orientation: 'portrait',
    touchEnabled: false,
    reducedMotion: false,
    highContrast: false,
    darkMode: false
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine screen size
      let screenSize: MobileConfig['screenSize'] = 'lg';
      if (width < 640) screenSize = 'xs';
      else if (width < 768) screenSize = 'sm';
      else if (width < 1024) screenSize = 'md';
      else if (width < 1280) screenSize = 'lg';
      else if (width < 1536) screenSize = 'xl';
      else screenSize = '2xl';

      // Determine device type
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Determine orientation
      const orientation = width > height ? 'landscape' : 'portrait';

      // Check for touch capability
      const touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Check for accessibility preferences
      const mediaQueryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const mediaQueryHighContrast = window.matchMedia('(prefers-contrast: high)');
      const mediaQueryDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

      setConfig({
        isMobile,
        isTablet,
        isDesktop,
        screenSize,
        orientation,
        touchEnabled,
        reducedMotion: mediaQueryReducedMotion.matches,
        highContrast: mediaQueryHighContrast.matches,
        darkMode: mediaQueryDarkMode.matches
      });
    };

    // Initial update
    updateConfig();

    // Listen for changes
    const resizeObserver = new ResizeObserver(updateConfig);
    resizeObserver.observe(document.body);

    // Listen for accessibility preference changes
    const mediaQueryReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mediaQueryHighContrast = window.matchMedia('(prefers-contrast: high)');
    const mediaQueryDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setConfig(prev => ({ ...prev, reducedMotion: e.matches }));
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setConfig(prev => ({ ...prev, highContrast: e.matches }));
    };

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setConfig(prev => ({ ...prev, darkMode: e.matches }));
    };

    mediaQueryReducedMotion.addEventListener('change', handleReducedMotionChange);
    mediaQueryHighContrast.addEventListener('change', handleHighContrastChange);
    mediaQueryDarkMode.addEventListener('change', handleDarkModeChange);

    return () => {
      resizeObserver.disconnect();
      mediaQueryReducedMotion.removeEventListener('change', handleReducedMotionChange);
      mediaQueryHighContrast.removeEventListener('change', handleHighContrastChange);
      mediaQueryDarkMode.removeEventListener('change', handleDarkModeChange);
    };
  }, []);

  return config;
};

// Hook for touch interactions
export const useTouch = () => {
  const [touchState, setTouchState] = useState({
    isTouching: false,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,
    swipeDirection: null as 'left' | 'right' | 'up' | 'down' | null
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchState(prev => ({
      ...prev,
      isTouching: true,
      touchStartX: touch.clientX,
      touchStartY: touch.clientY
    }));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.touchStartX;
    const deltaY = touch.clientY - touchState.touchStartY;
    
    let swipeDirection: 'left' | 'right' | 'up' | 'down' | null = null;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        swipeDirection = deltaX > 0 ? 'right' : 'left';
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        swipeDirection = deltaY > 0 ? 'down' : 'up';
      }
    }

    setTouchState(prev => ({
      ...prev,
      isTouching: false,
      touchEndX: touch.clientX,
      touchEndY: touch.clientY,
      swipeDirection
    }));
  };

  return {
    touchState,
    handleTouchStart,
    handleTouchEnd
  };
};

// Hook for responsive breakpoints
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 640) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 1024) setBreakpoint('md');
      else if (width < 1280) setBreakpoint('lg');
      else if (width < 1536) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

// Hook for device capabilities
export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    hasTouch: false,
    hasPointer: false,
    hasHover: false,
    hasMotion: false,
    hasGeolocation: false,
    hasCamera: false,
    hasMicrophone: false,
    hasBluetooth: false,
    hasNFC: false
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      const newCapabilities = {
        hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        hasPointer: 'onpointerdown' in window,
        hasHover: window.matchMedia('(hover: hover)').matches,
        hasMotion: 'DeviceMotionEvent' in window,
        hasGeolocation: 'geolocation' in navigator,
        hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasMicrophone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        hasBluetooth: 'bluetooth' in navigator,
        hasNFC: 'NDEFReader' in window
      };

      setCapabilities(newCapabilities);
    };

    checkCapabilities();
  }, []);

  return capabilities;
};
