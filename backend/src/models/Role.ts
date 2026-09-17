import { Schema, model, type Document, type Types } from 'mongoose';

export interface IRole extends Document {
  name: string;
  slug: 'guest' | 'student' | 'premium' | 'instructor' | 'moderator' | 'admin';
  permissions: string[];
  description: string;
  price: number; // monthly price in INR, 0 for free
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      enum: ['guest', 'student', 'premium', 'instructor', 'moderator', 'admin'],
    },
    permissions: [{ type: String }],
    description: { type: String, default: '' },
    price: { type: Number, default: 0 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Role = model<IRole>('Role', roleSchema);