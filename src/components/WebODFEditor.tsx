import React, { useEffect, useRef, useState } from 'react';

interface WebODFEditorProps {
  file: File;
  onContentChange?: (content: string) => void;
}

const WebODFEditor: React.FC<WebODFEditorProps> = ({ file }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [docUrl, setDocUrl] = useState<string>('');
  
  useEffect(() => {
    if (!file) return;

    // Create a blob URL for the file
    const blob = new Blob([file], { type: 'application/vnd.oasis.opendocument.text' });
    const url = URL.createObjectURL(blob);
    setDocUrl(url);
    
    // Cleanup
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        marginBottom: '10px'
      }}>
        <p style={{ margin: 0, color: '#666' }}>
          <strong>File:</strong> {file.name}
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#888' }}>
          Note: This viewer shows the ODT file. For full editing capabilities, download and open in LibreOffice or Microsoft Word.
        </p>
        <div style={{ marginTop: '10px' }}>
          <a 
            href={docUrl} 
            download={file.name}
            style={{
              padding: '8px 16px',
              backgroundColor: '#646cff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            Download ODT File
          </a>
        </div>
      </div>
      
      {docUrl && (
        <iframe
          ref={iframeRef}
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + docUrl)}`}
          style={{
            width: '100%',
            height: 'calc(100% - 120px)',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          title="ODT Viewer"
        />
      )}
    </div>
  );
};

export default WebODFEditor;
