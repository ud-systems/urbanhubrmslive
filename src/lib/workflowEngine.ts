import { Lead, Student, User } from '@/types';

export interface WorkflowTask {
  id: string;
  type: 'follow_up' | 'reminder' | 'conversion' | 'nurture' | 'cleanup';
  leadId?: number;
  studentId?: number;
  assignedTo?: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  createdAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'lead_created' | 'status_changed' | 'no_response' | 'conversion' | 'checkout';
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  priority: number;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: any;
}

export interface WorkflowAction {
  type: 'create_task' | 'send_email' | 'update_status' | 'assign_lead' | 'send_notification';
  params: Record<string, any>;
}

export class WorkflowEngine {
  private static readonly DEFAULT_RULES: WorkflowRule[] = [
    {
      id: 'new_lead_welcome',
      name: 'New Lead Welcome',
      trigger: 'lead_created',
      conditions: [
        { field: 'status', operator: 'equals', value: 'New' }
      ],
      actions: [
        {
          type: 'create_task',
          params: {
            type: 'follow_up',
            title: 'Welcome new lead',
            description: 'Send welcome email and schedule initial call',
            dueDate: '1_hour',
            priority: 'High'
          }
        }
      ],
      enabled: true,
      priority: 1
    },
    {
      id: 'hot_lead_followup',
      name: 'Hot Lead Follow-up',
      trigger: 'status_changed',
      conditions: [
        { field: 'status', operator: 'equals', value: 'Hot' }
      ],
      actions: [
        {
          type: 'create_task',
          params: {
            type: 'follow_up',
            title: 'Hot lead - immediate follow-up',
            description: 'Contact hot lead within 1 hour',
            dueDate: '1_hour',
            priority: 'High'
          }
        }
      ],
      enabled: true,
      priority: 1
    },
    {
      id: 'cold_lead_nurture',
      name: 'Cold Lead Nurturing',
      trigger: 'status_changed',
      conditions: [
        { field: 'status', operator: 'equals', value: 'Cold' }
      ],
      actions: [
        {
          type: 'create_task',
          params: {
            type: 'nurture',
            title: 'Re-engage cold lead',
            description: 'Send re-engagement email with special offer',
            dueDate: '3_days',
            priority: 'Medium'
          }
        }
      ],
      enabled: true,
      priority: 2
    },
    {
      id: 'no_response_reminder',
      name: 'No Response Reminder',
      trigger: 'no_response',
      conditions: [
        { field: 'last_contact', operator: 'less_than', value: '3_days' }
      ],
      actions: [
        {
          type: 'create_task',
          params: {
            type: 'reminder',
            title: 'Follow up - no response',
            description: 'Lead has not responded to previous contact',
            dueDate: '1_day',
            priority: 'Medium'
          }
        }
      ],
      enabled: true,
      priority: 2
    },
    {
      id: 'conversion_celebration',
      name: 'Lead Conversion Celebration',
      trigger: 'conversion',
      conditions: [
        { field: 'status', operator: 'equals', value: 'Converted' }
      ],
      actions: [
        {
          type: 'create_task',
          params: {
            type: 'conversion',
            title: 'Celebrate conversion',
            description: 'Send congratulations and onboarding information',
            dueDate: '1_hour',
            priority: 'High'
          }
        }
      ],
      enabled: true,
      priority: 1
    }
  ];

  static async processWorkflow(
    trigger: string,
    data: any,
    rules: WorkflowRule[] = this.DEFAULT_RULES
  ): Promise<WorkflowTask[]> {
    const triggeredTasks: WorkflowTask[] = [];

    // Filter rules by trigger
    const applicableRules = rules.filter(rule => 
      rule.enabled && rule.trigger === trigger
    );

    // Sort by priority
    applicableRules.sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      // Check conditions
      if (this.evaluateConditions(data, rule.conditions)) {
        // Execute actions
        const tasks = await this.executeActions(rule.actions, data);
        triggeredTasks.push(...tasks);
      }
    }

    return triggeredTasks;
  }

  private static evaluateConditions(data: any, conditions: WorkflowCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = data[condition.field];
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  private static async executeActions(
    actions: WorkflowAction[],
    data: any
  ): Promise<WorkflowTask[]> {
    const tasks: WorkflowTask[] = [];

    for (const action of actions) {
      switch (action.type) {
        case 'create_task':
          const task = await this.createTask(action.params, data);
          if (task) tasks.push(task);
          break;
        case 'send_email':
          await this.sendEmail(action.params, data);
          break;
        case 'update_status':
          await this.updateStatus(action.params, data);
          break;
        case 'assign_lead':
          await this.assignLead(action.params, data);
          break;
        case 'send_notification':
          await this.sendNotification(action.params, data);
          break;
      }
    }

    return tasks;
  }

  private static async createTask(
    params: Record<string, any>,
    data: any
  ): Promise<WorkflowTask> {
    const dueDate = this.calculateDueDate(params.dueDate);
    
    const task: WorkflowTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      leadId: data.id,
      assignedTo: data.assignedto,
      title: params.title,
      description: params.description,
      dueDate,
      priority: params.priority,
      status: 'Pending',
      createdAt: new Date()
    };

    // TODO: Save task to database
    console.log('Created task:', task);
    
    return task;
  }

  private static calculateDueDate(dueDateParam: string): Date {
    const now = new Date();
    
    switch (dueDateParam) {
      case '1_hour':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '1_day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '3_days':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case '1_week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 1 day
    }
  }

  private static async sendEmail(params: Record<string, any>, data: any): Promise<void> {
    // TODO: Implement email sending logic
    console.log('Sending email:', params, data);
  }

  private static async updateStatus(params: Record<string, any>, data: any): Promise<void> {
    // TODO: Implement status update logic
    console.log('Updating status:', params, data);
  }

  private static async assignLead(params: Record<string, any>, data: any): Promise<void> {
    // TODO: Implement lead assignment logic
    console.log('Assigning lead:', params, data);
  }

  private static async sendNotification(params: Record<string, any>, data: any): Promise<void> {
    // TODO: Implement notification logic
    console.log('Sending notification:', params, data);
  }

  static async getTasksForUser(userId: string): Promise<WorkflowTask[]> {
    // TODO: Fetch tasks from database
    return [];
  }

  static async getOverdueTasks(): Promise<WorkflowTask[]> {
    const now = new Date();
    // TODO: Fetch overdue tasks from database
    return [];
  }

  static async completeTask(taskId: string, notes?: string): Promise<void> {
    // TODO: Update task status in database
    console.log('Completing task:', taskId, notes);
  }

  static async createCustomRule(rule: WorkflowRule): Promise<void> {
    // TODO: Save custom rule to database
    console.log('Creating custom rule:', rule);
  }

  static async getWorkflowInsights(): Promise<{
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    averageCompletionTime: number;
    taskDistribution: Record<string, number>;
  }> {
    // TODO: Calculate workflow insights
    return {
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      averageCompletionTime: 0,
      taskDistribution: {}
    };
  }

  static async generateFollowUpSchedule(lead: Lead): Promise<WorkflowTask[]> {
    const tasks: WorkflowTask[] = [];
    const now = new Date();

    // Immediate follow-up (1 hour)
    tasks.push({
      id: `followup_1_${lead.id}`,
      type: 'follow_up',
      leadId: lead.id,
      assignedTo: lead.assignedto,
      title: 'Initial follow-up',
      description: 'Make initial contact with new lead',
      dueDate: new Date(now.getTime() + 60 * 60 * 1000),
      priority: 'High',
      status: 'Pending',
      createdAt: now
    });

    // 24-hour follow-up
    tasks.push({
      id: `followup_24_${lead.id}`,
      type: 'follow_up',
      leadId: lead.id,
      assignedTo: lead.assignedto,
      title: '24-hour follow-up',
      description: 'Follow up if no response received',
      dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      priority: 'Medium',
      status: 'Pending',
      createdAt: now
    });

    // 3-day nurture
    tasks.push({
      id: `nurture_3_${lead.id}`,
      type: 'nurture',
      leadId: lead.id,
      assignedTo: lead.assignedto,
      title: 'Nurture campaign',
      description: 'Send value-added content to nurture lead',
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      priority: 'Medium',
      status: 'Pending',
      createdAt: now
    });

    // 7-day final attempt
    tasks.push({
      id: `final_7_${lead.id}`,
      type: 'follow_up',
      leadId: lead.id,
      assignedTo: lead.assignedto,
      title: 'Final follow-up attempt',
      description: 'Final attempt to engage lead before marking as cold',
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      priority: 'Low',
      status: 'Pending',
      createdAt: now
    });

    return tasks;
  }
} 