'use client';

import { useGameStore } from '../store/gameStore';
import { Player, scores as getScores, isOver } from '../engine/index';

export function ScoreBar() {
  const gameState    = useGameStore((s) => s.gameState);
  const isAiThinking = useGameStore((s) => s.isAiThinking);

  const s     = getScores(gameState.board);
  const total = s.white + s.black || 1;
  const wPct  = Math.round((s.white / total) * 100);
  const bPct  = 100 - wPct;
  const isWhiteTurn = gameState.currentPlayer === Player.White && !isOver(gameState);
  const isBlackTurn = gameState.currentPlayer === Player.Black && !isOver(gameState);

  return (
    <div className="w-full max-w-[460px] mx-auto px-1">
      {/* Score numbers */}
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-stoneWhite border border-stoneWhite-dark inline-block" />
          <span className={`text-sm font-semibold tabular-nums ${isWhiteTurn ? 'text-warmGold' : 'text-stoneBlack/70'}`}>
            White {s.white}
          </span>
          {isWhiteTurn && !isAiThinking && (
            <span className="text-[10px] text-warmGold animate-pulse-soft">●</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isBlackTurn && !isAiThinking && (
            <span className="text-[10px] text-warmGold animate-pulse-soft">●</span>
          )}
          <span className={`text-sm font-semibold tabular-nums ${isBlackTurn ? 'text-warmGold' : 'text-stoneBlack/70'}`}>
            {s.black} Black
          </span>
          <span className="w-3.5 h-3.5 rounded-full bg-stoneBlack border border-stoneBlack-light inline-block" />
        </div>
      </div>

      {/* Bar */}
      <div className="w-full h-2.5 rounded-full bg-paper-dark/60 overflow-hidden flex">
        <div
          className="h-full bg-gradient-to-r from-stoneWhite to-stoneWhite-dark rounded-l-full score-fill"
          style={{ width: `${wPct}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-stoneBlack-light to-stoneBlack rounded-r-full score-fill"
          style={{ width: `${bPct}%` }}
        />
      </div>

      {/* AI thinking indicator */}
      {isAiThinking && (
        <p className="text-center text-xs text-warmGold mt-1.5 animate-pulse-soft">
          AI is thinking…
        </p>
      )}
    </div>
  );
}
