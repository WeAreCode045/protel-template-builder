import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email:  string;
  password: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required:  true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default:  'user'
  }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', userSchema);