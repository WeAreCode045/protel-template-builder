import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import SplitView from './components/SplitView';
import './App.css';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (uploadedFile: File) => {
    setIsLoading(true);
    setError(null);
    try {
      setFile(uploadedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ODT file');
      console.error('Error loading ODT:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ProTel Template Builder</h1>
        {file && (
          <button 
            onClick={() => setFile(null)}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#646cff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Upload New File
          </button>
        )}
      </header>
      
      {error && (
        <div style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#f44336',
          color: 'white',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      
      {!file ? (
        <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
      ) : (
        <SplitView file={file} />
      )}
    </div>
  );
}

export default App;