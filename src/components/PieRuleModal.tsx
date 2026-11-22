'use client';

import { useGameStore } from '../store/gameStore';

export function PieRuleModal() {
  const show          = useGameStore((s) => s.showPieRule);
  const handlePieRule = useGameStore((s) => s.handlePieRule);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/30">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-7 max-w-sm w-full shadow-xl modal-panel border border-white/40">
        <h2
          className="text-xl font-bold text-stoneBlack mb-2 text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Pie Rule
        </h2>
        <p className="text-sm text-stoneBlack/60 mb-5 text-center leading-relaxed">
          White has made their opening move. As Black, you may choose to{' '}
          <strong className="text-stoneBlack/80">swap positions</strong> and take control of
          White&apos;s pieces, or <strong className="text-stoneBlack/80">continue</strong> playing
          as Black.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => handlePieRule(true)}
            className="flex-1 py-3 rounded-xl bg-warmGold text-white font-semibold text-sm hover:bg-warmGold-dark transition-colors shadow-md"
          >
            Swap
          </button>
          <button
            onClick={() => handlePieRule(false)}
            className="flex-1 py-3 rounded-xl bg-paper-dark text-stoneBlack font-semibold text-sm hover:bg-paper transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
