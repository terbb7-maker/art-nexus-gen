import { Link } from "react-router-dom";

export const Logo = ({ withText = true }: { withText?: boolean }) => (
  <Link to="/" className="flex items-center gap-2 group">
    <div className="relative">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="transition-transform group-hover:scale-110">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(217 91% 60%)" />
            <stop offset="100%" stopColor="hsl(258 90% 66%)" />
          </linearGradient>
        </defs>
        <path d="M16 2 L30 16 L16 30 L2 16 Z" fill="url(#logo-grad)" />
        <path d="M16 8 L24 16 L16 24 L8 16 Z" fill="hsl(240 22% 5%)" />
        <circle cx="16" cy="16" r="3" fill="url(#logo-grad)" />
      </svg>
    </div>
    {withText && (
      <span className="font-display font-bold text-xl tracking-tight">Kreatix</span>
    )}
  </Link>
);
