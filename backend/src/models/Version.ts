import mongoose, { Document, Schema } from 'mongoose';

export interface IVersion extends Document {
  documentId: mongoose.Types.ObjectId;
  versionNumber: number;
  content: string;
  changedBy: mongoose.Types.ObjectId;
  changeDescription?:  string;
  createdAt:  Date;
}

const versionSchema = new Schema<IVersion>({
  documentId: {
    type: Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changeDescription: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for document versions
versionSchema.index({ documentId: 1, versionNumber: -1 });

export const Version = mongoose.model<IVersion>('Version', versionSchema);