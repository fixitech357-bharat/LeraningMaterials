import { Schema, model, type Document, type Types } from 'mongoose';

export interface ICodingProblem extends Document {
  title: string;
  slug: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  category: Types.ObjectId;
  author: Types.ObjectId;
  languageSupport: string[];
  starterCode: {
    language: string;
    code: string;
  }[];
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }[];
  timeLimit: number; // ms
  memoryLimit: number; // MB
  submissionsCount: number;
  acceptanceRate: number;
  isPublished: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const codingProblemSchema = new Schema<ICodingProblem>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    constraints: { type: String, default: '' },
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
      index: true,
    },
    tags: [{ type: String, lowercase: true, index: true }],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    languageSupport: [{ type: String }],
    starterCode: [
      {
        language: String,
        code: String,
      },
    ],
    testCases: [
      {
        input: String,
        expectedOutput: String,
        isHidden: { type: Boolean, default: false },
      },
    ],
    timeLimit: { type: Number, default: 1000 },
    memoryLimit: { type: Number, default: 256 },
    submissionsCount: { type: Number, default: 0, index: true },
    acceptanceRate: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false, index: true },
    isApproved: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

codingProblemSchema.index({ difficulty: 1, isPublished: 1 });
codingProblemSchema.index({ tags: 1 });

export const CodingProblem = model<ICodingProblem>('CodingProblem', codingProblemSchema);