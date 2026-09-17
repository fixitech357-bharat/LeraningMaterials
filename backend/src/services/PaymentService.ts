import { Subscription, SubscriptionPlan, User, Role } from '@/models';
import { cacheDelPattern } from '@/utils/redis';

export class PaymentService {
  static async getPlans() {
    return SubscriptionPlan.find({ isActive: true }).sort({ price: 1 }).exec();
  }

  static async createOrder(userId: string, planId: string, coupon?: string) {
    const Razorpay = (await import('razorpay')).default;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) throw new Error('Plan not found');

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: plan.price * 100, // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { userId, planId },
    });

    return { order, plan };
  }

  static async verifyPayment(userId: string, razorpayPaymentId: string, razorpayOrderId: string, planId: string) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) throw new Error('Plan not found');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const subscription = await Subscription.create({
      user: userId,
      plan: planId,
      razorpaySubscriptionId: razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
      paymentHistory: [{
        paymentId: razorpayPaymentId,
        amount: plan.price,
        date: new Date(),
        status: 'paid',
      }],
    });

    // Update user role to premium
    const premiumRole = await Role.findOne({ slug: 'premium' });
    if (premiumRole) {
      user.role = premiumRole._id;
      await user.save();
    }

    await cacheDelPattern('user:*');
    return subscription;
  }

  static async getUserSubscription(userId: string) {
    return Subscription.findOne({ user: userId, status: 'active' })
      .populate('plan')
      .sort({ createdAt: -1 })
      .exec();
  }

  static async cancelSubscription(userId: string) {
    const subscription = await Subscription.findOne({ user: userId, status: 'active' });
    if (!subscription) throw new Error('No active subscription');

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.autoRenew = false;
    await subscription.save();

    // Downgrade to student role
    const user = await User.findById(userId);
    const studentRole = await Role.findOne({ slug: 'student' });
    if (user && studentRole) {
      user.role = studentRole._id;
      await user.save();
    }

    return subscription;
  }

  static async getRevenueStats() {
    const result = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $lookup: { from: 'subscriptionplans', localField: 'plan', foreignField: '_id', as: 'plan' } },
      { $unwind: '$plan' },
      { $group: { _id: null, totalRevenue: { $sum: '$plan.price' }, count: { $sum: 1 } } },
    ]);
    return result[0] || { totalRevenue: 0, count: 0 };
  }
}

export default PaymentService;