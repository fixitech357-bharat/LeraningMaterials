import { Schema, model, type Document, type Types } from 'mongoose';

export interface IQuizAttempt extends Document {
  quiz: Types.ObjectId;
  user: Types.ObjectId;
  answers: {
    question: Types.ObjectId;
    selectedOption?: number;
    answer?: string;
    isCorrect: boolean;
    points: number;
  }[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeTaken: number; // seconds
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOption: Number,
        answer: String,
        isCorrect: { type: Boolean, default: false },
        points: { type: Number, default: 0 },
      },
    ],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    timeTaken: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quiz: 1, user: 1, createdAt: -1 });

export const QuizAttempt = model<IQuizAttempt>('QuizAttempt', quizAttemptSchema);