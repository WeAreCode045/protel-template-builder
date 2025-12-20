import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { DocumentModel } from '../models/Document. js';
import { Version } from '../models/Version.js';
import fs from 'fs/promises';
import path from 'path';

export const documentController = {
  // Get all documents for current user
  async getUserDocuments(req: AuthRequest, res: Response) {
    try {
      const documents = await DocumentModel.find({ userId: req. user!.id })
        .select('-content')
        .sort({ updatedAt: -1 });

      res.json({ documents });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  },

  // Get single document
  async getDocument(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const document = await DocumentModel. findOne({
        _id: id,
        userId: req.user! .id
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({ document });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  },

  // Upload new document
  async uploadDocument(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { name, content } = req.body;

      const document = new DocumentModel({
        name:  name || req.file.originalname,
        originalFilename: req.file.originalname,
        content,
        userId: req.user! .id,
        fileUrl: `/uploads/${req.file.filename}`,
        currentVersion: 1
      });

      await document. save();

      // Create initial version
      await new Version({
        documentId: document._id,
        versionNumber: 1,
        content,
        changedBy: req. user!.id,
        changeDescription: 'Initial upload'
      }).save();

      res.status(201).json({ document });
    } catch (error:  any) {
      res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
  },

  // Update document content
  async updateDocument(req:  AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { content, changeDescription } = req.body;

      const document = await DocumentModel. findOne({
        _id: id,
        userId: req.user! .id
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Increment version
      document.currentVersion += 1;
      document.content = content;
      await document.save();

      // Create version record
      await new Version({
        documentId: document._id,
        versionNumber: document.currentVersion,
        content,
        changedBy: req.user! .id,
        changeDescription: changeDescription || 'Document updated'
      }).save();

      res.json({ document });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update document' });
    }
  },

  // Delete document
  async deleteDocument(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const document = await DocumentModel.findOneAndDelete({
        _id:  id,
        userId: req. user!.id
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete all versions
      await Version. deleteMany({ documentId: id });

      // Delete file from disk
      try {
        await fs.unlink(path.join(process.cwd(), 'uploads', path.basename(document.fileUrl)));
      } catch (error) {
        console.error('Failed to delete file:', error);
      }

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }
};