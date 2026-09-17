import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

let transporter: nodemailer.Transporter | null = null;

export const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter;
  if (!env.email.user || !env.email.pass) {
    logger.warn('Email credentials not configured, email sending disabled');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
  });

  return transporter;
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  const transport = getTransporter();
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: env.email.from,
      to,
      subject,
      html,
      text,
    });
    logger.info('Email sent', { to, subject });
    return true;
  } catch (error) {
    logger.error('Email send failed', { to, subject, error });
    return false;
  }
};

export const sendVerificationEmail = async (to: string, token: string): Promise<boolean> => {
  const url = `${env.frontendUrl}/verify-email?token=${token}`;
  return sendEmail(
    to,
    'Verify Your Email - Learning Platform',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3b82f6;">Verify Your Email</h2>
      <p>Thank you for registering! Please verify your email address by clicking the link below:</p>
      <a href="${url}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
      <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
      <p style="color: #666; font-size: 14px;">If you didn't create an account, you can ignore this email.</p>
    </div>
    `
  );
};

export const sendPasswordResetEmail = async (to: string, token: string): Promise<boolean> => {
  const url = `${env.frontendUrl}/reset-password?token=${token}`;
  return sendEmail(
    to,
    'Reset Your Password - Learning Platform',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3b82f6;">Reset Your Password</h2>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <a href="${url}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
      <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
      <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can ignore this email.</p>
    </div>
    `
  );
};

export const sendWelcomeEmail = async (to: string, name: string): Promise<boolean> => {
  return sendEmail(
    to,
    'Welcome to Learning Platform!',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3b82f6;">Welcome, ${name}!</h2>
      <p>Thank you for joining our learning community. We're excited to have you on board!</p>
      <p>Start your learning journey today with thousands of tutorials, courses, and quizzes.</p>
      <a href="${env.frontendUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Explore Now</a>
    </div>
    `
  );
};