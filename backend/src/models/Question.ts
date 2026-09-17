import { Schema, model, type Document, type Types } from 'mongoose';

export interface IQuestion extends Document {
  quiz: Types.ObjectId;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'code';
  options: {
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
  explanation: string;
  code?: string;
  language?: string;
  points: number;
  order: number;
  createdAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    question: { type: String, required: true, maxlength: 1000 },
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'fill_blank', 'code'],
      default: 'multiple_choice',
    },
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        explanation: { type: String },
      },
    ],
    explanation: { type: String, default: '' },
    code: { type: String },
    language: { type: String },
    points: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

questionSchema.index({ quiz: 1, order: 1 });

export const Question = model<IQuestion>('Question', questionSchema);