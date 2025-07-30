import { supabase } from './supabaseClient';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  template?: string;
  variables?: Record<string, any>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

class EmailService {
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private static isValidEmail(email: string): boolean {
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
  }

  private initializeTemplates() {
    // Default email templates
    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to UrbanHub Student Accommodation',
        body: `
          <h2>Welcome to UrbanHub!</h2>
          <p>Dear {{name}},</p>
          <p>Welcome to UrbanHub Student Accommodation. We're excited to have you as part of our community!</p>
          <p>Your account has been created successfully with the following details:</p>
          <ul>
            <li><strong>Email:</strong> {{email}}</li>
            <li><strong>Default Password:</strong> {{password}}</li>
          </ul>
          <p>Please log in and complete your profile to get started.</p>
          <p>Best regards,<br>The UrbanHub Team</p>
        `,
        variables: ['name', 'email', 'password']
      },
      {
        id: 'follow_up',
        name: 'Follow-up Email',
        subject: 'Following up on your accommodation inquiry',
        body: `
          <h2>Following up on your inquiry</h2>
          <p>Dear {{name}},</p>
          <p>We hope this email finds you well. We're following up on your recent inquiry about student accommodation at UrbanHub.</p>
          <p>We have several options available that might interest you:</p>
          <ul>
            <li>Studio apartments starting from £{{price}}/week</li>
            <li>Various room grades: {{grades}}</li>
            <li>Flexible duration options</li>
          </ul>
          <p>Would you like to schedule a viewing or discuss your requirements further?</p>
          <p>Best regards,<br>The UrbanHub Team</p>
        `,
        variables: ['name', 'price', 'grades']
      },
      {
        id: 'application_submitted',
        name: 'Application Submitted',
        subject: 'Your student application has been submitted',
        body: `
          <h2>Application Submitted Successfully</h2>
          <p>Dear {{name}},</p>
          <p>Thank you for submitting your student application to UrbanHub.</p>
          <p>Your application is now under review. We'll contact you within 48 hours with next steps.</p>
          <p><strong>Application Reference:</strong> {{reference}}</p>
          <p>Best regards,<br>The UrbanHub Team</p>
        `,
        variables: ['name', 'reference']
      },
      {
        id: 'document_approved',
        name: 'Document Approved',
        subject: 'Your document has been approved',
        body: `
          <h2>Document Approval</h2>
          <p>Dear {{name}},</p>
          <p>Great news! Your {{document_type}} has been approved.</p>
          <p>You can continue with your application process.</p>
          <p>Best regards,<br>The UrbanHub Team</p>
        `,
        variables: ['name', 'document_type']
      },
      {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        subject: 'Payment reminder for your accommodation',
        body: `
          <h2>Payment Reminder</h2>
          <p>Dear {{name}},</p>
          <p>This is a friendly reminder that your payment of £{{amount}} is due on {{due_date}}.</p>
          <p>Please ensure payment is made to avoid any late fees.</p>
          <p>Best regards,<br>The UrbanHub Team</p>
        `,
        variables: ['name', 'amount', 'due_date']
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private replaceVariables(template: string, data: Record<string, any>): string {
    let result = template;
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    });
    return result;
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Validate email before sending
      if (!EmailService.isValidEmail(emailData.to)) {
        console.warn('⚠️ Invalid email address, skipping send:', emailData.to);
        return false;
      }

      // Use Supabase Edge Function for email sending
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          template: emailData.template,
          variables: emailData.variables
        }
      });

      if (error) {
        console.error('Email sending failed:', error);
        return false;
      }

      console.log('✅ Email sent successfully:', { to: emailData.to, subject: emailData.subject });
      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  async sendTemplateEmail(
    templateId: string,
    to: string,
    variables: Record<string, any>
  ): Promise<boolean> {
    const template = this.templates.get(templateId);
    if (!template) {
      console.error(`❌ Template not found: ${templateId}`);
      return false;
    }

    const subject = this.replaceVariables(template.subject, variables);
    const body = this.replaceVariables(template.body, variables);

    return await this.sendEmail({
      to,
      subject,
      body,
      template: templateId,
      variables
    });
  }

  async sendBulkEmail(emails: EmailData[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const email of emails) {
      const result = await this.sendEmail(email);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return Array.from(this.templates.values());
  }

  async addTemplate(template: EmailTemplate): Promise<void> {
    this.templates.set(template.id, template);
  }

  async removeTemplate(templateId: string): Promise<void> {
    this.templates.delete(templateId);
  }
}

// Export singleton instance
export const emailService = new EmailService(); 