import { Schema, model, type Document, type Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: 'comment' | 'reply' | 'like' | 'enrollment' | 'quiz' | 'badge' | 'payment' | 'system' | 'course_update';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  pushSent: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['comment', 'reply', 'like', 'enrollment', 'quiz', 'badge', 'payment', 'system', 'course_update'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    metadata: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    emailSent: { type: Boolean, default: false },
    pushSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);