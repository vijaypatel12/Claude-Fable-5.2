'use client';

import { useMemo, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { useTutorialStore } from '../store/tutorialStore';
import {
  Cell, Player, Direction,
  type Coord,
  BOARD_ROWS, BOARD_COLS,
  stoneFor, setCell, shadowPreview,
} from '../engine/index';
import type { CandidateMove } from '../ai/analysis';

const S   = 62;
const PAD = 16;
const W   = BOARD_COLS * S + PAD * 2;
const H   = BOARD_ROWS * S + PAD * 2;
const R   = S * 0.37;

const COL = {
  empty:      '#faf6ee',
  whiteClaim: '#e6d9c4',
  blackClaim: '#7a736d',
  grid:       '#d4c8b0',
  gold:       '#c4a35a',
  preview:    'rgba(196,163,90,0.35)',
  hint:       'rgba(90,163,196,0.40)',
  candidate:  'rgba(130,200,130,0.35)',
  candidateShadow: 'rgba(130,200,130,0.25)',
  tutTarget:  'rgba(196,163,90,0.20)',
};

function cellFill(cell: Cell): string {
  switch (cell) {
    case Cell.WhiteClaimed: return COL.whiteClaim;
    case Cell.BlackClaimed: return COL.blackClaim;
    default:                return COL.empty;
  }
}

const ARROW: Record<Direction, string> = {
  [Direction.Up]:    '0,-18 -10,0 10,0',
  [Direction.Down]:  '0,18 -10,0 10,0',
  [Direction.Left]:  '-18,0 0,-10 0,10',
  [Direction.Right]: '18,0 0,-10 0,10',
};

const ARROW_OFF: Record<Direction, { dx: number; dy: number }> = {
  [Direction.Up]:    { dx: 0,          dy: -S / 2 - 4 },
  [Direction.Down]:  { dx: 0,          dy:  S / 2 + 4 },
  [Direction.Left]:  { dx: -S / 2 - 4, dy: 0 },
  [Direction.Right]: { dx:  S / 2 + 4, dy: 0 },
};

const LABEL_OFF: Record<Direction, { dx: number; dy: number }> = {
  [Direction.Up]:    { dx: 0,           dy: -S / 2 - 20 },
  [Direction.Down]:  { dx: 0,           dy:  S / 2 + 24 },
  [Direction.Left]:  { dx: -S / 2 - 20, dy: 4 },
  [Direction.Right]: { dx:  S / 2 + 20, dy: 4 },
};

interface Props {
  candidateHighlight?: CandidateMove | null;
}

export function Board({ candidateHighlight }: Props) {
  const gameState          = useGameStore((s) => s.gameState);
  const selectedCell       = useGameStore((s) => s.selectedCell);
  const directionInfos     = useGameStore((s) => s.directionInfos);
  const shadowPreviewCells = useGameStore((s) => s.shadowPreviewCells);
  const previewDirection   = useGameStore((s) => s.previewDirection);
  const isAiThinking       = useGameStore((s) => s.isAiThinking);
  const hintMove           = useGameStore((s) => s.hintMove);
  const selectCell         = useGameStore((s) => s.selectCell);
  const previewDir         = useGameStore((s) => s.previewDir);
  const confirmDirection   = useGameStore((s) => s.confirmDirection);
  const cancelSelection    = useGameStore((s) => s.cancelSelection);

  const { onStonePlaced, onDirectionChosen, currentStep } = useTutorialStore();

  const board = gameState.board;
  const currentPlayer = gameState.currentPlayer;

  // hint coord from store hint move
  const hintCoord = useMemo(() => {
    if (!hintMove || hintMove.kind !== 'place') return null;
    return hintMove.coord;
  }, [hintMove]);

  // hint dir from store hint move
  const hintDir = useMemo(() => {
    if (!hintMove || hintMove.kind !== 'place') return null;
    return hintMove.direction;
  }, [hintMove]);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (isAiThinking) return;
      if (selectedCell && selectedCell.row === r && selectedCell.col === c) {
        cancelSelection();
        return;
      }
      selectCell({ row: r, col: c });
      onStonePlaced();
    },
    [isAiThinking, selectedCell, selectCell, cancelSelection, onStonePlaced],
  );

  const handleArrowClick = useCallback(
    (dir: Direction) => {
      confirmDirection(dir);
      onDirectionChosen();
    },
    [confirmDirection, onDirectionChosen],
  );

  const handleArrowEnter = useCallback(
    (dir: Direction) => { previewDir(dir); },
    [previewDir],
  );

  const cx = (c: number) => PAD + c * S + S / 2;
  const cy = (r: number) => PAD + r * S + S / 2;

  // Tutorial target cell for step 1
  const tutTargetCell = currentStep === 1 ? { row: 3, col: 3 } : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[460px] mx-auto select-none"
      style={{ touchAction: 'manipulation' }}
    >
      <defs>
        <radialGradient id="wg" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#ddd0bb" />
        </radialGradient>
        <radialGradient id="bg" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#555" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
        <filter id="ss">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.25" />
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Board background */}
      <rect x="0" y="0" width={W} height={H} rx="10" fill="#f1ebe0" />

      {/* Grid cells */}
      {board.map((row, r) =>
        row.map((cell, c) => (
          <rect
            key={`c${r}-${c}`}
            x={PAD + c * S} y={PAD + r * S}
            width={S} height={S}
            fill={cellFill(cell)}
            stroke={COL.grid} strokeWidth={0.7}
            className="cell-hit"
            onClick={() => handleCellClick(r, c)}
          />
        )),
      )}

      {/* Tutorial target highlight */}
      {tutTargetCell && !selectedCell && board[tutTargetCell.row][tutTargetCell.col] === Cell.Empty && (
        <rect
          x={PAD + tutTargetCell.col * S + 2} y={PAD + tutTargetCell.row * S + 2}
          width={S - 4} height={S - 4} rx={5}
          fill={COL.tutTarget} stroke={COL.gold} strokeWidth={1.5}
          strokeDasharray="4 2"
          className="animate-pulse-soft"
        />
      )}

      {/* Candidate highlight (Why This Move?) */}
      {candidateHighlight && !selectedCell && (
        <>
          {/* Candidate stone cell */}
          <rect
            x={PAD + candidateHighlight.move.coord.col * S + 1}
            y={PAD + candidateHighlight.move.coord.row * S + 1}
            width={S - 2} height={S - 2} rx={4}
            fill={COL.candidate} stroke="rgba(80,180,80,0.5)" strokeWidth={2}
          />
          {/* Candidate shadow cells */}
          {candidateHighlight.shadowCells.map((sc, i) => (
            <rect
              key={`cs${i}`}
              x={PAD + sc.col * S + 3} y={PAD + sc.row * S + 3}
              width={S - 6} height={S - 6} rx={3}
              fill={COL.candidateShadow}
              className="animate-shadow-spread"
              style={{ animationDelay: `${i * 30}ms` }}
            />
          ))}
        </>
      )}

      {/* Shadow preview cells (from selection) */}
      {shadowPreviewCells.map((coord, i) => (
        <rect
          key={`sp${i}`}
          x={PAD + coord.col * S + 3} y={PAD + coord.row * S + 3}
          width={S - 6} height={S - 6} rx={4}
          fill={COL.preview}
          className="animate-shadow-spread"
          style={{ animationDelay: `${i * 40}ms` }}
        />
      ))}

      {/* Hint highlight */}
      {hintCoord && !selectedCell && !candidateHighlight && (
        <rect
          x={PAD + hintCoord.col * S + 2} y={PAD + hintCoord.row * S + 2}
          width={S - 4} height={S - 4} rx={5}
          fill={COL.hint} stroke="rgba(90,163,196,0.6)" strokeWidth={1.5}
          className="animate-pulse-soft"
        />
      )}

      {/* Stones */}
      {board.map((row, r) =>
        row.map((cell, c) => {
          if (cell !== Cell.WhiteStone && cell !== Cell.BlackStone) return null;
          return (
            <circle
              key={`s${r}-${c}`}
              cx={cx(c)} cy={cy(r)} r={R}
              fill={cell === Cell.WhiteStone ? 'url(#wg)' : 'url(#bg)'}
              stroke={cell === Cell.WhiteStone ? '#c0ad91' : '#111'}
              strokeWidth={1}
              filter="url(#ss)"
            />
          );
        }),
      )}

      {/* Selected cell preview + highlight */}
      {selectedCell && (
        <>
          <rect
            x={PAD + selectedCell.col * S} y={PAD + selectedCell.row * S}
            width={S} height={S}
            fill="none" stroke={COL.gold} strokeWidth={2.5} rx={3}
          />
          <circle
            cx={cx(selectedCell.col)} cy={cy(selectedCell.row)} r={R}
            fill={currentPlayer === Player.White ? 'url(#wg)' : 'url(#bg)'}
            opacity={0.5}
            stroke={currentPlayer === Player.White ? '#c0ad91' : '#111'}
            strokeWidth={0.8}
          />
        </>
      )}

      {/* Direction arrows */}
      {selectedCell &&
        directionInfos.map(({ direction, claimCount }) => {
          const off  = ARROW_OFF[direction];
          const loff = LABEL_OFF[direction];
          const x    = cx(selectedCell.col) + off.dx;
          const y    = cy(selectedCell.row) + off.dy;
          const lx   = cx(selectedCell.col) + loff.dx;
          const ly   = cy(selectedCell.row) + loff.dy;
          const isActive = previewDirection === direction;
          const isHintDir = hintDir === direction;

          return (
            <g
              key={direction}
              className="dir-arrow"
              onClick={() => handleArrowClick(direction)}
              onMouseEnter={() => handleArrowEnter(direction)}
            >
              <polygon
                points={ARROW[direction]}
                transform={`translate(${x},${y})`}
                fill={isActive || isHintDir ? COL.gold : '#8a7d6b'}
                stroke={isActive || isHintDir ? COL.gold : '#6b6155'}
                strokeWidth={isHintDir ? 2 : 1}
                strokeLinejoin="round"
                filter={isHintDir ? 'url(#glow)' : undefined}
              />
              <text
                x={lx} y={ly}
                textAnchor="middle"
                fontSize={11} fontWeight={600}
                fill={isActive || isHintDir ? COL.gold : '#8a7d6b'}
              >
                {claimCount}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
