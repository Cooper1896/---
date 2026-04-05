/**
 * Shared phone-style iframe container.
 *
 * Per the project charter, the phone UI is the "core stage" of the app.
 * This component enforces unified sizing, border, aspect-ratio, and
 * title-bar rules across all pages that embed a mobile view.
 */
import type { ReactNode } from 'react';

interface PhoneFrameProps {
  /** Content rendered inside the phone frame */
  children: ReactNode;
  /** Optional title shown in the phone's top status bar */
  title?: string;
  /** Optional CSS class applied to the outer wrapper */
  className?: string;
}

export default function PhoneFrame({
  children,
  title = 'ZENLESS_TERM',
  className = '',
}: PhoneFrameProps) {
  return (
    <div
      className={`relative mx-auto flex flex-col border-2 border-[var(--zt-line)] bg-[var(--zt-bg-deep)] overflow-hidden ${className}`}
      style={{
        maxWidth: 'var(--zt-phone-max-w)',
        maxHeight: 'var(--zt-phone-max-h)',
        borderRadius: '24px',
      }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-2 bg-[var(--zt-bg)] border-b border-[var(--zt-line)]">
        <span className="font-headline text-[10px] tracking-widest text-[var(--zt-muted)] font-bold uppercase">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--zt-accent-primary)] animate-pulse" />
          <span className="font-headline text-[10px] text-[var(--zt-muted)]">LIVE</span>
        </div>
      </div>

      {/* Phone content area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  );
}
