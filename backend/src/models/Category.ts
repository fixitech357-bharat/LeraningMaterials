import { Schema, model, type Document, type Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
  parent?: Types.ObjectId | null;
  level: number;
  order: number;
  isFeatured: boolean;
  articleCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    icon: { type: String },
    color: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    level: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    articleCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1, order: 1 });
categorySchema.index({ slug: 1 });

export const Category = model<ICategory>('Category', categorySchema);