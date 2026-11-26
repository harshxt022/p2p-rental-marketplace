import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Lock, BadgeCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low border-t border-surface-container mt-space-xl">
      <div className="max-w-7xl mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-surface-container-lowest p-5 rounded-xl border border-surface-container">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-7 h-7 text-secondary shrink-0" />
            <div>
              <p className="text-label-md text-on-surface">Verified Local Peers</p>
              <p className="text-body-sm text-on-surface-variant">Trusted community rentals</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Lock className="w-7 h-7 text-secondary shrink-0" />
            <div>
              <p className="text-label-md text-on-surface">Dual-OTP Handover</p>
              <p className="text-body-sm text-on-surface-variant">Verified pickup & return</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-secondary shrink-0" />
            <div>
              <p className="text-label-md text-on-surface">Razorpay Secured</p>
              <p className="text-body-sm text-on-surface-variant">Safe digital checkout</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm text-on-surface-variant">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-headline-sm font-extrabold text-on-surface">
              Rent<span className="text-primary-container">Mate</span>
            </span>
          </Link>
          <p>© {new Date().getFullYear()} RentMate P2P Rental Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
