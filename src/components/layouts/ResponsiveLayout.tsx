import React from 'react';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  type?: 'grid' | 'flex' | 'auto';
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  type = 'auto',
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 'md',
  padding = 'md'
}) => {
  const { isMobile, isTablet, isDesktop } = useMobile();

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const paddingClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  // Auto-detect layout type based on children
  const autoType = React.Children.count(children) > 4 ? 'grid' : 'flex';
  const layoutType = type === 'auto' ? autoType : type;

  if (layoutType === 'grid') {
    return (
      <div 
        className={cn(
          'grid w-full',
          `grid-cols-${mobileColumns}`,
          `md:grid-cols-${tabletColumns}`,
          `lg:grid-cols-${desktopColumns}`,
          gapClasses[gap],
          paddingClasses[padding],
          className
        )}
      >
        {children}
      </div>
    );
  }

  if (layoutType === 'flex') {
    return (
      <div 
        className={cn(
          'flex w-full',
          'flex-col', // Mobile first: stack vertically
          'md:flex-row', // Tablet and up: horizontal
          'flex-wrap',
          gapClasses[gap],
          paddingClasses[padding],
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={cn('w-full', paddingClasses[padding], className)}>
      {children}
    </div>
  );
};

// Enhanced Card component that flexes appropriately
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  flexBasis?: 'auto' | 'full' | '1/2' | '1/3' | '1/4';
  minHeight?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  flexBasis = 'auto',
  minHeight = 'auto'
}) => {
  const { isMobile } = useMobile();

  const flexBasisClasses = {
    auto: 'flex-1',
    full: 'w-full',
    '1/2': 'w-full md:w-1/2',
    '1/3': 'w-full md:w-1/2 lg:w-1/3',
    '1/4': 'w-full md:w-1/2 lg:w-1/3 xl:w-1/4'
  };

  return (
    <div 
      className={cn(
        'bg-white rounded-lg border shadow-sm transition-all duration-200',
        'hover:shadow-md hover:border-slate-200',
        flexBasisClasses[flexBasis],
        isMobile ? 'mb-4' : '', // Mobile spacing
        className
      )}
      style={{ minHeight }}
    >
      {children}
    </div>
  );
};

// Back button component that positions correctly
interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Back',
  className
}) => {
  return (
    <div className="flex justify-end w-full mb-4">
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700',
          'bg-white border border-slate-300 rounded-md shadow-sm',
          'hover:bg-slate-50 hover:border-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          'transition-colors duration-200',
          'ml-auto', // Far right positioning
          className
        )}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {label}
      </button>
    </div>
  );
};

export default ResponsiveLayout; 