import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from '@/utils/redis';
import { logger } from '@/utils/logger';

let emailQueue: Queue | null = null;
let pdfQueue: Queue | null = null;

export const getQueue = (name: string): Queue | null => {
  const client = getRedisClient();
  if (!client) return null;
  return new Queue(name, { connection: client.duplicate() });
};

export const initializeQueues = () => {
  const client = getRedisClient();
  if (!client) {
    logger.warn('Redis not available, queues disabled');
    return { emailQueue: null, pdfQueue: null };
  }

  emailQueue = getQueue('email');
  pdfQueue = getQueue('pdf');

  // Email worker
  new Worker(
    'email',
    async (job: Job) => {
      const { to, subject, html } = job.data;
      const { sendEmail } = await import('@/utils/email');
      return sendEmail(to, subject, html);
    },
    { connection: client.duplicate(), concurrency: 5 }
  );

  // PDF worker
  new Worker(
    'pdf',
    async (job: Job) => {
      const { type, data } = job.data;
      const { generateCertificatePDF, generatePDF } = await import('@/utils/pdf');
      if (type === 'certificate') return generateCertificatePDF(data);
      return generatePDF(data);
    },
    { connection: client.duplicate(), concurrency: 2 }
  );

  return { emailQueue, pdfQueue };
};

export const addEmailJob = async (data: any) => {
  if (!emailQueue) return;
  await emailQueue.add('send', data, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
};

export const addPDFJob = async (data: any) => {
  if (!pdfQueue) return;
  await pdfQueue.add('generate', data, { attempts: 2 });
};

export { emailQueue, pdfQueue };