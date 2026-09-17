import { Schema, model, type Document, type Types } from 'mongoose';

export interface ISubscription extends Document {
  user: Types.ObjectId;
  plan: Types.ObjectId;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelledAt?: Date;
  autoRenew: boolean;
  paymentHistory: {
    paymentId: string;
    amount: number;
    date: Date;
    status: 'paid' | 'failed';
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plan: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    razorpaySubscriptionId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial'],
      default: 'trial',
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelledAt: { type: Date },
    autoRenew: { type: Boolean, default: true },
    paymentHistory: [
      {
        paymentId: String,
        amount: Number,
        date: Date,
        status: { type: String, enum: ['paid', 'failed'] },
      },
    ],
  },
  { timestamps: true }
);

subscriptionSchema.index({ user: 1, status: 1 });

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);