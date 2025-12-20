import React from 'react';
import MonacoEditor from '@monaco-editor/react';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ content, onChange }) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <MonacoEditor
      height="70vh"
      language="plaintext"
      theme="vs-dark"
      value={content}
      onChange={handleEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        wordWrap: 'on',
        lineNumbers: 'on',
        folding: false,
        renderWhitespace: 'selection',
      }}
    />
  );
};

export default Editor;
