import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { placeholderService } from '../services/apiService';
import toast from 'react-hot-toast';

interface PlaceholderPanelProps {
  onInsert: (placeholder: string) => void;
}

const PlaceholderPanel:  React.FC<PlaceholderPanelProps> = ({ onInsert }) => {
  const [placeholders, setPlaceholders] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaceholders();
  }, []);

  const loadPlaceholders = async () => {
    try {
      const data = await placeholderService.getAll();
      setPlaceholders(data. placeholders);
      // Expand all categories by default
      setExpandedCategories(new Set(Object.keys(data.placeholders)));
    } catch (error) {
      toast.error('Failed to load placeholders');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleInsert = (key: string) => {
    onInsert(`$${key}`);
    toast.success('Placeholder inserted');
  };

  const handleCopy = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard. writeText(`$${key}`);
    toast.success('Copied to clipboard');
  };

  const filteredPlaceholders = Object.entries(placeholders).reduce((acc, [category, items]) => {
    const filtered = items.filter(item => 
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?. toLowerCase().includes(searchTerm. toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, any[]>);

  if (loading) {
    return (
      <div className="placeholder-panel">
        <div className="p-4 text-center text-gray-500">Loading placeholders...</div>
      </div>
    );
  }

  return (
    <div className="placeholder-panel">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-3">Available Placeholders</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search placeholders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e. target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {Object.entries(filteredPlaceholders).map(([category, items]) => (
          <div key={category} className="border-b">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between hover: bg-gray-50 transition-colors"
            >
              <span className="font-medium capitalize">{category}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{items.length}</span>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {expandedCategories.has(category) && (
              <div className="bg-gray-50">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 border-t border-gray-200 hover:bg-white transition-colors cursor-pointer group"
                    onClick={() => handleInsert(item.key)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-blue-600">
                            ${item.key}
                          </code>
                          <button
                            onClick={(e) => handleCopy(item.key, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                        <p className="text-sm text-gray-700 mt-1">
                          Preview: <span className="font-medium">{item. demoValue}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {Object.keys(filteredPlaceholders).length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No placeholders found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try a different search term</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceholderPanel;