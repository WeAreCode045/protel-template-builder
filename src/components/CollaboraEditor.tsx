import React, { useEffect, useRef, useState } from 'react';

interface CollaboraEditorProps {
  file: File;
}

const CollaboraEditor: React.FC<CollaboraEditorProps> = ({ file }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [collaboraUrl, setCollaboraUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uploadAndInitialize = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Starting upload...');

        // Upload file to backend
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('http://localhost:3001/api/collabora/upload', {
          method: 'POST',
          body: formData,
          mode: 'cors',
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Upload failed: ${errorText}`);
        }

        const uploadData = await uploadResponse.json();
        console.log('Upload successful:', uploadData);
        setFileId(uploadData.fileId);

        // Get Collabora discovery info
        console.log('Fetching Collabora discovery...');
        const discoveryResponse = await fetch('http://localhost:3001/api/collabora/discovery', {
          mode: 'cors',
        });

        if (!discoveryResponse.ok) {
          throw new Error(`Discovery failed: ${discoveryResponse.statusText}`);
        }

        const discoveryData = await discoveryResponse.json();
        console.log('Discovery data received');

        // Use the discovery XML from backend (avoiding CORS issues)
        const discoveryXml = discoveryData.discoveryXml;
        console.log('Got discovery XML from backend, length:', discoveryXml.length);

        // Parse discovery XML to find ODT editor URL
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(discoveryXml, 'text/xml');
        
        // Try different selectors to find ODT editor
        let odtAction = xmlDoc.querySelector('app[name="writer"] action[ext="odt"][name="edit"]');
        
        if (!odtAction) {
          // Fallback: try without name attribute
          const actions = xmlDoc.querySelectorAll('action[ext="odt"][name="edit"]');
          if (actions.length > 0) {
            odtAction = actions[0];
          }
        }
        
        if (!odtAction) {
          console.error('Available actions:', xmlDoc.querySelectorAll('action'));
          throw new Error('ODT editor not found in Collabora discovery');
        }

        let urlsrc = odtAction.getAttribute('urlsrc');
        if (!urlsrc) {
          throw new Error('No URL found for ODT editor');
        }

        // Replace https with http since we're running locally without SSL
        urlsrc = urlsrc.replace('https://', 'http://');
        console.log('Editor URL template:', urlsrc);

        // Construct the Collabora frame URL
        // Use host.docker.internal so Collabora (running in Docker) can reach the host machine
        const wopiSrc = `http://host.docker.internal:3001/api/collabora/files/${uploadData.fileId}`;
        const frameUrl = urlsrc.replace('<WOPISrc>', encodeURIComponent(wopiSrc));
        
        console.log('Opening Collabora editor:', frameUrl);
        console.log('WOPI Source:', wopiSrc);
        setCollaboraUrl(frameUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing Collabora:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Collabora editor');
        setLoading(false);
      }
    };

    uploadAndInitialize();
  }, [file]);

  const handleDownload = async () => {
    if (!fileId) return;

    try {
      const response = await fetch(`http://localhost:3001/api/collabora/download/${fileId}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading Collabora Online editor...</p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Make sure Docker is running and Collabora CODE container is started.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: '#f44336' }}>Error Loading Editor</h3>
        <p>{error}</p>
        <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
          To use Collabora CODE, please run: <code>docker-compose up -d</code>
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Editing:</strong> {file.name}
        </div>
        <button 
          onClick={handleDownload}
          style={{
            padding: '8px 16px',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Download
        </button>
      </div>
      
      {collaboraUrl && (
        <iframe
          ref={iframeRef}
          src={collaboraUrl}
          style={{
            width: '100%',
            height: 'calc(100% - 50px)',
            border: 'none'
          }}
          title="Collabora Online Editor"
          allowFullScreen
        />
      )}
    </div>
  );
};

export default CollaboraEditor;
