import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { placeholderService } from '../../services/apiService';
import toast from 'react-hot-toast';

interface PlaceholderFormData {
  key: string;
  category: string;
  demoValue: string;
  description:  string;
  type: 'text' | 'number' | 'date' | 'email' | 'phone';
}

const PlaceholderManager: React. FC = () => {
  const [placeholders, setPlaceholders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PlaceholderFormData>({
    key: '',
    category: '',
    demoValue: '',
    description: '',
    type: 'text'
  });

  useEffect(() => {
    loadPlaceholders();
  }, []);

  const loadPlaceholders = async () => {
    try {
      const data = await placeholderService. getAll();
      const flatList = Object.entries(data.placeholders).flatMap(([category, items]:  [string, any]) =>
        items.map((item:  any) => ({ ...item, category }))
      );
      setPlaceholders(flatList);
    } catch (error) {
      toast.error('Failed to load placeholders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editing) {
        await placeholderService.update(editing, formData);
        toast.success('Placeholder updated');
      } else {
        await placeholderService.create(formData);
        toast.success('Placeholder created');
      }
      
      setShowForm(false);
      setEditing(null);
      setFormData({ key: '', category: '', demoValue: '', description: '', type: 'text' });
      loadPlaceholders();
    } catch (error:  any) {
      toast.error(error.response?.data?.error || 'Failed to save placeholder');
    }
  };

  const handleEdit = (placeholder: any) => {
    setFormData({
      key: placeholder.key,
      category: placeholder.category,
      demoValue: placeholder. demoValue,
      description:  placeholder.description || '',
      type: placeholder.type
    });
    setEditing(placeholder. id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this placeholder?')) {
      return;
    }

    try {
      await placeholderService.delete(id);
      toast.success('Placeholder deleted');
      loadPlaceholders();
    } catch (error) {
      toast.error('Failed to delete placeholder');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setFormData({ key: '', category:  '', demoValue: '', description:  '', type: 'text' });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading... </div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Placeholder Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Placeholder
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">
            {editing ? 'Edit Placeholder' :  'New Placeholder'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Key (e.g., user. name)</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus: outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!! editing}
                  pattern="[a-z]+\.[a-z]+(\.[a-z]+)*"
                  title="Format: category.field (lowercase, dots only)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus: outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Demo Value</label>
                <input
                  type="text"
                  value={formData.demoValue}
                  onChange={(e) => setFormData({ ...formData, demoValue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editing ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demo Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {placeholders.map((placeholder) => (
              <tr key={placeholder.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm font-mono text-blue-600">${placeholder.key}</code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{placeholder.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{placeholder.demoValue}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{placeholder.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(placeholder)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(placeholder.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {placeholders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No placeholders yet. Click "Add Placeholder" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceholderManager;