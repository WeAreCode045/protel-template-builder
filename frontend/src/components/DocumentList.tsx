import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Calendar, Plus } from 'lucide-react';
import { documentService } from '../services/apiService';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface DocumentListProps {
  onSelectDocument: (document: any) => void;
  onNewDocument: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ onSelectDocument, onNewDocument }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await documentService. getAll();
      setDocuments(data.documents);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (doc: any) => {
    setSelectedId(doc._id);
    onSelectDocument(doc);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (! confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentService.delete(id);
      setDocuments(docs => docs.filter(d => d._id !== id));
      toast.success('Document deleted');
      if (selectedId === id) {
        setSelectedId(null);
      }
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="document-list p-4">
        <div className="text-center text-gray-500">Loading documents...</div>
      </div>
    );
  }

  return (
    <div className="document-list">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">My Documents</h3>
          <button
            onClick={onNewDocument}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 150px)' }}>
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No documents yet</p>
            <p className="text-sm mt-1">Upload an ODT file to get started</p>
          </div>
        ) : (
          <div className="divide-y">
            {documents. map((doc) => (
              <div
                key={doc._id}
                onClick={() => handleSelect(doc)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedId === doc._id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <h4 className="font-medium truncate">{doc.name}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                      </span>
                      <span>v{doc.currentVersion}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDelete(doc._id, e)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;