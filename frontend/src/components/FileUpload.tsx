import React from 'react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Upload ODT File</h2>
      <input
        type="file"
        accept=".odt"
        onChange={handleFileChange}
        disabled={isLoading}
        style={{
          padding: '10px',
          marginTop: '20px',
          fontSize: '16px'
        }}
      />
      {isLoading && <p>Loading...</p>}
    </div>
  );
};

export default FileUpload;
