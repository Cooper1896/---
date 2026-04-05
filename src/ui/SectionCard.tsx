/**
 * Reusable card component for content sections.
 * Enforces consistent border, background, and chamfer treatment.
 */
import type { ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
  /** Whether to apply the chamfer clip-path */
  chamfer?: boolean;
  /** Border accent color on hover/active */
  borderAccent?: string;
}

export default function SectionCard({
  children,
  className = '',
  chamfer = false,
  borderAccent,
}: SectionCardProps) {
  const base =
    'bg-[var(--zt-surface)] border-2 border-[var(--zt-line)] relative transition-colors';
  const chamferClass = chamfer ? 'clip-path-chamfer' : '';
  const hoverBorder = borderAccent
    ? `hover:border-[${borderAccent}]`
    : '';

  return (
    <div className={`${base} ${chamferClass} ${hoverBorder} ${className}`}>
      {children}
    </div>
  );
}
