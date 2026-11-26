import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, X } from 'lucide-react';
import api from '../services/api';
import { CATEGORIES, CITIES } from '../constants';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PostAdPage() {
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    city: user?.city || CITIES[0],
    dailyRate: '',
    securityDeposit: ''
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, 4);
    setFiles(selected);
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const removeImage = (index) => {
    const nextFiles = files.filter((_, i) => i !== index);
    const nextPreviews = previews.filter((_, i) => i !== index);
    setFiles(nextFiles);
    setPreviews(nextPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal();
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('city', form.city);
      formData.append('dailyRate', form.dailyRate);
      formData.append('securityDeposit', form.securityDeposit);
      files.forEach((file) => formData.append('images', file));

      const { data } = await api.post('/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate(`/item/${data.item._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-12 px-margin md:px-margin-tablet">
        <div className="max-w-2xl mx-auto bg-surface-container-lowest rounded-2xl border border-surface-container shadow-[0_1px_3px_rgba(41,37,36,0.04)] p-6 md:p-8">
          <span className="text-label-sm uppercase tracking-wider text-primary-container">
            List Your Gear
          </span>
          <h1 className="text-headline-lg text-on-surface mt-1">Post a Rental Ad</h1>
          <p className="text-body-md text-on-surface-variant mt-1 mb-6">
            Add clear photos, daily rate, and refundable security deposit.
          </p>

          {!user ? (
            <div className="p-6 rounded-xl bg-surface-container-low text-center">
              <p className="text-body-md text-on-surface mb-3">
                Please sign in to post an item for rent.
              </p>
              <button
                type="button"
                onClick={openAuthModal}
                className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary text-label-md shadow-[0_4px_14px_rgba(249,115,22,0.35)]"
              >
                Login / Sign Up
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-label-md text-on-surface mb-1.5">Item Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Sony Alpha A7 III + 28-70mm Lens"
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md text-on-surface mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-label-md text-on-surface mb-1.5">City</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-md text-on-surface mb-1.5">
                    Daily Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.dailyRate}
                    onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                    placeholder="700"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-on-surface mb-1.5">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.securityDeposit}
                    onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                    placeholder="2000"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label-md text-on-surface mb-1.5">Description</label>
                <textarea
                  rows={4}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Condition, included accessories, pickup notes..."
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-label-md text-on-surface mb-1.5">
                  Photos (up to 4)
                </label>
                <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-outline-variant bg-surface-container-low cursor-pointer hover:border-primary-container transition-colors">
                  <UploadCloud className="w-8 h-8 text-primary-container mb-2" />
                  <span className="text-label-md text-on-surface">
                    Click to select up to 4 images
                  </span>
                  <span className="text-body-sm text-on-surface-variant mt-0.5">
                    JPG, PNG, or WEBP (max 5MB each)
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFiles}
                    className="hidden"
                  />
                </label>

                {previews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    {previews.map((src, idx) => (
                      <div key={src} className="relative h-24 rounded-xl overflow-hidden border border-surface-container">
                        <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-on-surface/75 text-on-primary flex items-center justify-center"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-primary-container text-on-primary text-headline-sm shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95 transition-all disabled:opacity-60"
              >
                {submitting ? 'Publishing...' : 'Publish Rental Ad'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
