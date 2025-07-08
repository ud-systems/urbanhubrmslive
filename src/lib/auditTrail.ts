import { supabase } from './supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

export interface AuditLog {
  id: number;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: any;
  new_data?: any;
  user_id: string;
  user_email: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditFilter {
  table_name?: string;
  action?: string;
  user_id?: string;
  date_from?: Date;
  date_to?: Date;
  record_id?: string;
}

export class AuditTrail {
  static async getAuditLogs(filters: AuditFilter = {}, page = 1, limit = 50): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.record_id) {
      query = query.eq('record_id', filters.record_id);
    }
    if (filters.date_from) {
      query = query.gte('timestamp', filters.date_from.toISOString());
    }
    if (filters.date_to) {
      query = query.lte('timestamp', filters.date_to.toISOString());
    }

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    query = query.range(start, end);

    // Order by timestamp descending
    query = query.order('timestamp', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data || [],
      total,
      page,
      totalPages
    };
  }

  static async getRecordHistory(tableName: string, recordId: string): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch record history: ${error.message}`);
    }

    return data || [];
  }

  static async getUserActivity(userId: string, days = 30): Promise<AuditLog[]> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', dateFrom.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user activity: ${error.message}`);
    }

    return data || [];
  }

  static async getSystemActivity(days = 7): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsByUser: Record<string, number>;
    actionsByTable: Record<string, number>;
  }> {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('timestamp', dateFrom.toISOString());

    if (error) {
      throw new Error(`Failed to fetch system activity: ${error.message}`);
    }

    const logs = data || [];
    
    const actionsByType = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actionsByUser = logs.reduce((acc, log) => {
      acc[log.user_email] = (acc[log.user_email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actionsByTable = logs.reduce((acc, log) => {
      acc[log.table_name] = (acc[log.table_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActions: logs.length,
      actionsByType,
      actionsByUser,
      actionsByTable
    };
  }

  static async exportAuditLogs(filters: AuditFilter = {}): Promise<string> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*');

    if (error) {
      throw new Error(`Failed to export audit logs: ${error.message}`);
    }

    // Convert to CSV format
    const csvHeaders = [
      'ID',
      'Table Name',
      'Record ID',
      'Action',
      'User Email',
      'Timestamp',
      'Old Data',
      'New Data'
    ];

    const csvRows = (data || []).map(log => [
      log.id,
      log.table_name,
      log.record_id,
      log.action,
      log.user_email,
      log.timestamp,
      JSON.stringify(log.old_data || {}),
      JSON.stringify(log.new_data || {})
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}

// React hook for audit trail
export const useAuditTrail = () => {
  const { user } = useAuth();

  const getAuditLogs = async (filters: AuditFilter = {}, page = 1, limit = 50) => {
    return AuditTrail.getAuditLogs(filters, page, limit);
  };

  const getRecordHistory = async (tableName: string, recordId: string) => {
    return AuditTrail.getRecordHistory(tableName, recordId);
  };

  const getUserActivity = async (days = 30) => {
    if (!user) return [];
    return AuditTrail.getUserActivity(user.id, days);
  };

  const getSystemActivity = async (days = 7) => {
    return AuditTrail.getSystemActivity(days);
  };

  const exportAuditLogs = async (filters: AuditFilter = {}) => {
    return AuditTrail.exportAuditLogs(filters);
  };

  return {
    getAuditLogs,
    getRecordHistory,
    getUserActivity,
    getSystemActivity,
    exportAuditLogs
  };
}; 