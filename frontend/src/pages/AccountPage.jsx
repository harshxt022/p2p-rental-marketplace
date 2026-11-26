import { useEffect, useState } from 'react';
import { BadgeCheck, Star, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import { CITIES, formatRating } from '../constants';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AccountPage() {
  const { user, setUser, openAuthModal } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', city: CITIES[0], isVerified: false });
  const [statusMsg, setStatusMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || CITIES[0],
        isVerified: Boolean(user.isVerified)
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      setUser(data.user);
      setStatusMsg('Profile updated successfully.');
    } catch (err) {
      setStatusMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-12 px-margin md:px-margin-tablet">
        <div className="max-w-xl mx-auto bg-surface-container-lowest rounded-2xl border border-surface-container shadow-[0_1px_3px_rgba(41,37,36,0.04)] p-6 md:p-8">
          {!user ? (
            <div className="text-center py-8">
              <h1 className="text-headline-lg text-on-surface">Your Account</h1>
              <p className="text-body-md text-on-surface-variant mt-2 mb-5">
                Sign in to manage your profile and verification status.
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
            <>
              <div className="flex items-center justify-between gap-4 pb-6 border-b border-surface-container">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-headline-lg font-extrabold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-headline-md text-on-surface">{user.name}</h1>
                      {user.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-sm">
                          <BadgeCheck className="w-3.5 h-3.5" />
                          Verified Peer
                        </span>
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-variant">{user.email}</p>
                    <div className="flex items-center gap-1 text-body-sm text-on-surface mt-1">
                      <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                      <span>Peer Rating: {formatRating(user)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="mt-6 space-y-4">
                {statusMsg && (
                  <div className="p-3 rounded-lg bg-surface-container-low text-on-surface text-body-sm">
                    {statusMsg}
                  </div>
                )}

                <div>
                  <label className="block text-label-md text-on-surface mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-label-md text-on-surface mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                    />
                  </div>
                  <div>
                    <label className="block text-label-md text-on-surface mb-1">City</label>
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

                <label className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low border border-surface-container cursor-pointer">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-secondary" />
                    <div>
                      <p className="text-label-md text-on-surface">Verified Peer Badge</p>
                      <p className="text-body-sm text-on-surface-variant">
                        Enable instant demo KYC verification status
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                    className="w-5 h-5 accent-primary-container"
                  />
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-12 rounded-xl bg-primary-container text-on-primary text-headline-sm shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95 transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
