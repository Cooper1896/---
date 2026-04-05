/**
 * Shared page header component.
 * Provides the consistent "accent bar + label + title + subtitle" pattern
 * used across all pages in the Zenless Tavern.
 */
import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Small uppercase label above the title */
  label: string;
  /** Main heading text */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** Accent colour for the bar and label – defaults to accent-secondary */
  accent?: string;
  /** Optional right-side slot */
  actions?: ReactNode;
}

export default function PageHeader({
  label,
  title,
  subtitle,
  accent = 'var(--zt-accent-secondary)',
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="h-1 w-12" style={{ backgroundColor: accent }} />
            <span
              className="font-headline text-xs tracking-[0.3em] font-bold uppercase"
              style={{ color: accent }}
            >
              {label}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-headline text-white leading-none tracking-tighter">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[var(--zt-muted)] font-headline mt-4 text-lg max-w-xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-4">{actions}</div>}
      </div>
    </div>
  );
}
