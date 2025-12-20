import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file. name.endsWith('.odt')) {
        onFileUpload(file);
      } else {
        alert('Please upload a .odt file');
      }
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.oasis.opendocument.text': ['. odt']
    },
    multiple: false
  });

  return (
    <div className="upload-container">
      <div {... getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        {isLoading ? (
          <p>Loading document...</p>
        ) : isDragActive ? (
          <p>Drop the ODT file here...</p>
        ) : (
          <div>
            <p>Drag & drop an ODT file here, or click to select</p>
            <button className="upload-button">Choose File</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;