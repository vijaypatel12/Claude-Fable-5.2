'use client';

import { useGameStore } from '../store/gameStore';
import { Board } from './Board';
import { ScoreBar } from './ScoreBar';
import { MoveHistory } from './MoveHistory';
import { PieRuleModal } from './PieRuleModal';
import { GameOverModal } from './GameOverModal';
import { emptyCellCount } from '../engine/index';

export function GameScreen() {
  const navigateTo   = useGameStore((s) => s.navigateTo);
  const undoMove     = useGameStore((s) => s.undoMove);
  const requestHint  = useGameStore((s) => s.requestHint);
  const resetGame    = useGameStore((s) => s.resetGame);
  const gameState    = useGameStore((s) => s.gameState);
  const gameMode     = useGameStore((s) => s.gameMode);
  const difficulty   = useGameStore((s) => s.difficulty);
  const isAiThinking = useGameStore((s) => s.isAiThinking);
  const stateHistory = useGameStore((s) => s.stateHistory);
  const lastAiResult = useGameStore((s) => s.lastAiResult);

  const empty = emptyCellCount(gameState.board);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigateTo('home')}
          className="text-sm text-stoneBlack/50 hover:text-stoneBlack/80 transition-colors"
        >
          ← Menu
        </button>
        <h1
          className="text-lg font-bold tracking-wider text-stoneBlack/70"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          CHHAYA
        </h1>
        <span className="text-xs text-stoneBlack/35 tabular-nums">
          {gameMode === 'computer' ? difficulty.toUpperCase() : 'LOCAL'}
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-4 px-4 pb-6">
        {/* Board column */}
        <div className="w-full max-w-[460px] mx-auto lg:mx-0 space-y-3">
          <ScoreBar />
          <Board />

          {/* Controls */}
          <div className="flex justify-center gap-2 flex-wrap">
            <CtrlBtn
              onClick={undoMove}
              disabled={stateHistory.length === 0 || isAiThinking}
              label="Undo"
            />
            {gameMode === 'computer' && (
              <CtrlBtn
                onClick={requestHint}
                disabled={isAiThinking}
                label="Hint"
              />
            )}
            <CtrlBtn onClick={resetGame} label="New Game" />
          </div>

          {/* Game info */}
          <div className="text-center text-xs text-stoneBlack/35 tabular-nums">
            Move {gameState.moveNumber} · {empty} cells remaining
            {lastAiResult && (
              <span className="ml-2">
                · AI depth {lastAiResult.depth} · {lastAiResult.nodes.toLocaleString()} nodes
              </span>
            )}
          </div>
        </div>

        {/* Side panel (desktop) */}
        <aside className="w-full lg:w-56 bg-white/50 backdrop-blur rounded-xl p-4 border border-white/30 shadow-sm">
          <h3 className="text-xs font-medium text-stoneBlack/50 uppercase tracking-wider mb-2">
            Move History
          </h3>
          <MoveHistory />
        </aside>
      </main>

      {/* Modals */}
      <PieRuleModal />
      <GameOverModal />
    </div>
  );
}

function CtrlBtn({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-lg bg-white/60 text-sm font-medium text-stoneBlack/60
                 hover:bg-white/90 hover:text-stoneBlack transition-all border border-white/40
                 disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
    >
      {label}
    </button>
  );
}
