'use client';

import { useGameStore } from '../store/gameStore';
import { Player, scores as getScores, isOver } from '../engine/index';

export function ScoreBar() {
  const gameState    = useGameStore((s) => s.gameState);
  const isAiThinking = useGameStore((s) => s.isAiThinking);
  const gameMode     = useGameStore((s) => s.gameMode);
  const selectedCell = useGameStore((s) => s.selectedCell);

  const s     = getScores(gameState.board);
  const total = s.white + s.black || 1;
  const wPct  = Math.round((s.white / total) * 100);
  const bPct  = 100 - wPct;
  const isWhiteTurn = gameState.currentPlayer === Player.White && !isOver(gameState);
  const isBlackTurn = gameState.currentPlayer === Player.Black && !isOver(gameState);

  const isLocal2P = gameMode === 'local';

  return (
    <div className="w-full max-w-[460px] mx-auto px-1 space-y-2">
      {/* Turn Banner with clear instructions */}
      {!isOver(gameState) && (
        <div
          className={`py-2 px-3.5 rounded-xl border text-center transition-all shadow-sm ${
            isWhiteTurn
              ? 'bg-amber-50/90 border-amber-300/80 text-stone-800'
              : 'bg-stone-800 border-stone-700 text-stone-100 shadow-stone-900/20'
          }`}
        >
          <div className="flex items-center justify-center gap-2 font-semibold text-sm">
            <span
              className={`w-3 h-3 rounded-full border ${
                isWhiteTurn
                  ? 'bg-white border-amber-400 shadow-sm'
                  : 'bg-stone-950 border-stone-500'
              }`}
            />
            <span>
              {isLocal2P
                ? isWhiteTurn
                  ? 'Player 1’s Turn (White)'
                  : 'Player 2’s Turn (Black)'
                : isWhiteTurn
                ? 'Your Turn (White)'
                : isAiThinking
                ? 'AI is thinking…'
                : 'Computer’s Turn (Black)'}
            </span>
          </div>

          <div
            className={`text-xs mt-0.5 font-medium ${
              isWhiteTurn ? 'text-amber-800/80' : 'text-stone-300/80'
            }`}
          >
            {isAiThinking
              ? 'Calculating best move…'
              : selectedCell
              ? '⚡ Step 2: Choose shadow direction below!'
              : '👉 Step 1: Tap any empty cell to place your stone'}
          </div>
        </div>
      )}

      {/* Score numbers */}
      <div className="flex justify-between items-center text-xs font-semibold px-0.5">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-stoneWhite border border-stoneWhite-dark inline-block shadow-sm" />
          <span className={`tabular-nums ${isWhiteTurn ? 'text-amber-700 font-bold' : 'text-stoneBlack/70'}`}>
            {isLocal2P ? 'P1 White' : 'White'}: <span className="text-sm font-bold">{s.white}</span>
          </span>
          {isWhiteTurn && (
            <span className="text-[10px] text-amber-600 animate-pulse">● PLAYING</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isBlackTurn && (
            <span className="text-[10px] text-amber-600 animate-pulse">PLAYING ●</span>
          )}
          <span className={`tabular-nums ${isBlackTurn ? 'text-amber-700 font-bold' : 'text-stoneBlack/70'}`}>
            {isLocal2P ? 'P2 Black' : 'Black'}: <span className="text-sm font-bold">{s.black}</span>
          </span>
          <span className="w-3.5 h-3.5 rounded-full bg-stoneBlack border border-stoneBlack-light inline-block shadow-sm" />
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-2.5 rounded-full bg-paper-dark/60 overflow-hidden flex shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-stoneWhite to-amber-200/90 rounded-l-full score-fill"
          style={{ width: `${wPct}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-stone-600 to-stone-900 rounded-r-full score-fill"
          style={{ width: `${bPct}%` }}
        />
      </div>
    </div>
  );
}
