import React from 'react';

interface PreviewProps {
  content: string;
}

const Preview: React.FC<PreviewProps> = ({ content }) => {
  return (
    <div className="preview-container">
      <div className="preview-content">
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordWrap: 'break-word',
          textAlign: 'left',
          padding: '20px',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          borderRadius: '4px',
          minHeight: '70vh',
          margin: 0
        }}>
          {content}
        </pre>
      </div>
    </div>
  );
};

export default Preview;
