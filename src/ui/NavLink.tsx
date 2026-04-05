/**
 * Reusable navigation link that follows the Zenless Tavern visual system.
 * Used in the sidebar and top-bar navigation.
 */
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface NavLinkProps {
  to: string;
  active: boolean;
  children: ReactNode;
  /** Render variant: sidebar or topbar */
  variant?: 'sidebar' | 'topbar';
  icon?: ReactNode;
}

export default function NavLink({
  to,
  active,
  children,
  variant = 'topbar',
  icon,
}: NavLinkProps) {
  if (variant === 'sidebar') {
    return (
      <Link
        to={to}
        className={`p-4 my-2 mx-2 font-headline font-bold text-sm tracking-tighter flex items-center gap-3 transition-transform duration-100 ${
          active
            ? 'bg-[var(--zt-accent-primary)] text-[var(--zt-bg)] clip-path-chamfer'
            : 'text-[var(--zt-muted)] hover:bg-[var(--zt-line)] hover:translate-x-2 hover:text-[var(--zt-accent-tertiary)]'
        }`}
      >
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={`pb-1 ${
        active
          ? 'text-[var(--zt-accent-primary)] border-b-2 border-[var(--zt-accent-primary)]'
          : 'text-[var(--zt-muted)] hover:bg-[var(--zt-accent-primary)] hover:text-[var(--zt-bg)] transition-all duration-75 hover:skew-x-2'
      }`}
    >
      {children}
    </Link>
  );
}
