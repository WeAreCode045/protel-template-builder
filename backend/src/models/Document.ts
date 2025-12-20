import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  name: string;
  originalFilename: string;
  content: string;
  userId: mongoose.Types.ObjectId;
  fileUrl: string;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types. ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl:  {
    type: String,
    required: true
  },
  currentVersion: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for user's documents
documentSchema.index({ userId: 1, createdAt: -1 });

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);