import React, { useEffect } from 'react';

// Safe system-wide standardization component that won't interfere with React rendering
export const SafeSystemStandardization = () => {
  
  useEffect(() => {
    // Only apply CSS-based standardizations that are safe
    const applyMobileFontSizes = () => {
      try {
        // Remove existing style if present
        const existingStyle = document.getElementById('safe-mobile-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
        
        // Apply mobile font sizes via CSS (safe operation)
        const style = document.createElement('style');
        style.id = 'safe-mobile-styles';
        style.textContent = `
          /* Mobile-optimized font sizes for better readability */
          @media (max-width: 768px) {
            /* Body text and form fields: 10-12px */
            .text-sm, input:not([type="range"]), textarea, select {
              font-size: 11px !important;
            }
            
            .text-base, .text-md {
              font-size: 12px !important;
            }
            
            /* Titles and subtitles: 14-18px */
            h3, .text-lg {
              font-size: 14px !important;
            }
            
            h2, .text-xl {
              font-size: 16px !important;
            }
            
            h1, .text-2xl {
              font-size: 18px !important;
            }
            
            /* Ensure touch-friendly buttons */
            button:not([disabled]), .btn, .cursor-pointer {
              min-height: 44px !important;
            }
            
            /* Dialog animations from bottom with zero margin */
            [data-state="open"][role="dialog"] {
              animation: slideUpMobile 0.3s ease-out;
              margin-bottom: 0 !important;
            }
            
            @keyframes slideUpMobile {
              from {
                transform: translateY(100%);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            
            /* Responsive grid fallbacks */
            .grid:not([class*="grid-cols"]) {
              grid-template-columns: 1fr !important;
            }
            
            /* Responsive flex fallbacks */
            .flex:not(.flex-row):not(.flex-col) {
              flex-direction: column !important;
            }
          }
          
          /* Tablet and up adjustments */
          @media (min-width: 768px) and (max-width: 1024px) {
            .grid:not([class*="grid-cols"]) {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            
            .flex:not(.flex-row):not(.flex-col) {
              flex-direction: row !important;
            }
          }
          
          /* Desktop adjustments */
          @media (min-width: 1024px) {
            .grid:not([class*="grid-cols"]) {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
        `;
        
        document.head.appendChild(style);
        console.log('✅ Mobile font sizes and responsive rules applied safely');
      } catch (error) {
        console.warn('Safe standardization error:', error);
      }
    };

    // Apply after a short delay to ensure DOM is ready
    const timer = setTimeout(applyMobileFontSizes, 500);

    return () => {
      clearTimeout(timer);
      // Cleanup on unmount
      const style = document.getElementById('safe-mobile-styles');
      if (style) {
        style.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default SafeSystemStandardization; 