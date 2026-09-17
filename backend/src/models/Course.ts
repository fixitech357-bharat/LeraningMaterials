import { Schema, model, type Document, type Types } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  category: Types.ObjectId;
  tags: string[];
  author: Types.ObjectId;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  price: number; // in INR
  isFree: boolean;
  isPremium: boolean;
  isPublished: boolean;
  isApproved: boolean;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  totalChapters: number;
  totalDuration: number; // minutes
  enrolledCount: number;
  rating: number;
  reviews: Types.ObjectId[];
  learningOutcomes: string[];
  requirements: string[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true, maxlength: 2000 },
    coverImage: { type: String },
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
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    isApproved: { type: Boolean, default: false, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    totalChapters: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0, index: true },
    rating: { type: Number, default: 0 },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    learningOutcomes: [String],
    requirements: [String],
    seo: {
      metaTitle: String,
      metaDescription: String,
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1, isPublished: 1 });
courseSchema.index({ author: 1, createdAt: -1 });
courseSchema.index({ enrolledCount: -1 });
courseSchema.index({ rating: -1 });

courseSchema.virtual('chapters', { ref: 'Chapter', localField: '_id', foreignField: 'course' });

export const Course = model<ICourse>('Course', courseSchema);