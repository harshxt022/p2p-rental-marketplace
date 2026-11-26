import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  PlusCircle,
  MessageSquare,
  Package,
  User,
  LogOut,
  BadgeCheck,
  Sparkles,
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  ShoppingBag
} from 'lucide-react';
import { CITIES } from '../constants';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar({ selectedCity = 'All Cities', onCityChange, searchQuery = '', onSearchSubmit }) {
  const { user, logout, openAuthModal } = useAuth();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(localSearch);
    } else {
      const params = new URLSearchParams();
      if (localSearch.trim()) params.set('q', localSearch.trim());
      if (selectedCity && selectedCity !== 'All Cities') params.set('city', selectedCity);
      navigate(`/${params.toString() ? `?${params.toString()}` : ''}`);
    }
  };

  const handleCitySelect = (city) => {
    if (onCityChange) {
      onCityChange(city);
    } else {
      const params = new URLSearchParams();
      if (city !== 'All Cities') params.set('city', city);
      navigate(`/${params.toString() ? `?${params.toString()}` : ''}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container">
      <div className="h-20 max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-[0_4px_14px_rgba(249,115,22,0.35)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-headline-md font-extrabold tracking-tight text-on-surface">
              Rent<span className="text-primary-container">Mate</span>
            </span>
          </Link>

          <div className="relative hidden md:flex items-center bg-surface-container-low rounded-full px-3 py-1.5 border border-surface-container">
            <MapPin className="w-4 h-4 text-primary-container mr-1.5 shrink-0" />
            <select
              value={selectedCity}
              onChange={(e) => handleCitySelect(e.target.value)}
              className="bg-transparent text-label-md text-on-surface appearance-none pr-6 focus:outline-none cursor-pointer"
            >
              <option value="All Cities">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 pointer-events-none" />
          </div>
        </div>

        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md items-center bg-surface-container-low rounded-full px-4 py-2 border border-surface-container focus-within:border-primary-container transition-colors">
          <Search className="w-4 h-4 text-on-surface-variant mr-2 shrink-0" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search PS5, DSLR, tent..."
            className="w-full bg-transparent text-body-md text-on-surface placeholder:text-outline focus:outline-none"
          />
        </form>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/post-ad"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-container text-on-primary text-label-md shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Rent Out</span>
          </Link>

          <Link
            to="/chats"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chats</span>
          </Link>

          <Link
            to="/my-ads"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>My Ads</span>
          </Link>

          <NotificationBell />

          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-label-sm font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden xl:inline text-label-md text-on-surface max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                {user.isVerified && <BadgeCheck className="w-4 h-4 text-secondary" />}
                <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-surface-container-lowest rounded-xl shadow-[0_12px_24px_-4px_rgba(41,37,36,0.12)] border border-surface-container py-2 z-50"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-surface-container">
                    <p className="text-label-md text-on-surface truncate">{user.name}</p>
                    <p className="text-body-sm text-on-surface-variant truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/my-ads"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    <Package className="w-4 h-4" />
                    <span>My Ads</span>
                  </Link>
                  <Link
                    to="/incoming-orders"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Incoming Orders</span>
                  </Link>
                  <Link
                    to="/my-rentals"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>My Rentals</span>
                  </Link>
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  >
                    <User className="w-4 h-4" />
                    <span>Account</span>
                  </Link>
                  <Link
                    to="/chats"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface sm:hidden"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Chats</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-body-md text-error hover:bg-surface-container-low text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="px-4 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Account
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
