import React from 'react';
import { createODT } from '../utils/odtParser';

interface DownloadButtonProps {
  content: string;
  filename: string;
  originalFile?: ArrayBuffer;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ content, filename, originalFile }) => {
  const handleDownload = async () => {
    try {
      if (originalFile) {
        const blob = await createODT(content, originalFile);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.replace('.odt', '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Check console for details.');
    }
  };

  return (
    <button 
      onClick={handleDownload}
      style={{
        padding: '10px 20px',
        backgroundColor: '#646cff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      Download ODT
    </button>
  );
};

export default DownloadButton;
