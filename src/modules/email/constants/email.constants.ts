/**
 * Email Queue Configuration
 * Central place for all email queue-related constants
 */

export const EMAIL_QUEUE = 'email-queue';

export const EMAIL_JOBS = {
  SEND_EMAIL: 'send-email',
} as const;

/**
 * Queue retry configuration for production-grade reliability
 */
export const EMAIL_QUEUE_OPTIONS = {
  attempts: 3, // Retry failed jobs 3 times
  backoff: {
    type: 'exponential' as const,
    delay: 2000, // Start with 2 seconds, then 4s, 8s...
  },
  removeOnComplete: {
    age: 24 * 3600, // Keep completed jobs for 24 hours
    count: 1000, // Keep max 1000 completed jobs
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // Keep failed jobs for 7 days for debugging
  },
};
