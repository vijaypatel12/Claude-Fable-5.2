'use client';

import { useGameStore } from '../store/gameStore';
import { Player, scores as getScores, winner as getWinner } from '../engine/index';

export function GameOverModal() {
  const show        = useGameStore((s) => s.showGameOver);
  const gameState   = useGameStore((s) => s.gameState);
  const gameMode    = useGameStore((s) => s.gameMode);
  const resetGame   = useGameStore((s) => s.resetGame);
  const navigateTo  = useGameStore((s) => s.navigateTo);
  const dismiss     = useGameStore((s) => s.dismissGameOver);

  if (!show) return null;

  const s = getScores(gameState.board);
  const w = getWinner(gameState.board);

  const isLocal2P = gameMode === 'local';

  let title: string;
  let subtitle: string;
  if (w === Player.White) {
    title = isLocal2P ? 'Player 1 (White) Wins!' : 'White Wins!';
    subtitle = `${s.white} – ${s.black}`;
  } else if (w === Player.Black) {
    title = isLocal2P ? 'Player 2 (Black) Wins!' : 'Black Wins!';
    subtitle = `${s.black} – ${s.white}`;
  } else {
    title = "It's a Tie!";
    subtitle = `${s.white} – ${s.black}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/40 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 max-w-xs w-full text-center shadow-2xl modal-panel border border-white/60">
        <div className="text-5xl mb-2">
          {w === Player.White ? '⚪' : w === Player.Black ? '⚫' : '🤝'}
        </div>
        <h2
          className="text-2xl font-bold text-stoneBlack mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {title}
        </h2>
        <p className="text-lg font-semibold text-amber-700 mb-6 tabular-nums">{subtitle}</p>

        <div className="flex flex-col gap-2">
          <button
            onClick={resetGame}
            className="py-3 rounded-xl bg-stoneBlack text-white font-semibold text-sm hover:bg-stoneBlack-light transition-colors shadow-md active:scale-98"
          >
            Play Again
          </button>
          <button
            onClick={() => { dismiss(); navigateTo('home'); }}
            className="py-2.5 text-xs font-semibold text-stoneBlack/50 hover:text-stoneBlack/80 transition-colors"
          >
            Return to Home Menu
          </button>
        </div>
      </div>
    </div>
  );
}
