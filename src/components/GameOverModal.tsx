'use client';

import { useGameStore } from '../store/gameStore';
import { Player, scores as getScores, winner as getWinner } from '../engine/index';

export function GameOverModal() {
  const show        = useGameStore((s) => s.showGameOver);
  const gameState   = useGameStore((s) => s.gameState);
  const resetGame   = useGameStore((s) => s.resetGame);
  const navigateTo  = useGameStore((s) => s.navigateTo);
  const dismiss     = useGameStore((s) => s.dismissGameOver);

  if (!show) return null;

  const s = getScores(gameState.board);
  const w = getWinner(gameState.board);

  let title: string;
  let subtitle: string;
  if (w === Player.White) {
    title = 'White Wins!';
    subtitle = `${s.white} – ${s.black}`;
  } else if (w === Player.Black) {
    title = 'Black Wins!';
    subtitle = `${s.black} – ${s.white}`;
  } else {
    title = "It's a Tie!";
    subtitle = `${s.white} – ${s.black}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/30">
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 max-w-xs w-full text-center shadow-xl modal-panel border border-white/40">
        <div className="text-5xl mb-2">
          {w === Player.White ? '⬜' : w === Player.Black ? '⬛' : '🤝'}
        </div>
        <h2
          className="text-2xl font-bold text-stoneBlack mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {title}
        </h2>
        <p className="text-lg font-semibold text-warmGold mb-6 tabular-nums">{subtitle}</p>

        <div className="flex flex-col gap-2">
          <button
            onClick={resetGame}
            className="py-3 rounded-xl bg-stoneBlack text-white font-semibold text-sm hover:bg-stoneBlack-light transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={() => { dismiss(); navigateTo('home'); }}
            className="py-2 text-sm text-stoneBlack/50 hover:text-stoneBlack/80 transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
