import React from 'react';
import CollaboraEditor from './CollaboraEditor';

interface SplitViewProps {
  file: File;
}

const SplitView: React.FC<SplitViewProps> = ({ file }) => {

  return (
    <div className="split-view-container" style={{ width: '100%', height: '85vh', padding: '20px' }}>
      <CollaboraEditor file={file} />
    </div>
  );
};

export default SplitView;