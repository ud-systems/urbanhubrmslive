// Error suppression utility to reduce console noise from non-critical issues

export const suppressNonCriticalErrors = () => {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  // List of non-critical error patterns to suppress
  const suppressedErrorPatterns = [
    'Error fetching users',
    'Studio views fetched successfully',
    'User already exists',
    'Failed to load resource: the server responded with a status of 400',
    'You may test your Stripe.js integration over HTTP'
  ];

  // Override console.error
  console.error = (...args) => {
    const errorMessage = args.join(' ');
    
    // Check if this is a non-critical error we want to suppress
    const shouldSuppress = suppressedErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    );
    
    if (!shouldSuppress) {
      originalError.apply(console, args);
    }
  };

  // Override console.warn for non-critical warnings
  console.warn = (...args) => {
    const warnMessage = args.join(' ');
    
    // Always show authentication warnings
    if (warnMessage.includes('🚨') || warnMessage.includes('authentication')) {
      originalWarn.apply(console, args);
      return;
    }
    
    // Suppress Stripe HTTP warning in development
    if (warnMessage.includes('Stripe.js integration over HTTP')) {
      return;
    }
    
    originalWarn.apply(console, args);
  };

  // Return cleanup function
  return () => {
    console.error = originalError;
    console.warn = originalWarn;
    console.log = originalLog;
  };
};

// Clean console utility for production
export const cleanConsoleForProduction = () => {
  if (import.meta.env.PROD) {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
};

export default { suppressNonCriticalErrors, cleanConsoleForProduction }; 