import { Request, Response } from 'express';
import { AuthRequest } from '@/utils/auth';
import { PaymentService } from '@/services/PaymentService';

export class PaymentController {
  static async getPlans(req: Request, res: Response) {
    try {
      const plans = await PaymentService.getPlans();
      res.json({ success: true, data: plans });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch plans' });
    }
  }

  static async createOrder(req: AuthRequest, res: Response) {
    try {
      const { planId, coupon } = req.body;
      const result = await PaymentService.createOrder(req.user!._id, planId, coupon);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async verifyPayment(req: AuthRequest, res: Response) {
    try {
      const { razorpayPaymentId, razorpayOrderId, planId } = req.body;
      const subscription = await PaymentService.verifyPayment(req.user!._id, razorpayPaymentId, razorpayOrderId, planId);
      res.json({ success: true, data: subscription });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getSubscription(req: AuthRequest, res: Response) {
    try {
      const subscription = await PaymentService.getUserSubscription(req.user!._id);
      res.json({ success: true, data: subscription });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
    }
  }

  static async cancel(req: AuthRequest, res: Response) {
    try {
      const subscription = await PaymentService.cancelSubscription(req.user!._id);
      res.json({ success: true, data: subscription });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async webhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const body = JSON.stringify(req.body);
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        res.status(400).json({ success: false, message: 'Invalid signature' });
        return;
      }

      const { event, payload } = req.body;
      // Handle webhook events
      res.json({ success: true, received: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Webhook failed' });
    }
  }
}