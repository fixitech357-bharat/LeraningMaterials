import { logger } from '@/utils/logger';

export const generateCertificatePDF = async (data: any): Promise<string> => {
  // Mock PDF generation - in production use puppeteer or pdfmake
  const { v4: uuidv4 } = await import('uuid');
  const certificateId = uuidv4();
  logger.info('Certificate generated', { certificateId, ...data });
  return `/certificates/${certificateId}.pdf`;
};

export const generatePDF = async (data: any): Promise<string> => {
  const { v4: uuidv4 } = await import('uuid');
  const pdfId = uuidv4();
  logger.info('PDF generated', { pdfId, ...data });
  return `/pdfs/${pdfId}.pdf`;
};