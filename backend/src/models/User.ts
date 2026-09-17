import { Schema, model, type Document, type Types } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  role: Types.ObjectId; // Role ref
  slug: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  status: 'active' | 'banned' | 'suspended';
  streak: number;
  lastStreakUpdate?: Date;
  xp: number;
  level: number;
  badges: Types.ObjectId[];
  bookmarks: Types.ObjectId[];
  followers: Types.ObjectId[];
  following: Types.ObjectId[];
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  socialLinks: {
    website?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  comparePassword: (password: string) => Promise<boolean>;
  hashPassword: (password: string) => Promise<string>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    role: { type: Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
    slug: { type: String, unique: true, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    status: {
      type: String,
      enum: ['active', 'banned', 'suspended'],
      default: 'active',
      index: true,
    },
    streak: { type: Number, default: 0 },
    lastStreakUpdate: { type: Date },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
    bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Tutorial' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      language: { type: String, default: 'en' },
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
    },
    socialLinks: {
      website: String,
      twitter: String,
      github: String,
      linkedin: String,
    },
    lastLogin: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.pre('save', async function (next) {
  if (!this.slug) {
    this.slug = `${this.displayName.toLowerCase().replace(/\s+/g, '-')}-${this._id.toString().slice(-6)}`;
  }
  next();
});

userSchema.methods.hashPassword = async function (password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, this.password);
};

userSchema.virtual('articles', { ref: 'Tutorial', localField: '_id', foreignField: 'author' });
userSchema.virtual('courses', { ref: 'Course', localField: '_id', foreignField: 'author' });
userSchema.virtual('quizzes', { ref: 'Quiz', localField: '_id', foreignField: 'author' });

export const User = model<IUser>('User', userSchema);