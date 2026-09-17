import { Schema, model, type Document, type Types } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: any;
  group: 'general' | 'seo' | 'ads' | 'email' | 'payment' | 'social' | 'maintenance';
  description?: string;
  updatedAt: Date;
  updatedBy?: Types.ObjectId;
}

const settingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    group: {
      type: String,
      enum: ['general', 'seo', 'ads', 'email', 'payment', 'social', 'maintenance'],
      default: 'general',
      index: true,
    },
    description: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Setting = model<ISetting>('Setting', settingSchema);