import { supabase } from './supabaseClient';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | number;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
  changes?: Record<string, { old: any; new: any }>;
}

export interface AuditQuery {
  table_name?: string;
  record_id?: string | number;
  action?: string;
  user_id?: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
  offset?: number;
}

export class AuditTrail {
  private static isEnabled = true;

  static enable() {
    this.isEnabled = true;
  }

  static disable() {
    this.isEnabled = false;
  }

  static async log(
    tableName: string,
    recordId: string | number,
    action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT',
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const changes = this.calculateChanges(oldValues, newValues);
      
      const auditLog = {
        table_name: tableName,
        record_id: recordId.toString(),
        action,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        user_id: userId,
        user_email: await this.getUserEmail(userId),
        ip_address: this.getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        changes: changes ? JSON.stringify(changes) : null
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert([auditLog]);

      if (error) {
        console.error('❌ Failed to log audit trail:', error);
      } else {
        console.log('✅ Audit log created:', { tableName, recordId, action });
      }
    } catch (error) {
      console.error('❌ Audit trail error:', error);
    }
  }

  private static calculateChanges(
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Record<string, { old: any; new: any }> | null {
    if (!oldValues || !newValues) return null;

    const changes: Record<string, { old: any; new: any }> = {};
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      const oldValue = oldValues[key];
      const newValue = newValues[key];

      if (oldValue !== newValue) {
        changes[key] = { old: oldValue, new: newValue };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  private static async getUserEmail(userId?: string): Promise<string | null> {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to get user email:', error);
        return null;
      }

      return data?.email || null;
    } catch (error) {
      console.error('Error getting user email:', error);
      return null;
    }
  }

  private static getClientIP(): string | null {
    // In a real application, you'd get this from the server
    // For now, we'll return null as this is client-side
    return null;
  }

  static async query(query: AuditQuery): Promise<AuditLog[]> {
    try {
      let supabaseQuery = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (query.table_name) {
        supabaseQuery = supabaseQuery.eq('table_name', query.table_name);
      }

      if (query.record_id) {
        supabaseQuery = supabaseQuery.eq('record_id', query.record_id.toString());
      }

      if (query.action) {
        supabaseQuery = supabaseQuery.eq('action', query.action);
      }

      if (query.user_id) {
        supabaseQuery = supabaseQuery.eq('user_id', query.user_id);
      }

      if (query.start_date) {
        supabaseQuery = supabaseQuery.gte('timestamp', query.start_date.toISOString());
      }

      if (query.end_date) {
        supabaseQuery = supabaseQuery.lte('timestamp', query.end_date.toISOString());
      }

      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, query.offset + (query.limit || 50) - 1);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('❌ Failed to query audit logs:', error);
        return [];
      }

      return data?.map(log => ({
        id: log.id,
        table_name: log.table_name,
        record_id: log.record_id,
        action: log.action,
        old_values: log.old_values ? JSON.parse(log.old_values) : undefined,
        new_values: log.new_values ? JSON.parse(log.new_values) : undefined,
        user_id: log.user_id,
        user_email: log.user_email,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        timestamp: new Date(log.timestamp),
        changes: log.changes ? JSON.parse(log.changes) : undefined
      })) || [];
    } catch (error) {
      console.error('❌ Audit query error:', error);
      return [];
    }
  }

  static async getAuditSummary(): Promise<{
    totalLogs: number;
    logsToday: number;
    logsThisWeek: number;
    logsThisMonth: number;
    topTables: Array<{ table: string; count: number }>;
    topUsers: Array<{ user: string; count: number }>;
  }> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Get total logs
      const { count: totalLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Get logs today
      const { count: logsToday } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', today.toISOString());

      // Get logs this week
      const { count: logsThisWeek } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', weekAgo.toISOString());

      // Get logs this month
      const { count: logsThisMonth } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', monthAgo.toISOString());

      // Get top tables
      const { data: tableStats } = await supabase
        .from('audit_logs')
        .select('table_name')
        .gte('timestamp', monthAgo.toISOString());

      const tableCounts: Record<string, number> = {};
      tableStats?.forEach(log => {
        tableCounts[log.table_name] = (tableCounts[log.table_name] || 0) + 1;
      });

      const topTables = Object.entries(tableCounts)
        .map(([table, count]) => ({ table, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get top users
      const { data: userStats } = await supabase
        .from('audit_logs')
        .select('user_email')
        .gte('timestamp', monthAgo.toISOString())
        .not('user_email', 'is', null);

      const userCounts: Record<string, number> = {};
      userStats?.forEach(log => {
        if (log.user_email) {
          userCounts[log.user_email] = (userCounts[log.user_email] || 0) + 1;
        }
      });

      const topUsers = Object.entries(userCounts)
        .map(([user, count]) => ({ user, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalLogs: totalLogs || 0,
        logsToday: logsToday || 0,
        logsThisWeek: logsThisWeek || 0,
        logsThisMonth: logsThisMonth || 0,
        topTables,
        topUsers
      };
    } catch (error) {
      console.error('❌ Failed to get audit summary:', error);
      return {
        totalLogs: 0,
        logsToday: 0,
        logsThisWeek: 0,
        logsThisMonth: 0,
        topTables: [],
        topUsers: []
      };
    }
  }

  // Convenience methods for common operations
  static async logLeadCreated(leadId: number, leadData: any, userId?: string): Promise<void> {
    await this.log('leads', leadId, 'INSERT', undefined, leadData, userId);
  }

  static async logLeadUpdated(leadId: number, oldData: any, newData: any, userId?: string): Promise<void> {
    await this.log('leads', leadId, 'UPDATE', oldData, newData, userId);
  }

  static async logLeadDeleted(leadId: number, leadData: any, userId?: string): Promise<void> {
    await this.log('leads', leadId, 'DELETE', leadData, undefined, userId);
  }

  static async logStudentCreated(studentId: number, studentData: any, userId?: string): Promise<void> {
    await this.log('students', studentId, 'INSERT', undefined, studentData, userId);
  }

  static async logStudentUpdated(studentId: number, oldData: any, newData: any, userId?: string): Promise<void> {
    await this.log('students', studentId, 'UPDATE', oldData, newData, userId);
  }

  static async logStudentDeleted(studentId: number, studentData: any, userId?: string): Promise<void> {
    await this.log('students', studentId, 'DELETE', studentData, undefined, userId);
  }

  static async logStudioCreated(studioId: string, studioData: any, userId?: string): Promise<void> {
    await this.log('studios', studioId, 'INSERT', undefined, studioData, userId);
  }

  static async logStudioUpdated(studioId: string, oldData: any, newData: any, userId?: string): Promise<void> {
    await this.log('studios', studioId, 'UPDATE', oldData, newData, userId);
  }

  static async logStudioDeleted(studioId: string, studioData: any, userId?: string): Promise<void> {
    await this.log('studios', studioId, 'DELETE', studioData, undefined, userId);
  }
} 