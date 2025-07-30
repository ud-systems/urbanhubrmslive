import { toast } from '@/hooks/use-toast';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [fieldName: string]: string };
  firstErrorField?: string;
}

export const validateForm = (formData: any, rules: ValidationRules): ValidationResult => {
  const errors: { [fieldName: string]: string } = {};
  let firstErrorField: string | undefined;

  for (const [fieldName, rule] of Object.entries(rules)) {
    const value = formData[fieldName];
    const error = validateField(value, rule, fieldName);
    
    if (error) {
      errors[fieldName] = error;
      if (!firstErrorField) {
        firstErrorField = fieldName;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstErrorField
  };
};

export const validateField = (value: any, rule: ValidationRule, fieldName: string): string | null => {
  const displayName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1');

  // Required validation
  if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return `${displayName} is required`;
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  // Email validation
  if (rule.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `Please enter a valid email address`;
    }
  }

  // Phone validation
  if (rule.phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return `Please enter a valid phone number`;
    }
  }

  // Length validation
  if (rule.minLength && value.length < rule.minLength) {
    return `${displayName} must be at least ${rule.minLength} characters`;
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    return `${displayName} must not exceed ${rule.maxLength} characters`;
  }

  // Pattern validation
  if (rule.pattern && !rule.pattern.test(value)) {
    return `${displayName} format is invalid`;
  }

  // Custom validation
  if (rule.custom) {
    const customResult = rule.custom(value);
    if (customResult !== true) {
      return typeof customResult === 'string' ? customResult : `${displayName} is invalid`;
    }
  }

  return null;
};

export const showValidationErrors = (errors: { [fieldName: string]: string }, firstErrorField?: string) => {
  const errorCount = Object.keys(errors).length;
  
  if (errorCount === 1) {
    const [fieldName, error] = Object.entries(errors)[0];
    toast({
      title: "Validation Error",
      description: error,
      variant: "destructive"
    });
  } else if (errorCount > 1) {
    const firstError = firstErrorField ? errors[firstErrorField] : Object.values(errors)[0];
    toast({
      title: `${errorCount} Validation Errors`,
      description: `${firstError} (and ${errorCount - 1} other field${errorCount - 1 > 1 ? 's' : ''})`,
      variant: "destructive"
    });
  }

  // Scroll to first error field
  if (firstErrorField) {
    setTimeout(() => {
      const element = document.querySelector(`[name="${firstErrorField}"], #${firstErrorField}, [data-field="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.focus();
        }
      }
    }, 100);
  }
};

export const getFieldError = (fieldName: string, errors: { [fieldName: string]: string }): string | undefined => {
  return errors[fieldName];
};

export const getFieldClassName = (fieldName: string, errors: { [fieldName: string]: string }, baseClassName = ''): string => {
  const hasError = errors[fieldName];
  const errorClass = hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '';
  return `${baseClassName} ${errorClass}`.trim();
};

// Common validation rule sets
export const commonRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\-'\.]+$/
  },
  email: {
    required: true,
    email: true,
    maxLength: 255
  },
  phone: {
    required: true,
    phone: true
  },
  requiredText: {
    required: true,
    minLength: 1,
    maxLength: 255
  },
  optionalText: {
    required: false,
    maxLength: 255
  },
  requiredNumber: {
    required: true,
    custom: (value: any) => !isNaN(Number(value)) && Number(value) > 0
  },
  positiveNumber: {
    required: false,
    custom: (value: any) => value === '' || (!isNaN(Number(value)) && Number(value) >= 0)
  }
}; 