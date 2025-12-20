import mongoose, { Document, Schema } from 'mongoose';

export interface IPlaceholder extends Document {
  key: string;
  category: string;
  demoValue: string;
  description?: string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const placeholderSchema = new Schema<IPlaceholder>({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    // Format: category. field (e.g., user.name, company.address)
    match: /^[a-z]+\.[a-z]+(\.[a-z]+)*$/
  },
  category:  {
    type: String,
    required: true,
    trim: true
  },
  demoValue: {
    type:  String,
    required: true
  },
  description: {
    type: String
  },
  type: {
    type: String,
    enum: ['text', 'number', 'date', 'email', 'phone'],
    default:  'text'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster category queries
placeholderSchema.index({ category: 1 });

export const Placeholder = mongoose.model<IPlaceholder>('Placeholder', placeholderSchema);