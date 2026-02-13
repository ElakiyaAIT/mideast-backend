/**
 * Email Job Data Interface
 * Simple, lightweight interface for email queue jobs
 * No class-validator overhead - validation happens at API layer
 */
export interface EmailJobData {
  to: string;
  subject: string;
  templateName: string;
  templateVariables?: Record<string, string | number | boolean>;
  language?: string;
}
