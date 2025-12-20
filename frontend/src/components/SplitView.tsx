import { useState, useEffect } from 'react';

interface SplitViewProps {
  file: File;
}

const SplitView: React.FC<SplitViewProps> = ({ file }) => {
  const [fileId, setFileId] = useState<string | null>(null);
  const [collaboraUrl, setCollaboraUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uploadAndLoadEditor = async () => {
      try {
        // Upload file to backend
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/collabora/upload', {
          method: 'POST',
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadData = await uploadResponse.json();
        const uploadedFileId = uploadData.fileId;
        setFileId(uploadedFileId);

        // Get Collabora discovery info
        const discoveryResponse = await fetch('/api/collabora/discovery');
        if (!discoveryResponse.ok) {
          throw new Error('Failed to get Collabora discovery');
        }

        const discoveryData = await discoveryResponse.json();
        
        // Parse discovery XML to get editor URL
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(discoveryData.discoveryXml, 'text/xml');
        const actions = xmlDoc.getElementsByTagName('action');
        
        let editorUrl = null;
        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          const ext = action.getAttribute('ext');
          const name = action.getAttribute('name');
          if (ext === 'odt' && name === 'edit') {
            editorUrl = action.getAttribute('urlsrc');
            break;
          }
        }

        if (!editorUrl) {
          throw new Error('Could not find ODT editor in Collabora discovery');
        }

        // Build WOPI URL
        const wopiSrc = encodeURIComponent(`${window.location.origin}/api/collabora/files/${uploadedFileId}`);
        const fullUrl = `${editorUrl}?WOPISrc=${wopiSrc}`;
        
        setCollaboraUrl(fullUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error loading Collabora:', err);
        setError(err instanceof Error ? err.message : 'Failed to load editor');
        setLoading(false);
      }
    };

    uploadAndLoadEditor();
  }, [file]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading Collabora Online editor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
        <h3>Error</h3>
        <p>{error}</p>
        <p>Make sure Collabora Online is running on the backend.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #ccc', background: '#f5f5f5' }}>
        <strong>Document:</strong> {file.name} | <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
        {fileId && (
          <a 
            href={`/api/collabora/download/${fileId}`}
            style={{ marginLeft: '20px', color: '#0066cc' }}
            download
          >
            Download
          </a>
        )}
      </div>
      <iframe
        src={collaboraUrl || ''}
        style={{ flex: 1, border: 'none', width: '100%' }}
        title="Collabora Online Editor"
      />
    </div>
  );
};

export default SplitView;
