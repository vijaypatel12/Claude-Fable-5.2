'use client';

import { useGameStore } from '../store/gameStore';

export function PieRuleModal() {
  const show          = useGameStore((s) => s.showPieRule);
  const gameMode      = useGameStore((s) => s.gameMode);
  const handlePieRule = useGameStore((s) => s.handlePieRule);

  if (!show) return null;

  const isLocal2P = gameMode === 'local';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/40 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-7 max-w-sm w-full shadow-2xl modal-panel border border-white/60">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-lg font-bold mx-auto mb-2">
          🥧
        </div>
        <h2
          className="text-2xl font-bold text-stoneBlack mb-2 text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Pie Rule (Swap Sides)
        </h2>
        <p className="text-xs text-stone-600 mb-5 text-center leading-relaxed">
          {isLocal2P ? (
            <>
              <strong>Player 1 (White)</strong> completed the first move.
              <br />
              <strong>Player 2 (Black)</strong> can now either <strong>swap sides</strong> (take Player 1’s position and stone) or <strong>continue</strong> playing as Black.
            </>
          ) : (
            <>
              White completed their opening move. As Black, you may choose to{' '}
              <strong className="text-stone-800">swap positions</strong> and take control of
              White&apos;s stone, or <strong className="text-stone-800">continue</strong> playing
              as Black.
            </>
          )}
        </p>

        <div className="flex gap-2.5">
          <button
            onClick={() => handlePieRule(true)}
            className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors shadow-md active:scale-98"
          >
            🔄 Swap Sides
          </button>
          <button
            onClick={() => handlePieRule(false)}
            className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-800 font-semibold text-xs hover:bg-stone-200 transition-colors border border-stone-200 active:scale-98"
          >
            ▶ Continue as Black
          </button>
        </div>
      </div>
    </div>
  );
}
