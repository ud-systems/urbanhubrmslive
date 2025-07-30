import React, { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

// System-wide standardization component to enforce all rules
export const SystemWideStandardization = () => {
  
  useEffect(() => {
    // Safely apply standardization after DOM is ready
    const timer = setTimeout(() => {
      try {
        // Apply mobile font sizes from memory (safe operation)
        enforceMobileFontSizes();
        
        // Only apply DOM manipulations if elements exist
        if (document.readyState === 'complete') {
          enforceResponsiveDesign();
          standardizeDialogs();
          standardizeBackButtons();
          verifyButtonFunctionality();
        }
      } catch (error) {
        console.warn('SystemWideStandardization error:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const enforceResponsiveDesign = () => {
    // Add mobile-first responsive classes to all grid and flex containers
    const containers = document.querySelectorAll('.grid, .flex');
    containers.forEach(container => {
      if (!container.className.includes('grid-cols-1') && container.className.includes('grid')) {
        container.classList.add('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
      }
      if (!container.className.includes('flex-col') && container.className.includes('flex')) {
        container.classList.add('flex-col', 'md:flex-row');
      }
    });
  };

  const standardizeDialogs = () => {
    // Ensure all dialogs have proper structure with 2 close buttons
    const dialogs = document.querySelectorAll('[role="dialog"]');
    dialogs.forEach(dialog => {
      // Check for existing close buttons
      const closeButtons = dialog.querySelectorAll('button[aria-label="Close"], .dialog-close');
      
      // If less than 2 close buttons, add additional ones
      if (closeButtons.length < 2) {
        const dialogHeader = dialog.querySelector('.dialog-header, [data-dialog-header]');
        if (dialogHeader && !dialogHeader.querySelector('.secondary-close')) {
          const secondaryClose = document.createElement('button');
          secondaryClose.className = 'secondary-close absolute top-2 left-2 p-2 rounded-sm opacity-70 hover:opacity-100';
          secondaryClose.innerHTML = '×';
          secondaryClose.setAttribute('aria-label', 'Close');
          dialogHeader.appendChild(secondaryClose);
        }
      }

      // Ensure proper padding - remove excessive padding
      if (dialog.className.includes('p-8') || dialog.className.includes('p-10')) {
        dialog.classList.remove('p-8', 'p-10');
        dialog.classList.add('p-4', 'md:p-6');
      }

      // Ensure mobile-bottom animation
      if (!dialog.className.includes('dialog-content')) {
        dialog.classList.add('dialog-content');
      }
    });
  };

  const standardizeBackButtons = () => {
    // Move all back buttons to far right position
    const backButtons = document.querySelectorAll('button:has([data-lucide="arrow-left"]), .back-button');
    backButtons.forEach(button => {
      const parentContainer = button.closest('.flex, .grid, .relative');
      if (parentContainer) {
        // Remove the button from current position
        button.remove();
        
        // Create a new container if needed for proper positioning
        let rightContainer = parentContainer.querySelector('.button-container-right');
        if (!rightContainer) {
          rightContainer = document.createElement('div');
          rightContainer.className = 'button-container-right ml-auto flex justify-end';
          parentContainer.appendChild(rightContainer);
        }
        
        // Add button to far right
        rightContainer.appendChild(button);
        button.classList.add('ml-auto');
      }
    });
  };

  const verifyButtonFunctionality = () => {
    // Audit all buttons to ensure they have proper onClick handlers
    const buttons = document.querySelectorAll('button:not([disabled])');
    buttons.forEach(button => {
      const buttonElement = button as HTMLButtonElement;
      if (!buttonElement.onclick && !buttonElement.getAttribute('onclick') && 
          !buttonElement.closest('form') && !buttonElement.getAttribute('type')) {
        console.warn('Button without functionality detected:', buttonElement);
        // Add data attribute for tracking
        buttonElement.setAttribute('data-needs-functionality', 'true');
      }
    });
  };

  const enforceMobileFontSizes = () => {
    // Apply mobile-first font sizing based on memory preferences
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        /* Body text and form fields: 10-12px */
        .text-sm, input, textarea, select {
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
        button, .btn, .cursor-pointer {
          min-height: 44px !important;
        }
        
        /* Dialog animations from bottom with zero margin */
        .dialog-content {
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
      }
    `;
    
    // Remove existing style if present
    const existingStyle = document.getElementById('system-wide-mobile-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    style.id = 'system-wide-mobile-styles';
    document.head.appendChild(style);
  };

  return null; // This component doesn't render anything, just applies rules
};

// Hook to enforce system-wide standards
export const useSystemWideStandards = () => {
  useEffect(() => {
    // Monitor DOM changes and re-apply standards
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // Re-apply standards when new elements are added
          setTimeout(() => {
                         // Re-apply standardization functions when DOM changes
             const style = document.getElementById('system-wide-mobile-styles');
             if (!style) {
               // Re-apply mobile font sizes if not present
               window.location.reload();
             }
          }, 100);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);
};

export default SystemWideStandardization; 