'use client';

import { useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useTutorialStore } from '../store/tutorialStore';
import { Board } from './Board';
import { ScoreBar } from './ScoreBar';
import { DirectionPicker } from './DirectionPicker';
import { MoveHistory } from './MoveHistory';
import { PieRuleModal } from './PieRuleModal';
import { GameOverModal } from './GameOverModal';
import { HintPanel } from './HintPanel';
import { TutorialOverlay } from './TutorialOverlay';
import { emptyCellCount } from '../engine/index';
import type { CandidateMove } from '../ai/analysis';

export function GameScreen() {
  const navigateTo     = useGameStore((s) => s.navigateTo);
  const undoMove       = useGameStore((s) => s.undoMove);
  const requestHint    = useGameStore((s) => s.requestHint);
  const resetGame      = useGameStore((s) => s.resetGame);
  const gameState      = useGameStore((s) => s.gameState);
  const gameMode       = useGameStore((s) => s.gameMode);
  const difficulty     = useGameStore((s) => s.difficulty);
  const isAiThinking   = useGameStore((s) => s.isAiThinking);
  const stateHistory   = useGameStore((s) => s.stateHistory);
  const lastAiResult   = useGameStore((s) => s.lastAiResult);

  const { active: tutActive } = useTutorialStore();

  const [candidateHighlight, setCandidateHighlight] = useState<CandidateMove | null>(null);

  const empty = emptyCellCount(gameState.board);

  const handleSelectCandidate = useCallback((c: CandidateMove | null) => {
    setCandidateHighlight(c);
  }, []);

  const handleHint = useCallback(() => {
    setCandidateHighlight(null);
    requestHint();
  }, [requestHint]);

  const isLocal2P = gameMode === 'local';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-paper-dark/20">
        <button
          onClick={() => navigateTo('home')}
          className="text-sm font-medium text-stoneBlack/60 hover:text-stoneBlack transition-colors flex items-center gap-1"
        >
          ← Menu
        </button>
        <div className="text-center">
          <h1
            className="text-lg font-bold tracking-wider text-stoneBlack"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            CHHAYA
          </h1>
          <div className="text-[10px] tracking-widest uppercase font-semibold text-amber-800">
            {isLocal2P ? '2 Players · Pass & Play' : `vs Computer (${difficulty.toUpperCase()})`}
          </div>
        </div>
        <div className="w-12" />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-4 px-4 pb-6 pt-3">
        {/* Board column */}
        <div className="w-full max-w-[460px] mx-auto lg:mx-0 space-y-3">
          <ScoreBar />
          <Board candidateHighlight={candidateHighlight} />

          {/* Direction Picker (Step 2 of turn) */}
          <DirectionPicker />

          {/* Action Controls */}
          <div className="flex justify-center gap-2 flex-wrap pt-1">
            <CtrlBtn
              onClick={undoMove}
              disabled={stateHistory.length === 0 || isAiThinking}
              label="⟵ Undo Move"
            />
            {!isLocal2P && (
              <CtrlBtn
                onClick={handleHint}
                disabled={isAiThinking}
                label="💡 Why This Move?"
              />
            )}
            <CtrlBtn onClick={resetGame} label="↺ Restart Game" />
          </div>

          {/* Hint panel (Why This Move?) */}
          {!isLocal2P && (
            <HintPanel onSelectCandidate={handleSelectCandidate} />
          )}

          {/* Info row */}
          <div className="text-center text-xs text-stoneBlack/40 tabular-nums">
            Move {gameState.moveNumber} · {empty} empty cells left
            {lastAiResult && !isLocal2P && (
              <span className="ml-2 text-stoneBlack/30">
                · depth {lastAiResult.depth} · {lastAiResult.nodes.toLocaleString()} nodes
              </span>
            )}
          </div>
        </div>

        {/* Side panel */}
        <aside className="w-full lg:w-56 bg-white/60 backdrop-blur rounded-2xl p-4 border border-white/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-stoneBlack/70 uppercase tracking-wider">
              Move History
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">
              {gameState.history.length} moves
            </span>
          </div>

          {/* Quick 2-player reference */}
          {isLocal2P && (
            <div className="mb-3 text-[11px] p-2 bg-amber-50/70 border border-amber-200/60 rounded-lg text-amber-900 leading-tight">
              <strong>Pass & Play:</strong> Players take turns on this same screen. White moves first, then Black!
            </div>
          )}

          <MoveHistory />
        </aside>
      </main>

      {/* Modals */}
      <PieRuleModal />
      <GameOverModal />

      {/* Tutorial overlay */}
      {tutActive && <TutorialOverlay />}
    </div>
  );
}

function CtrlBtn({
  onClick, disabled, label,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 rounded-xl bg-white/80 text-xs font-semibold text-stoneBlack/75
                 hover:bg-white hover:text-stoneBlack transition-all border border-stone-200/80
                 disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
    >
      {label}
    </button>
  );
}
