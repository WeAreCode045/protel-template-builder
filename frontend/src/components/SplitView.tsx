import React from 'react';

interface SplitViewProps {
  file: File;
}

const SplitView: React.FC<SplitViewProps> = ({ file }) => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Document: {file.name}</h2>
      <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
      <p>ODT editor will be integrated here with Collabora Online</p>
    </div>
  );
};

export default SplitView;
