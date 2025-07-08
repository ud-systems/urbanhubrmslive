import { Lead } from '@/types';

export interface LeadScore {
  leadId: number;
  score: number;
  factors: ScoringFactor[];
  priority: 'High' | 'Medium' | 'Low';
  recommendations: string[];
}

export interface ScoringFactor {
  factor: string;
  weight: number;
  score: number;
  reason: string;
}

export interface ScoringRule {
  field: string;
  condition: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
  weight: number;
  description: string;
}

export class LeadScoring {
  private static readonly SCORING_RULES: ScoringRule[] = [
    // Source-based scoring
    {
      field: 'source',
      condition: 'equals',
      value: 'Direct',
      weight: 10,
      description: 'Direct inquiries are highly valuable'
    },
    {
      field: 'source',
      condition: 'equals',
      value: 'Website',
      weight: 8,
      description: 'Website leads show high intent'
    },
    {
      field: 'source',
      condition: 'equals',
      value: 'Social Media',
      weight: 6,
      description: 'Social media leads have moderate value'
    },
    {
      field: 'source',
      condition: 'equals',
      value: 'Cold Call',
      weight: 4,
      description: 'Cold calls require more nurturing'
    },

    // Status-based scoring
    {
      field: 'status',
      condition: 'equals',
      value: 'Hot',
      weight: 15,
      description: 'Hot leads are ready to convert'
    },
    {
      field: 'status',
      condition: 'equals',
      value: 'New',
      weight: 5,
      description: 'New leads need qualification'
    },
    {
      field: 'status',
      condition: 'equals',
      value: 'Cold',
      weight: 2,
      description: 'Cold leads need re-engagement'
    },

    // Response category scoring
    {
      field: 'responsecategory',
      condition: 'equals',
      value: 'Interested',
      weight: 12,
      description: 'Interested prospects are likely to convert'
    },
    {
      field: 'responsecategory',
      condition: 'equals',
      value: 'Requested Information',
      weight: 10,
      description: 'Information requests show engagement'
    },
    {
      field: 'responsecategory',
      condition: 'equals',
      value: 'Not Interested',
      weight: 1,
      description: 'Not interested leads have low priority'
    },

    // Follow-up stage scoring
    {
      field: 'followupstage',
      condition: 'equals',
      value: 'Ready to Book',
      weight: 20,
      description: 'Ready to book leads are highest priority'
    },
    {
      field: 'followupstage',
      condition: 'equals',
      value: 'Follow-up Required',
      weight: 8,
      description: 'Follow-up required leads need attention'
    },
    {
      field: 'followupstage',
      condition: 'equals',
      value: 'Initial Contact',
      weight: 5,
      description: 'Initial contact leads need nurturing'
    },

    // Revenue-based scoring
    {
      field: 'revenue',
      condition: 'greater_than',
      value: 1000,
      weight: 15,
      description: 'High-value leads get priority'
    },
    {
      field: 'revenue',
      condition: 'greater_than',
      value: 500,
      weight: 10,
      description: 'Medium-value leads are valuable'
    },

    // Room grade preference
    {
      field: 'roomgrade',
      condition: 'equals',
      value: 'Premium',
      weight: 8,
      description: 'Premium room preferences indicate budget'
    },
    {
      field: 'roomgrade',
      condition: 'equals',
      value: 'Deluxe',
      weight: 6,
      description: 'Deluxe preferences show quality focus'
    },

    // Duration preference
    {
      field: 'duration',
      condition: 'equals',
      value: 'Long-term',
      weight: 12,
      description: 'Long-term stays are more valuable'
    },
    {
      field: 'duration',
      condition: 'equals',
      value: 'Short-term',
      weight: 6,
      description: 'Short-term stays have moderate value'
    }
  ];

  static scoreLead(lead: Lead): LeadScore {
    const factors: ScoringFactor[] = [];
    let totalScore = 0;

    // Apply scoring rules
    this.SCORING_RULES.forEach(rule => {
      const fieldValue = lead[rule.field as keyof Lead];
      let matches = false;

      switch (rule.condition) {
        case 'equals':
          matches = fieldValue === rule.value;
          break;
        case 'contains':
          matches = String(fieldValue).includes(String(rule.value));
          break;
        case 'greater_than':
          matches = Number(fieldValue) > Number(rule.value);
          break;
        case 'less_than':
          matches = Number(fieldValue) < Number(rule.value);
          break;
        case 'in_range':
          const [min, max] = rule.value;
          matches = Number(fieldValue) >= min && Number(fieldValue) <= max;
          break;
      }

      if (matches) {
        factors.push({
          factor: rule.field,
          weight: rule.weight,
          score: rule.weight,
          reason: rule.description
        });
        totalScore += rule.weight;
      }
    });

    // Additional scoring factors
    const additionalFactors = this.calculateAdditionalFactors(lead);
    factors.push(...additionalFactors);
    totalScore += additionalFactors.reduce((sum, factor) => sum + factor.score, 0);

    // Determine priority
    const priority = this.determinePriority(totalScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(lead, factors, totalScore);

    return {
      leadId: lead.id,
      score: totalScore,
      factors,
      priority,
      recommendations
    };
  }

  private static calculateAdditionalFactors(lead: Lead): ScoringFactor[] {
    const factors: ScoringFactor[] = [];

    // Email quality scoring
    if (lead.email) {
      const emailScore = this.scoreEmailQuality(lead.email);
      if (emailScore > 0) {
        factors.push({
          factor: 'email_quality',
          weight: 5,
          score: emailScore,
          reason: 'Professional email address'
        });
      }
    }

    // Phone number quality
    if (lead.phone) {
      const phoneScore = this.scorePhoneQuality(lead.phone);
      if (phoneScore > 0) {
        factors.push({
          factor: 'phone_quality',
          weight: 3,
          score: phoneScore,
          reason: 'Valid phone number format'
        });
      }
    }

    // Completeness scoring
    const completenessScore = this.scoreCompleteness(lead);
    if (completenessScore > 0) {
      factors.push({
        factor: 'completeness',
        weight: 4,
        score: completenessScore,
        reason: 'Complete lead information'
      });
    }

    // Urgency scoring
    const urgencyScore = this.scoreUrgency(lead);
    if (urgencyScore > 0) {
      factors.push({
        factor: 'urgency',
        weight: 8,
        score: urgencyScore,
        reason: 'Urgent inquiry detected'
      });
    }

    return factors;
  }

  private static scoreEmailQuality(email: string): number {
    // Check for professional email domains
    const professionalDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = email.split('@')[1];
    
    if (professionalDomains.includes(domain)) {
      return 3;
    }
    
    // Check for business domains
    if (domain && !domain.includes('temp') && !domain.includes('test')) {
      return 5;
    }
    
    return 0;
  }

  private static scorePhoneQuality(phone: string): number {
    // Check for valid phone number format
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      return 3;
    }
    return 0;
  }

  private static scoreCompleteness(lead: Lead): number {
    let score = 0;
    const requiredFields = ['name', 'phone', 'email', 'source', 'status'];
    
    requiredFields.forEach(field => {
      if (lead[field as keyof Lead]) {
        score += 1;
      }
    });

    // Bonus for additional information
    if (lead.notes) score += 1;
    if (lead.roomgrade) score += 1;
    if (lead.duration) score += 1;
    if (lead.revenue) score += 1;

    return score;
  }

  private static scoreUrgency(lead: Lead): number {
    let score = 0;

    // Check for urgent keywords in notes
    if (lead.notes) {
      const urgentKeywords = ['urgent', 'asap', 'immediate', 'quick', 'fast', 'soon'];
      const lowerNotes = lead.notes.toLowerCase();
      
      urgentKeywords.forEach(keyword => {
        if (lowerNotes.includes(keyword)) {
          score += 2;
        }
      });
    }

    // Check for immediate availability requests
    if (lead.followupstage === 'Ready to Book') {
      score += 5;
    }

    return score;
  }

  private static determinePriority(score: number): 'High' | 'Medium' | 'Low' {
    if (score >= 50) return 'High';
    if (score >= 25) return 'Medium';
    return 'Low';
  }

  private static generateRecommendations(lead: Lead, factors: ScoringFactor[], score: number): string[] {
    const recommendations: string[] = [];

    // Low score recommendations
    if (score < 25) {
      recommendations.push('Lead needs immediate qualification');
      recommendations.push('Schedule follow-up call within 24 hours');
      recommendations.push('Send welcome email with additional information');
    }

    // Missing information recommendations
    if (!lead.email) {
      recommendations.push('Request email address for better communication');
    }
    if (!lead.roomgrade) {
      recommendations.push('Qualify room grade preferences');
    }
    if (!lead.duration) {
      recommendations.push('Determine stay duration requirements');
    }

    // High-value lead recommendations
    if (score >= 50) {
      recommendations.push('High-priority lead - assign to top performer');
      recommendations.push('Schedule immediate follow-up');
      recommendations.push('Prepare detailed proposal');
    }

    // Source-specific recommendations
    switch (lead.source) {
      case 'Cold Call':
        recommendations.push('Send follow-up email with value proposition');
        break;
      case 'Website':
        recommendations.push('Send personalized welcome sequence');
        break;
      case 'Social Media':
        recommendations.push('Engage on social media platform');
        break;
    }

    // Status-specific recommendations
    switch (lead.status) {
      case 'New':
        recommendations.push('Qualify lead within 24 hours');
        break;
      case 'Hot':
        recommendations.push('Move to booking stage immediately');
        break;
      case 'Cold':
        recommendations.push('Re-engage with new value proposition');
        break;
    }

    return recommendations;
  }

  static scoreMultipleLeads(leads: Lead[]): LeadScore[] {
    return leads.map(lead => this.scoreLead(lead))
      .sort((a, b) => b.score - a.score);
  }

  static getLeadInsights(leads: Lead[]): {
    averageScore: number;
    scoreDistribution: Record<string, number>;
    topFactors: string[];
    recommendations: string[];
  } {
    const scores = leads.map(lead => this.scoreLead(lead));
    const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
    const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

    // Score distribution
    const scoreDistribution = {
      'High Priority': scores.filter(s => s.priority === 'High').length,
      'Medium Priority': scores.filter(s => s.priority === 'Medium').length,
      'Low Priority': scores.filter(s => s.priority === 'Low').length
    };

    // Top factors
    const factorCounts = new Map<string, number>();
    scores.forEach(score => {
      score.factors.forEach(factor => {
        factorCounts.set(factor.reason, (factorCounts.get(factor.reason) || 0) + 1);
      });
    });

    const topFactors = Array.from(factorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason]) => reason);

    // General recommendations
    const recommendations = [];
    if (averageScore < 25) {
      recommendations.push('Overall lead quality is low. Review lead generation strategies.');
    }
    if (scoreDistribution['High Priority'] < scores.length * 0.2) {
      recommendations.push('Few high-priority leads. Focus on qualification process.');
    }
    if (scoreDistribution['Low Priority'] > scores.length * 0.5) {
      recommendations.push('Too many low-priority leads. Improve lead scoring criteria.');
    }

    return {
      averageScore,
      scoreDistribution,
      topFactors,
      recommendations
    };
  }
} 