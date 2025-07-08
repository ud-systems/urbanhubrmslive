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

// Student validation schema
export const StudentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required').max(20, 'Phone must be less than 20 characters'),
  roomgrade: z.string().optional(),
  duration: z.string().optional(),
  assignedto: z.string().optional(),
  checkin: z.string().optional(),
  checkout: z.string().optional(),
  revenue: z.number().optional().or(z.string().transform(val => parseFloat(val) || 0)),
  notes: z.string().optional(),
  dateofinquiry: z.string().optional(),
});

// Studio validation schema
export const StudioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  id: z.string().min(1, 'ID is required').max(50, 'ID must be less than 50 characters'),
  view: z.string().optional(),
  roomGrade: z.string().optional(),
  occupied: z.boolean().optional(),
  occupiedby: z.string().optional(),
});

// User validation schema
export const UserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'salesperson'], {
    errorMap: () => ({ message: 'Role must be admin, manager, or salesperson' })
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
    return { success: true, data: StudioSchema.parse(data) };
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
  if (typeof phone !== 'string') return '';
  return phone.replace(/[^\d\s\-+()]/g, ''); // Keep only digits, spaces, and phone symbols
}; 