import { Schema, model, type Document, type Types } from 'mongoose';

export interface IChapter extends Document {
  course: Types.ObjectId;
  title: string;
  slug: string;
  order: number;
  videoUrl?: string;
  videoDuration?: number;
  content: string;
  resources: {
    title: string;
    url: string;
    type: 'pdf' | 'code' | 'link' | 'video';
  }[];
  isFree: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chapterSchema = new Schema<IChapter>(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true },
    order: { type: Number, required: true },
    videoUrl: { type: String },
    videoDuration: { type: Number },
    content: { type: String, default: '' },
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, enum: ['pdf', 'code', 'link', 'video'], default: 'link' },
      },
    ],
    isFree: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chapterSchema.index({ course: 1, order: 1 }, { unique: true });

export const Chapter = model<IChapter>('Chapter', chapterSchema);