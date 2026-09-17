import { Schema, model, type Document, type Types } from 'mongoose';

export interface IQuiz extends Document {
  title: string;
  slug: string;
  description: string;
  category: Types.ObjectId;
  tags: string[];
  author: Types.ObjectId;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  timeLimit: number; // minutes, 0 = no limit
  passingScore: number; // percentage
  maxAttempts: number; // 0 = unlimited
  isPremium: boolean;
  isPublished: boolean;
  isApproved: boolean;
  approvedBy?: Types.ObjectId;
  questions: Types.ObjectId[];
  totalPoints: number;
  attemptsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    tags: [{ type: String, lowercase: true, index: true }],
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    language: { type: String, default: 'en' },
    timeLimit: { type: Number, default: 0 },
    passingScore: { type: Number, default: 60 },
    maxAttempts: { type: Number, default: 3 },
    isPremium: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    isApproved: { type: Boolean, default: false, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    totalPoints: { type: Number, default: 0 },
    attemptsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

quizSchema.index({ category: 1, isPublished: 1 });
quizSchema.index({ author: 1, createdAt: -1 });

export const Quiz = model<IQuiz>('Quiz', quizSchema);