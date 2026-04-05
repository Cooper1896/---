/**
 * Shared bottom system panel (footer).
 *
 * This is the product-level fixed module that appears on every page,
 * providing global status, quick links, and system identity.
 * Per the project charter, this panel's framework and visual weight
 * must remain consistent across all pages.
 */

interface SystemPanelProps {
  /** Optional override for the left-side status text */
  statusLabel?: string;
  /** Optional override for the recording / build string */
  buildInfo?: string;
}

export default function SystemPanel({
  statusLabel = '录制 // 状态: 激活',
  buildInfo = '[REC] 00:04:21:09 // VER 1.0.2_BUILD',
}: SystemPanelProps) {
  return (
    <footer className="fixed bottom-0 w-full z-50 flex justify-between items-center px-8 py-2 bg-[var(--zt-bg)] border-t-2 border-[var(--zt-accent-secondary)]/30">
      <div className="flex items-center gap-6">
        <div className="text-xs font-bold text-[var(--zt-accent-primary)] font-headline italic">
          {statusLabel}
        </div>
        <div className="font-headline text-[10px] tracking-[0.2em] font-light text-[var(--zt-muted)]">
          {buildInfo}
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex gap-6 font-headline text-[10px] tracking-[0.2em] font-light hidden md:flex">
          <a href="#" className="text-[var(--zt-accent-primary)] hover:text-white transition-colors">
            数据政策
          </a>
          <a href="#" className="text-[var(--zt-muted)] hover:text-white transition-colors">
            硬件 ID
          </a>
          <a href="#" className="text-[var(--zt-muted)] hover:text-white transition-colors">
            信号地图
          </a>
        </div>
        <div className="h-6 w-px bg-[var(--zt-line)] hidden md:block" />
        <div className="text-[var(--zt-accent-secondary)] font-headline text-[10px] font-bold tracking-widest">
          艾利都系统内核
        </div>
      </div>
    </footer>
  );
}
