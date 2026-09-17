import { Router } from 'express';
import { PaymentController } from '@/controllers/PaymentController';
import { authMiddleware } from '@/utils/auth';

const router = Router();

router.get('/plans', PaymentController.getPlans);
router.post('/create-order', authMiddleware, PaymentController.createOrder);
router.post('/verify', authMiddleware, PaymentController.verifyPayment);
router.get('/subscription', authMiddleware, PaymentController.getSubscription);
router.post('/cancel', authMiddleware, PaymentController.cancel);
router.post('/webhook', PaymentController.webhook);

export default router;