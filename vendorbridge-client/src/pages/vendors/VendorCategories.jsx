import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Plus, Edit, Trash2, X, AlertCircle, ArrowLeft } from 'lucide-react';
import { getVendorCategories, createVendorCategory, updateVendorCategory, deleteVendorCategory } from '../../api/vendorApi';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const VendorCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getVendorCategories();
      setCategories(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleEditSelect = (category) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || '');
    setFormError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = { name: name.trim(), description: description.trim() || null };
      if (editingId) {
        await updateVendorCategory(editingId, payload);
        setToastMessage('Category updated successfully.');
        setToastType('success');
      } else {
        await createVendorCategory(payload);
        setToastMessage('Category created successfully.');
        setToastType('success');
      }
      setName('');
      setDescription('');
      setEditingId(null);
      loadCategories();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteVendorCategory(id);
      setToastMessage('Category deleted successfully.');
      setToastType('success');
      loadCategories();
    } catch (err) {
      setToastMessage(err.response?.data?.message || err.message || 'Error deleting category.');
      setToastType('error');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isWritable = ['admin', 'officer'].includes(user?.role);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Messages */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Vendor Configuration</p>
          <h1 className="text-3xl font-black text-slate-950 font-sans flex items-center gap-2">
            <FolderOpen className="text-primary" /> Supplier Categories
          </h1>
          <p className="text-sm font-semibold text-slate-500">
            Define classification segments (e.g. Raw Materials, Software, Logistics) to organize vendor routing.
          </p>
        </div>
        <Link 
          to="/vendors" 
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-650 hover:text-primary transition-colors bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto"
        >
          <ArrowLeft size={16} /> Back to Vendors
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Create / Edit Form Pane */}
        <div>
          {isWritable ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium sticky top-6">
              <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 font-sans">
                {editingId ? 'Modify Category' : 'Create Category'}
              </h2>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {formError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Category Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="premium-input"
                    placeholder="e.g. Software Services"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="premium-input min-h-[100px]"
                    placeholder="Describe what scope of supplies falls under this category..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-black text-slate-650 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary py-3 text-xs font-black text-white hover:opacity-95 shadow-premium disabled:opacity-60 transition cursor-pointer"
                  >
                    {editingId ? 'Update Category' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-400 font-semibold text-xs py-10 sticky top-6">
              🔒 Read-only access: Categories can only be modified by procurement officers or administrators.
            </div>
          )}
        </div>

        {/* Categories List Table Pane */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-premium overflow-hidden self-start">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-black uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150/70 font-semibold text-sm text-slate-650">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span>Loading categories...</span>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-400">
                      No categories registered yet.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className={`hover:bg-slate-50/30 transition duration-150 ${editingId === cat.id ? 'bg-green-50/30' : ''}`}>
                      <td className="py-4 px-6 font-bold text-slate-900">{cat.name}</td>
                      <td className="py-4 px-6 text-slate-500 text-xs max-w-md break-words">
                        {cat.description || <span className="italic text-slate-350">No description provided</span>}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {isWritable && (
                            <button
                              onClick={() => handleEditSelect(cat)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary/20 hover:text-primary transition shadow-sm cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-550 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition shadow-sm cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorCategories;
