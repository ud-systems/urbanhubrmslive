import { Lead, Student, Studio, User } from '@/types';

export interface SearchFilters {
  // Text search
  query?: string;
  
  // Date ranges
  dateFrom?: Date;
  dateTo?: Date;
  
  // Status filters
  status?: string[];
  source?: string[];
  responseCategory?: string[];
  followUpStage?: string[];
  
  // Assignment filters
  assignedTo?: string[];
  roomGrade?: string[];
  duration?: string[];
  
  // Studio filters
  occupied?: boolean;
  view?: string[];
  
  // Revenue filters
  revenueMin?: number;
  revenueMax?: number;
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export class SearchEngine {
  private static normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  private static matchesText(item: any, query: string): boolean {
    if (!query) return true;
    
    const normalizedQuery = this.normalizeText(query);
    const searchableFields = [
      item.name,
      item.email,
      item.phone,
      item.notes,
      item.id?.toString()
    ].filter(Boolean);
    
    return searchableFields.some(field => 
      this.normalizeText(field).includes(normalizedQuery)
    );
  }

  private static matchesDateRange(item: any, dateFrom?: Date, dateTo?: Date): boolean {
    if (!dateFrom && !dateTo) return true;
    
    const itemDate = new Date(item.dateofinquiry || item.created_at);
    
    if (dateFrom && itemDate < dateFrom) return false;
    if (dateTo && itemDate > dateTo) return false;
    
    return true;
  }

  private static matchesArrayFilter(item: any, field: string, filterValues?: string[]): boolean {
    if (!filterValues || filterValues.length === 0) return true;
    return filterValues.includes(item[field]);
  }

  private static matchesRevenueRange(item: any, min?: number, max?: number): boolean {
    const revenue = parseFloat(item.revenue) || 0;
    
    if (min !== undefined && revenue < min) return false;
    if (max !== undefined && revenue > max) return false;
    
    return true;
  }

  static searchLeads(leads: Lead[], filters: SearchFilters): SearchResult<Lead> {
    let filtered = leads.filter(lead => {
      // Text search
      if (!this.matchesText(lead, filters.query)) return false;
      
      // Date range
      if (!this.matchesDateRange(lead, filters.dateFrom, filters.dateTo)) return false;
      
      // Status filters
      if (!this.matchesArrayFilter(lead, 'status', filters.status)) return false;
      if (!this.matchesArrayFilter(lead, 'source', filters.source)) return false;
      if (!this.matchesArrayFilter(lead, 'responsecategory', filters.responseCategory)) return false;
      if (!this.matchesArrayFilter(lead, 'followupstage', filters.followUpStage)) return false;
      if (!this.matchesArrayFilter(lead, 'assignedto', filters.assignedTo)) return false;
      if (!this.matchesArrayFilter(lead, 'roomgrade', filters.roomGrade)) return false;
      if (!this.matchesArrayFilter(lead, 'duration', filters.duration)) return false;
      
      // Revenue range
      if (!this.matchesRevenueRange(lead, filters.revenueMin, filters.revenueMax)) return false;
      
      return true;
    });

    // Sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof Lead];
        const bValue = b[filters.sortBy as keyof Lead];
        
        if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedData = filtered.slice(startIndex, endIndex);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedData,
      total,
      page,
      totalPages,
      hasMore: page < totalPages
    };
  }

  static searchStudents(students: Student[], filters: SearchFilters): SearchResult<Student> {
    let filtered = students.filter(student => {
      // Text search
      if (!this.matchesText(student, filters.query)) return false;
      
      // Date range
      if (!this.matchesDateRange(student, filters.dateFrom, filters.dateTo)) return false;
      
      // Assignment filters
      if (!this.matchesArrayFilter(student, 'assignedto', filters.assignedTo)) return false;
      if (!this.matchesArrayFilter(student, 'roomgrade', filters.roomGrade)) return false;
      if (!this.matchesArrayFilter(student, 'duration', filters.duration)) return false;
      
      // Revenue range
      if (!this.matchesRevenueRange(student, filters.revenueMin, filters.revenueMax)) return false;
      
      return true;
    });

    // Sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof Student];
        const bValue = b[filters.sortBy as keyof Student];
        
        if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedData = filtered.slice(startIndex, endIndex);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedData,
      total,
      page,
      totalPages,
      hasMore: page < totalPages
    };
  }

  static searchStudios(studios: Studio[], filters: SearchFilters): SearchResult<Studio> {
    let filtered = studios.filter(studio => {
      // Text search
      if (!this.matchesText(studio, filters.query)) return false;
      
      // Studio-specific filters
      if (filters.occupied !== undefined && studio.occupied !== filters.occupied) return false;
      if (!this.matchesArrayFilter(studio, 'roomGrade', filters.roomGrade)) return false;
      if (!this.matchesArrayFilter(studio, 'view', filters.view)) return false;
      
      return true;
    });

    // Sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof Studio];
        const bValue = b[filters.sortBy as keyof Studio];
        
        if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedData = filtered.slice(startIndex, endIndex);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: paginatedData,
      total,
      page,
      totalPages,
      hasMore: page < totalPages
    };
  }

  // Advanced search with multiple entity types
  static globalSearch(
    leads: Lead[], 
    students: Student[], 
    studios: Studio[], 
    filters: SearchFilters
  ): {
    leads: SearchResult<Lead>;
    students: SearchResult<Student>;
    studios: SearchResult<Studio>;
    total: number;
  } {
    const leadsResult = this.searchLeads(leads, filters);
    const studentsResult = this.searchStudents(students, filters);
    const studiosResult = this.searchStudios(studios, filters);

    return {
      leads: leadsResult,
      students: studentsResult,
      studios: studiosResult,
      total: leadsResult.total + studentsResult.total + studiosResult.total
    };
  }

  // Get search suggestions based on current data
  static getSearchSuggestions(
    leads: Lead[], 
    students: Student[], 
    studios: Studio[], 
    query: string
  ): string[] {
    if (!query || query.length < 2) return [];
    
    const suggestions = new Set<string>();
    const normalizedQuery = this.normalizeText(query);
    
    // Search in names
    [...leads, ...students, ...studios].forEach(item => {
      if (item.name && this.normalizeText(item.name).includes(normalizedQuery)) {
        suggestions.add(item.name);
      }
    });
    
    // Search in emails
    [...leads, ...students].forEach(item => {
      if (item.email && this.normalizeText(item.email).includes(normalizedQuery)) {
        suggestions.add(item.email);
      }
    });
    
    // Search in phone numbers
    [...leads, ...students].forEach(item => {
      if (item.phone && this.normalizeText(item.phone).includes(normalizedQuery)) {
        suggestions.add(item.phone);
      }
    });
    
    return Array.from(suggestions).slice(0, 10);
  }
} 