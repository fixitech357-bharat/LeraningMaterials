import { Schema, model, type Document, type Types } from 'mongoose';

export interface IInterviewExperience extends Document {
  title: string;
  slug: string;
  company: string;
  role: string;
  experienceType: 'offcampus' | 'oncampus' | 'referral' | 'internship';
  difficulty: 'easy' | 'medium' | 'hard';
  author: Types.ObjectId;
  content: string;
  tags: string[];
  rounds: {
    name: string;
    description: string;
    type: 'coding' | 'technical' | 'hr' | 'managerial' | 'system_design';
  }[];
  tips: string[];
  resources: string[];
  salary?: string;
  views: number;
  likes: Types.ObjectId[];
  commentsCount: number;
  isPublished: boolean;
  isApproved: boolean;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const interviewSchema = new Schema<IInterviewExperience>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    company: { type: String, required: true, trim: true, index: true },
    role: { type: String, required: true, trim: true },
    experienceType: {
      type: String,
      enum: ['offcampus', 'oncampus', 'referral', 'internship'],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    tags: [{ type: String, lowercase: true, index: true }],
    rounds: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        type: {
          type: String,
          enum: ['coding', 'technical', 'hr', 'managerial', 'system_design'],
        },
      },
    ],
    tips: [String],
    resources: [String],
    salary: { type: String },
    views: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    commentsCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false, index: true },
    isApproved: { type: Boolean, default: false, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

interviewSchema.index({ company: 1, isPublished: 1 });
interviewSchema.index({ tags: 1 });
interviewSchema.index({ views: -1 });

export const InterviewExperience = model<IInterviewExperience>('InterviewExperience', interviewSchema);