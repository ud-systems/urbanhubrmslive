import { z } from 'zod';

// Lead validation schema
export const LeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone must be less than 20 characters'),
  source: z.string().optional(),
  status: z.string().optional(),
  assignedto: z.string().optional(),
  notes: z.string().optional(),
  dateofinquiry: z.string().optional(),
  revenue: z.number().optional().or(z.string().transform(val => parseFloat(val) || 0)),
  responsecategory: z.string().optional(),
  followupstage: z.string().optional(),
});

// Student validation schema - Updated to match actual database structure
export const StudentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone must be less than 20 characters'),
  room: z.string().optional(), // Database uses 'room' not 'roomgrade'
  duration: z.string().optional(),
  assignedto: z.string().optional(),
  checkin: z.string().optional(),
  revenue: z.number().optional().or(z.string().transform(val => parseFloat(val) || 0)),
  // Removed fields that don't exist in database: checkout, notes, dateofinquiry, roomgrade
});

// Studio validation schema
export const StudioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  id: z.string().min(1, 'ID is required').max(50, 'ID must be less than 50 characters'),
  view: z.string().optional(),
  floor: z.union([
    z.number(),
    z.string().transform((val) => {
      if (val === 'G' || val === 'g' || val === 'Ground' || val === 'ground') {
        return 0; // Convert ground floor to 0
      }
      const num = parseInt(val);
      return isNaN(num) ? 1 : num; // Default to 1 if parsing fails
    })
  ]).optional(),
  roomGrade: z.string().optional(),
  occupied: z.boolean().optional(),
  occupiedby: z.number().nullable().optional(),
});

// Studio update validation schema (for partial updates)
export const StudioUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  id: z.string().min(1, 'ID is required').max(50, 'ID must be less than 50 characters').optional(),
  view: z.string().optional(),
  floor: z.union([
    z.number(),
    z.string().transform((val) => {
      if (val === 'G' || val === 'g' || val === 'Ground' || val === 'ground') {
        return 0; // Convert ground floor to 0
      }
      const num = parseInt(val);
      return isNaN(num) ? 1 : num; // Default to 1 if parsing fails
    })
  ]).optional(),
  roomGrade: z.string().optional(),
  occupied: z.boolean().optional(),
  occupiedby: z.number().nullable().optional(),
});

// User validation schema
export const UserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'salesperson', 'accountant', 'cleaner', 'student'], {
    errorMap: () => ({ message: 'Role must be admin, manager, salesperson, accountant, cleaner, or student' })
  }),
});

// Configuration item validation schema
export const ConfigItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
});

// Room grade validation schema
export const RoomGradeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  stock: z.number().min(0, 'Stock must be 0 or greater').optional(),
});

// Validation helper functions
export const validateLead = (data: any) => {
  try {
    return { success: true, data: LeadSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateStudent = (data: any) => {
  try {
    return { success: true, data: StudentSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateStudio = (data: any) => {
  try {
    const result = StudioSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateStudioUpdate = (data: any) => {
  try {
    return { success: true, data: StudioUpdateSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

export const validateUser = (data: any) => {
  try {
    return { success: true, data: UserSchema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    return { success: false, errors: [{ message: 'Validation failed' }] };
  }
};

// Sanitization helper functions
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};

export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^\d+\-\(\)\s]/g, '').trim();
};

// Email validation function to prevent bounces
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidDomains = [
    '@email.com', 
    '@student.ac.uk', 
    '@tourist.com', 
    '@test.com', 
    '@example.com',
    '@placeholder.com'
  ];
  
  if (!emailRegex.test(email)) return false;
  if (invalidDomains.some(domain => email.includes(domain))) return false;
  
  return true;
}; 