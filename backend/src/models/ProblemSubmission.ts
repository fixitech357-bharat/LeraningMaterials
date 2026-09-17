import { Schema, model, type Document, type Types } from 'mongoose';

export interface IProblemSubmission extends Document {
  problem: Types.ObjectId;
  user: Types.ObjectId;
  language: string;
  code: string;
  status: 'pending' | 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'compile_error';
  runtime?: number;
  memory?: number;
  passedTests: number;
  totalTests: number;
  submittedAt: Date;
  createdAt: Date;
}

const problemSubmissionSchema = new Schema<IProblemSubmission>(
  {
    problem: { type: Schema.Types.ObjectId, ref: 'CodingProblem', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'wrong_answer', 'time_limit', 'runtime_error', 'compile_error'],
      default: 'pending',
      index: true,
    },
    runtime: Number,
    memory: Number,
    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

problemSubmissionSchema.index({ problem: 1, user: 1, submittedAt: -1 });

export const ProblemSubmission = model<IProblemSubmission>('ProblemSubmission', problemSubmissionSchema);