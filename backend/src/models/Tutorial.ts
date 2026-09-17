import { Schema, model, type Document, type Types } from 'mongoose';

export interface ITutorial extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML sanitized
  coverImage?: string;
  category: Types.ObjectId;
  tags: string[];
  author: Types.ObjectId;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string; // programming language
  readingTime: number; // minutes
  views: number;
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  commentsCount: number;
  isPremium: boolean;
  isPublished: boolean;
  isApproved: boolean;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectedReason?: string;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  relatedTutorials: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const tutorialSchema = new Schema<ITutorial>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    excerpt: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true },
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
    language: { type: String, default: 'en', index: true },
    readingTime: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    commentsCount: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    isApproved: { type: Boolean, default: false, index: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedReason: { type: String },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    relatedTutorials: [{ type: Schema.Types.ObjectId, ref: 'Tutorial' }],
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

tutorialSchema.index({ title: 'text', content: 'text', tags: 'text' });
tutorialSchema.index({ category: 1, isPublished: 1, isApproved: 1 });
tutorialSchema.index({ author: 1, createdAt: -1 });
tutorialSchema.index({ views: -1 });
tutorialSchema.index({ createdAt: -1 });

tutorialSchema.virtual('comments', { ref: 'Comment', localField: '_id', foreignField: 'tutorial' });

tutorialSchema.pre('save', function (next) {
  if (this.isModified('content') && !this.readingTime) {
    const words = this.content.replace(/<[^>]*>/g, ' ').split(/\s+/).length;
    this.readingTime = Math.max(1, Math.ceil(words / 200));
  }
  next();
});

export const Tutorial = model<ITutorial>('Tutorial', tutorialSchema);