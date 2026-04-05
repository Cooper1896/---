/**
 * Shared background overlay effects (noise + CRT scanlines).
 * Every page uses these – extracted to avoid duplication.
 */

export default function OverlayEffects() {
  return (
    <>
      <div className="fixed inset-0 bg-noise pointer-events-none z-[100]" />
      <div className="fixed inset-0 crt-scanlines pointer-events-none z-[101]" />
    </>
  );
}
