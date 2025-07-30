import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  fieldName?: string;
}

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  fieldName?: string;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, label, error, required, fieldName, ...props }, ref) => {
    const hasError = !!error;
    
    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={props.id || fieldName} 
            className={cn(
              "text-sm font-medium",
              hasError && "text-red-600",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            id={props.id || fieldName}
            name={props.name || fieldName}
            data-field={fieldName}
            className={cn(
              hasError && "border-red-500 focus:border-red-500 focus:ring-red-200 pr-10",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${fieldName}-error` : undefined}
            {...props}
          />
          {hasError && (
            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
        </div>
        {hasError && (
          <p 
            id={`${fieldName}-error`}
            className="text-sm text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

export const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ className, label, error, required, fieldName, ...props }, ref) => {
    const hasError = !!error;
    
    return (
      <div className="space-y-2">
        {label && (
          <Label 
            htmlFor={props.id || fieldName}
            className={cn(
              "text-sm font-medium",
              hasError && "text-red-600",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </Label>
        )}
        <div className="relative">
          <Textarea
            ref={ref}
            id={props.id || fieldName}
            name={props.name || fieldName}
            data-field={fieldName}
            className={cn(
              hasError && "border-red-500 focus:border-red-500 focus:ring-red-200 pr-10",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${fieldName}-error` : undefined}
            {...props}
          />
          {hasError && (
            <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
          )}
        </div>
        {hasError && (
          <p 
            id={`${fieldName}-error`}
            className="text-sm text-red-600 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

ValidatedTextarea.displayName = "ValidatedTextarea";

interface ValidatedSelectProps {
  label?: string;
  error?: string;
  required?: boolean;
  fieldName?: string;
  children: React.ReactNode;
  className?: string;
}

export const ValidatedSelectWrapper: React.FC<ValidatedSelectProps> = ({
  label,
  error,
  required,
  fieldName,
  children,
  className
}) => {
  const hasError = !!error;
  
  return (
    <div className="space-y-2">
      {label && (
        <Label 
          className={cn(
            "text-sm font-medium",
            hasError && "text-red-600",
            required && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {label}
        </Label>
      )}
      <div className="relative">
        <div 
          className={cn(
            hasError && "[&_button]:border-red-500 [&_button]:focus:border-red-500 [&_button]:focus:ring-red-200",
            className
          )}
          data-field={fieldName}
        >
          {children}
        </div>
        {hasError && (
          <AlertCircle className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500 pointer-events-none" />
        )}
      </div>
      {hasError && (
        <p 
          id={`${fieldName}-error`}
          className="text-sm text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}; 