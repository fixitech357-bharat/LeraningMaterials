import { Schema, model, type Document, type Types } from 'mongoose';

export interface IComment extends Document {
  tutorial?: Types.ObjectId;
  course?: Types.ObjectId;
  user: Types.ObjectId;
  parent?: Types.ObjectId | null;
  content: string;
  likes: Types.ObjectId[];
  dislikes: Types.ObjectId[];
  isApproved: boolean;
  isEdited: boolean;
  isReported: boolean;
  reportReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    tutorial: { type: Schema.Types.ObjectId, ref: 'Tutorial' },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    content: { type: String, required: true, maxlength: 2000 },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    dislikes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isApproved: { type: Boolean, default: true, index: true },
    isEdited: { type: Boolean, default: false },
    isReported: { type: Boolean, default: false, index: true },
    reportReason: { type: String },
  },
  { timestamps: true }
);

commentSchema.index({ tutorial: 1, createdAt: -1 });
commentSchema.index({ parent: 1 });

export const Comment = model<IComment>('Comment', commentSchema);