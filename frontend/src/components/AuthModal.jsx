import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { CITIES } from '../constants';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'Chandigarh'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-[0_20px_32px_-8px_rgba(41,37,36,0.16)] border border-surface-container p-6 relative">
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-low"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-headline-md text-on-surface font-bold">
            {mode === 'login' ? 'Welcome back to RentMate' : 'Join RentMate'}
          </h2>
        </div>

        <div className="flex p-1 bg-surface-container rounded-full mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 rounded-full text-label-md transition-all ${
              mode === 'login'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 rounded-full text-label-md transition-all ${
              mode === 'register'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-error-container text-on-error-container text-body-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
                Full Name
              </label>
              <input
                id="auth-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Rahul Sharma"
                className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
              Email Address
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="rahul@demo.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••"
              className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
            />
          </div>

          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">
                  City
                </label>
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-body-md focus:outline-none focus:border-primary-container"
                >
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl bg-primary-container text-on-primary text-headline-sm shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95 transition-all disabled:opacity-60"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
