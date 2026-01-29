import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email?: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'suespend';
  visitorId: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      default: null,
      index: {
        unique: true,
        sparse: true
      }
    },
    password: {
      type: String,
      required: true,
      default : '123456',
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'moderator'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suespend'],
      default: 'active',
    },
    visitorId: {
      type: String,
      default: null
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
