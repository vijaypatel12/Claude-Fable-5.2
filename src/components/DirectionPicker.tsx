'use client';

import { useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { Direction } from '../engine/index';
import { useTutorialStore } from '../store/tutorialStore';

export function DirectionPicker() {
  const selectedCell       = useGameStore((s) => s.selectedCell);
  const directionInfos     = useGameStore((s) => s.directionInfos);
  const previewDirection   = useGameStore((s) => s.previewDirection);
  const previewDir         = useGameStore((s) => s.previewDir);
  const confirmDirection   = useGameStore((s) => s.confirmDirection);
  const cancelSelection    = useGameStore((s) => s.cancelSelection);
  const isAiThinking       = useGameStore((s) => s.isAiThinking);
  const { onDirectionChosen } = useTutorialStore();

  const handleChoose = useCallback(
    (dir: Direction) => {
      confirmDirection(dir);
      onDirectionChosen();
    },
    [confirmDirection, onDirectionChosen],
  );

  // Keyboard navigation: Arrow keys & WASD to choose direction, Escape to cancel
  useEffect(() => {
    if (!selectedCell || isAiThinking) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleChoose(Direction.Up);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleChoose(Direction.Down);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleChoose(Direction.Left);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleChoose(Direction.Right);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelSelection();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isAiThinking, handleChoose, cancelSelection]);

  if (!selectedCell || isAiThinking) return null;

  const getInfo = (dir: Direction) => directionInfos.find((d) => d.direction === dir)?.claimCount ?? 0;

  const dirs: Array<{ dir: Direction; label: string; icon: string }> = [
    { dir: Direction.Up,    label: 'Up',    icon: '⬆' },
    { dir: Direction.Down,  label: 'Down',  icon: '⬇' },
    { dir: Direction.Left,  label: 'Left',  icon: '⬅' },
    { dir: Direction.Right, label: 'Right', icon: '➡' },
  ];

  return (
    <div className="w-full max-w-[460px] mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-amber-300/60 animate-slide-up">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
            Step 2
          </span>
          <span className="text-xs font-semibold text-stone-700">
            Stone at Row {selectedCell.row + 1}, Col {selectedCell.col + 1}
          </span>
        </div>
        <button
          onClick={cancelSelection}
          className="text-xs text-stone-500 hover:text-stone-800 transition-colors px-2 py-1 rounded-md hover:bg-stone-100 font-medium"
        >
          ✕ Change Cell
        </button>
      </div>

      <p className="text-xs text-stone-600 mb-3 font-medium">
        Choose a direction to cast your shadow and claim empty territory:
      </p>

      {/* 4 Big Directional Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {dirs.map(({ dir, label, icon }) => {
          const count = getInfo(dir);
          const isHovered = previewDirection === dir;

          return (
            <button
              key={dir}
              onClick={() => handleChoose(dir)}
              onMouseEnter={() => previewDir(dir)}
              onTouchStart={() => previewDir(dir)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl border font-medium text-sm transition-all active:scale-95 shadow-sm ${
                isHovered
                  ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/25 ring-2 ring-amber-400'
                  : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-amber-50 hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <span className="font-semibold">{label}</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                  isHovered
                    ? 'bg-white/30 text-white'
                    : count > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                +{count} {count === 1 ? 'cell' : 'cells'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 text-center text-[11px] text-stone-400">
        💡 Tip: You can also use keyboard Arrow Keys (↑ ↓ ← →) or WASD
      </div>
    </div>
  );
}
