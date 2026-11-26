import { Link } from 'react-router-dom';
import { MapPin, Star, BadgeCheck, Package } from 'lucide-react';
import { getImageUrl, formatRating } from '../constants';

export default function ItemCard({ item }) {
  const imageSrc = item.images && item.images.length > 0 ? getImageUrl(item.images[0]) : '';

  return (
    <Link
      to={`/item/${item._id}`}
      className="group bg-surface-container-lowest rounded-2xl overflow-hidden border border-surface-container shadow-[0_1px_3px_rgba(41,37,36,0.04),0_4px_12px_rgba(41,37,36,0.03)] hover:shadow-[0_12px_24px_-4px_rgba(41,37,36,0.1)] transition-all duration-300 flex flex-col"
    >
      <div className="relative w-full h-56 bg-surface-container overflow-hidden flex items-center justify-center">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Package className="w-12 h-12 text-outline" />
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-[11px] font-semibold text-on-surface-variant shadow-sm">
          {item.category}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant mb-1">
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-primary-container shrink-0" />
              {item.city}
            </span>
            <span className="flex items-center gap-1 text-on-surface font-semibold shrink-0">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              {formatRating(item.owner)}
            </span>
          </div>
          <h3 className="text-headline-sm text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
            {item.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-surface-container flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-price-lg text-on-surface">₹{item.dailyRate}</span>
            <span className="text-body-sm text-on-surface-variant">/ day</span>
          </div>
          <div className="flex items-center gap-1 text-body-sm text-on-surface-variant">
            {item.owner?.isVerified && <BadgeCheck className="w-4 h-4 text-secondary" />}
            <span className="truncate max-w-[100px]">{item.owner?.name || 'Owner'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
