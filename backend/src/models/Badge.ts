import { Schema, model, type Document, type Types } from 'mongoose';

export interface IBadge extends Document {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  type: 'streak' | 'quiz' | 'course' | 'social' | 'special';
  criteria: {
    type: string;
    value: number;
    field?: string;
  };
  createdAt: Date;
}

const badgeSchema = new Schema<IBadge>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, default: '#3b82f6' },
    type: {
      type: String,
      enum: ['streak', 'quiz', 'course', 'social', 'special'],
      required: true,
      index: true,
    },
    criteria: {
      type: { type: String, required: true },
      value: { type: Number, required: true },
      field: { type: String },
    },
  },
  { timestamps: true }
);

export const Badge = model<IBadge>('Badge', badgeSchema);