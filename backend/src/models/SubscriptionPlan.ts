import { Schema, model, type Document, type Types } from 'mongoose';

export interface ISubscriptionPlan extends Document {
  name: string;
  slug: 'free' | 'monthly' | 'quarterly' | 'yearly';
  price: number; // INR
  duration: number; // days
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ['free', 'monthly', 'quarterly', 'yearly'],
    },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // days
    features: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SubscriptionPlan = model<ISubscriptionPlan>('SubscriptionPlan', planSchema);