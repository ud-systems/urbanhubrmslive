import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  validation?: (value: string) => string | null;
  showValidation?: boolean;
  helpText?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  error,
  required = false,
  validation,
  showValidation = true,
  helpText,
  className,
  ...props
}) => {
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isValid, setIsValid] = React.useState<boolean | null>(null);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Required field validation
    if (required && !value.trim()) {
      setLocalError(`${label} is required`);
      setIsValid(false);
      return;
    }

    // Custom validation
    if (validation && value) {
      const validationError = validation(value);
      setLocalError(validationError);
      setIsValid(!validationError);
      return;
    }

    // Clear errors if validation passes
    setLocalError(null);
    setIsValid(value ? true : null);
    
    props.onBlur?.(e);
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={props.id} 
        className={cn(
          "text-sm font-medium",
          required && "after:content-['*'] after:ml-1 after:text-red-500"
        )}
      >
        {label}
      </Label>
      
      <div className="relative">
        <Input
          {...props}
          onBlur={handleBlur}
          className={cn(
            displayError && "border-red-500 focus:border-red-500",
            isValid && !displayError && "border-green-500",
            className
          )}
        />
        
        {showValidation && isValid !== null && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid && !displayError ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : displayError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
        )}
      </div>

      {displayError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{displayError}</AlertDescription>
        </Alert>
      )}

      {helpText && !displayError && (
        <p className="text-sm text-slate-600">{helpText}</p>
      )}
    </div>
  );
};

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
  validation?: (value: string) => string | null;
  maxLength?: number;
  helpText?: string;
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  error,
  required = false,
  validation,
  maxLength,
  helpText,
  className,
  ...props
}) => {
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [isValid, setIsValid] = React.useState<boolean | null>(null);
  const [charCount, setCharCount] = React.useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    props.onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    if (required && !value.trim()) {
      setLocalError(`${label} is required`);
      setIsValid(false);
      return;
    }

    if (validation && value) {
      const validationError = validation(value);
      setLocalError(validationError);
      setIsValid(!validationError);
      return;
    }

    setLocalError(null);
    setIsValid(value ? true : null);
    
    props.onBlur?.(e);
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={props.id} 
        className={cn(
          "text-sm font-medium",
          required && "after:content-['*'] after:ml-1 after:text-red-500"
        )}
      >
        {label}
      </Label>
      
      <Textarea
        {...props}
        maxLength={maxLength}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          displayError && "border-red-500 focus:border-red-500",
          isValid && !displayError && "border-green-500",
          className
        )}
      />

      <div className="flex justify-between items-center">
        <div>
          {displayError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{displayError}</AlertDescription>
            </Alert>
          )}

          {helpText && !displayError && (
            <p className="text-sm text-slate-600">{helpText}</p>
          )}
        </div>

        {maxLength && (
          <span className={cn(
            "text-sm",
            charCount > maxLength * 0.9 ? "text-red-500" : "text-slate-500"
          )}>
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
};

interface ValidatedSelectProps {
  label: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  helpText?: string;
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  error,
  required = false,
  options,
  placeholder = "Select an option",
  value,
  onValueChange,
  helpText
}) => {
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleValueChange = (newValue: string) => {
    if (required && !newValue) {
      setLocalError(`${label} is required`);
    } else {
      setLocalError(null);
    }
    
    onValueChange?.(newValue);
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2">
      <Label 
        className={cn(
          "text-sm font-medium",
          required && "after:content-['*'] after:ml-1 after:text-red-500"
        )}
      >
        {label}
      </Label>
      
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger className={cn(
          displayError && "border-red-500 focus:border-red-500"
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {displayError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{displayError}</AlertDescription>
        </Alert>
      )}

      {helpText && !displayError && (
        <p className="text-sm text-slate-600">{helpText}</p>
      )}
    </div>
  );
};

// Form container that ensures mobile responsiveness
interface ResponsiveFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  columns?: 1 | 2 | 3;
}

export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  onSubmit,
  className,
  columns = 1
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <form 
      onSubmit={onSubmit}
      className={cn(
        'grid gap-4 w-full',
        gridClasses[columns],
        className
      )}
    >
      {children}
    </form>
  );
};

export default ValidatedInput; 