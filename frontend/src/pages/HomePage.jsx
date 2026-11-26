import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  Camera,
  Gamepad2,
  Laptop,
  Tent,
  Wrench,
  Speaker,
  Bike,
  LayoutGrid
} from 'lucide-react';
import api from '../services/api';
import { CATEGORIES, CITIES } from '../constants';
import Navbar from '../components/Navbar';
import ItemCard from '../components/ItemCard';
import Footer from '../components/Footer';

const CATEGORY_ICONS = {
  'Cameras & Optics': Camera,
  'Gaming & Consoles': Gamepad2,
  'Laptops & Tech': Laptop,
  'Camping & Outdoors': Tent,
  'Power Tools & DIY': Wrench,
  'Sound & AV': Speaker,
  'Fitness & Cycles': Bike,
  Other: LayoutGrid
};

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [city, setCity] = useState(searchParams.get('city') || 'All Cities');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async (queryText, selectedCat, selectedCity) => {
    setLoading(true);
    try {
      const params = {};
      if (queryText && queryText.trim()) params.q = queryText.trim();
      if (selectedCat && selectedCat !== 'All') params.category = selectedCat;
      if (selectedCity && selectedCity !== 'All Cities') params.city = selectedCity;
      const { data } = await api.get('/items', { params });
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(q, category, city);
  }, [category, city]);

  const syncParamsAndFetch = (nextQ, nextCat, nextCity) => {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (nextCat !== 'All') params.set('category', nextCat);
    if (nextCity !== 'All Cities') params.set('city', nextCity);
    setSearchParams(params);
    fetchItems(nextQ, nextCat, nextCity);
  };

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    syncParamsAndFetch(q, category, city);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        selectedCity={city}
        onCityChange={(nextCity) => {
          setCity(nextCity);
          syncParamsAndFetch(q, category, nextCity);
        }}
        searchQuery={q}
        onSearchSubmit={(nextQ) => {
          setQ(nextQ);
          syncParamsAndFetch(nextQ, category, city);
        }}
      />

      <main className="flex-1 pt-20">
        <section className="relative overflow-hidden bg-gradient-to-b from-surface-container-low via-background to-background py-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[300px] bg-primary-fixed/30 rounded-full blur-[110px]" />
          <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop relative z-10 text-center">

            <h1 className="text-display-mobile md:text-display text-on-surface tracking-tight max-w-3xl mx-auto">
              Why Buy When You Can <span className="text-primary-container">Rent?</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant mt-3 max-w-2xl mx-auto">
              Discover cameras, consoles, camping gear, and tools from verified neighbors near you.
            </p>

            <form
              onSubmit={handleHeroSubmit}
              className="mt-8 max-w-4xl mx-auto bg-surface-container-lowest rounded-2xl md:rounded-full shadow-[0_12px_36px_rgba(41,37,36,0.08)] border border-surface-container p-2 grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
            >
              <div className="md:col-span-6 flex items-center gap-2 px-4 py-2">
                <Search className="w-5 h-5 text-primary-container shrink-0" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Try 'PS5', 'DSLR', 'Camping Tent'..."
                  className="w-full bg-transparent text-headline-sm text-on-surface placeholder:text-outline focus:outline-none"
                />
              </div>

              <div className="hidden md:block w-px h-8 bg-surface-container-highest mx-auto" />

              <div className="md:col-span-3 flex items-center gap-2 px-4 py-2">
                <MapPin className="w-5 h-5 text-secondary shrink-0" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-transparent text-headline-sm text-on-surface focus:outline-none cursor-pointer"
                >
                  <option value="All Cities">All Cities</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full h-12 rounded-full bg-primary-container text-on-primary text-headline-sm flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:brightness-95 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setCategory('All')}
              className={`px-4 py-2 rounded-full text-label-md whitespace-nowrap border transition-all ${category === 'All'
                ? 'bg-primary-fixed text-primary border-primary-container'
                : 'bg-surface-container-lowest text-on-surface-variant border-surface-container hover:text-on-surface'
                }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || LayoutGrid;
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-label-md whitespace-nowrap border transition-all ${active
                    ? 'bg-primary-fixed text-primary border-primary-container'
                    : 'bg-surface-container-lowest text-on-surface-variant border-surface-container hover:text-on-surface'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="w-full py-8 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-label-sm uppercase tracking-wider text-primary-container">
                  Local Gear Near You
                </span>
                <h2 className="text-headline-lg text-on-surface mt-0.5">Available Rentals</h2>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {['All Cities', ...CITIES].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(c)}
                    className={`px-3.5 py-1.5 rounded-full text-label-md whitespace-nowrap transition-all ${city === c
                      ? 'bg-primary-container text-on-primary shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className="h-80 rounded-2xl bg-surface-container-lowest animate-pulse border border-surface-container"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl border border-surface-container p-12 text-center">
                <p className="text-headline-md text-on-surface">No rentals found</p>
                <p className="text-body-md text-on-surface-variant mt-1">
                  Try clearing filters or search for a different item.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item) => (
                  <ItemCard key={item._id} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
