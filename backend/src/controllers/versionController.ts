import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Version } from '../models/Version.js';
import { DocumentModel } from '../models/Document.js';

export const versionController = {
  // Get version history for a document
  async getVersionHistory(req: AuthRequest, res: Response) {
    try {
      const { documentId } = req.params;

      // Verify document belongs to user
      const document = await DocumentModel.findOne({
        _id: documentId,
        userId:  req.user!.id
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const versions = await Version.find({ documentId })
        .populate('changedBy', 'name email')
        .sort({ versionNumber: -1 })
        .select('-content'); // Don't send full content in list

      res.json({ versions });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch version history' });
    }
  },

  // Get specific version content
  async getVersion(req: AuthRequest, res:  Response) {
    try {
      const { documentId, versionNumber } = req.params;

      // Verify document belongs to user
      const document = await DocumentModel.findOne({
        _id: documentId,
        userId: req.user! .id
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const version = await Version.findOne({
        documentId,
        versionNumber:  parseInt(versionNumber)
      }).populate('changedBy', 'name email');

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      res.json({ version });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch version' });
    }
  },

  // Restore a previous version
  async restoreVersion(req: AuthRequest, res: Response) {
    try {
      const { documentId, versionNumber } = req.params;

      // Verify document belongs to user
      const document = await DocumentModel. findOne({
        _id:  documentId,
        userId: req.user!.id
      });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const version = await Version.findOne({
        documentId,
        versionNumber: parseInt(versionNumber)
      });

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      // Update document with old version content
      document.currentVersion += 1;
      document.content = version.content;
      await document.save();

      // Create new version record
      await new Version({
        documentId:  document._id,
        versionNumber: document.currentVersion,
        content: version.content,
        changedBy: req.user!.id,
        changeDescription: `Restored from version ${versionNumber}`
      }).save();

      res.json({ document, message: 'Version restored successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to restore version' });
    }
  }
};