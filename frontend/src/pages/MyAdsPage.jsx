import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ExternalLink,
  Trash2,
  RotateCcw,
  Pencil,
  ArrowRight,
  PlusCircle,
  PauseCircle,
  X
} from 'lucide-react';
import api from '../services/api';
import { CATEGORIES, CITIES, getImageUrl } from '../constants';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MyAdsPage() {
  const { user, openAuthModal } = useAuth();
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    city: CITIES[0],
    dailyRate: '',
    securityDeposit: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadListings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/items?owner=me');
      setMyItems(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const toggleItemActive = async (item) => {
    setActionError('');
    try {
      if (item.isActive) {
        await api.delete(`/items/${item._id}`);
      } else {
        await api.put(`/items/${item._id}`, { isActive: true });
      }
      await loadListings();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update listing');
    }
  };

  const handlePermanentDelete = async (item) => {
    const confirmed = window.confirm(
      `Permanently delete "${item.title}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    setActionError('');
    try {
      await api.delete(`/items/${item._id}?permanent=true`);
      await loadListings();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to permanently delete listing');
    }
  };

  const openEditModal = (item) => {
    setActionError('');
    setEditingItem(item);
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || CATEGORIES[0],
      city: item.city || CITIES[0],
      dailyRate: String(item.dailyRate ?? ''),
      securityDeposit: String(item.securityDeposit ?? '')
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingEdit(true);
    setActionError('');
    try {
      await api.put(`/items/${editingItem._id}`, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        city: editForm.city,
        dailyRate: Number(editForm.dailyRate),
        securityDeposit: Number(editForm.securityDeposit)
      });
      setEditingItem(null);
      await loadListings();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to save listing changes');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-12 max-w-6xl w-full mx-auto px-margin md:px-margin-tablet">
        {!user ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center">
            <h1 className="text-headline-lg text-on-surface">My Ads</h1>
            <p className="text-body-md text-on-surface-variant mt-2 mb-5">
              Sign in to manage your listed gear and availability.
            </p>
            <button
              type="button"
              onClick={openAuthModal}
              className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md"
            >
              Login / Sign Up
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-headline-lg text-on-surface">My Ads</h1>
                <p className="text-body-md text-on-surface-variant">
                  Manage your listed gear and availability.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 self-start">
                <Link
                  to="/post-ad"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ New Ad</span>
                </Link>
                <Link
                  to="/incoming-orders"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-primary-fixed/40 transition-colors"
                >
                  <span>Incoming Orders</span>
                  <ArrowRight className="w-4 h-4 text-primary-container" />
                </Link>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                {actionError}
              </div>
            )}

            {loading ? (
              <div className="h-48 rounded-2xl bg-surface-container-lowest animate-pulse border border-surface-container" />
            ) : myItems.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-10 text-center border border-surface-container">
                <p className="text-body-md text-on-surface-variant mb-4">
                  You have not listed any items yet.
                </p>
                <Link
                  to="/post-ad"
                  className="inline-flex px-5 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md"
                >
                  + Post Your First Ad
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-surface-container-lowest rounded-2xl border border-surface-container p-4 flex gap-4 items-center"
                  >
                    <div className="w-24 h-24 rounded-xl bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                      {item.images?.[0] ? (
                        <img
                          src={getImageUrl(item.images[0])}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-outline" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-label-sm ${
                            item.isActive
                              ? 'bg-secondary-container text-on-secondary-container'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-body-sm text-on-surface-variant">{item.city}</span>
                      </div>
                      <h3 className="text-headline-sm text-on-surface truncate mt-1">
                        {item.title}
                      </h3>
                      <p className="text-price-md text-on-surface">₹{item.dailyRate}/day</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <Link
                          to={`/item/${item._id}`}
                          className="text-label-md text-primary hover:underline inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="text-label-md text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5 text-primary-container" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleItemActive(item)}
                          className="text-label-md text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1"
                        >
                          {item.isActive ? (
                            <>
                              <PauseCircle className="w-3.5 h-3.5 text-primary" /> Pause
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 text-secondary" /> Activate
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(item)}
                          className="text-label-md text-error hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-on-surface/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-[0_20px_32px_-8px_rgba(41,37,36,0.16)] border border-surface-container p-6 relative">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-low"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-headline-md text-on-surface mb-4">Edit Listing</h2>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-label-md text-on-surface mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-md text-on-surface mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-md text-on-surface mb-1">City</label>
                  <select
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-md text-on-surface mb-1">
                    Daily Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.dailyRate}
                    onChange={(e) => setEditForm({ ...editForm, dailyRate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.securityDeposit}
                    onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-md text-on-surface mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-5 py-2.5 rounded-full border border-outline-variant text-label-md text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md shadow-[0_4px_14px_rgba(249,115,22,0.35)] disabled:opacity-60"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
