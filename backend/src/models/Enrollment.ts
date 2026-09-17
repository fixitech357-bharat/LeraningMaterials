import { Schema, model, type Document, type Types } from 'mongoose';

export interface IEnrollment extends Document {
  course: Types.ObjectId;
  user: Types.ObjectId;
  enrolledAt: Date;
  completedChapters: Types.ObjectId[];
  progress: number; // percentage
  completed: boolean;
  completedAt?: Date;
  lastAccessed?: Date;
  certificateIssued: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
    completedChapters: [{ type: Schema.Types.ObjectId, ref: 'Chapter' }],
    progress: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastAccessed: { type: Date },
    certificateIssued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

enrollmentSchema.index({ course: 1, user: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>('Enrollment', enrollmentSchema);