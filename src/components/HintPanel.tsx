'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { computeFullHint, type CandidateMove } from '../ai/analysis';
import { isOver } from '../engine/index';
import type { Direction } from '../engine/index';

interface Props {
  onSelectCandidate?: (candidate: CandidateMove | null) => void;
}

export function HintPanel({ onSelectCandidate }: Props) {
  const gameState    = useGameStore((s) => s.gameState);
  const hintMove     = useGameStore((s) => s.hintMove);
  const isAiThinking = useGameStore((s) => s.isAiThinking);
  const clearHint    = useGameStore((s) => s.clearHint);

  const [loading,      setLoading]      = useState(false);
  const [candidates,   setCandidates]   = useState<CandidateMove[]>([]);
  const [explanation,  setExplanation]  = useState('');
  const [selected,     setSelected]     = useState<number | null>(null);
  const [visible,      setVisible]      = useState(false);

  const runHint = useCallback(() => {
    if (isOver(gameState) || isAiThinking) return;
    setLoading(true);
    setVisible(true);
    setSelected(null);
    onSelectCandidate?.(null);

    setTimeout(() => {
      const result = computeFullHint(gameState);
      setCandidates(result.candidates);
      setExplanation(result.explanation);
      setLoading(false);
    }, 20);
  }, [gameState, isAiThinking, onSelectCandidate]);

  // If a hint move arrived from the store, trigger panel
  useEffect(() => {
    if (hintMove) runHint();
  }, [hintMove]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectCandidate(idx: number) {
    if (selected === idx) {
      setSelected(null);
      onSelectCandidate?.(null);
    } else {
      setSelected(idx);
      onSelectCandidate?.(candidates[idx] ?? null);
    }
  }

  function close() {
    setVisible(false);
    setSelected(null);
    setCandidates([]);
    onSelectCandidate?.(null);
    clearHint();
  }

  if (!visible) return null;

  const dirLabel: Record<string, string> = { U: '↑', D: '↓', L: '←', R: '→' };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-white/50 shadow-lg p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-bold text-stoneBlack/80"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Why This Move?
        </h3>
        <button
          onClick={close}
          className="text-xs text-stoneBlack/40 hover:text-stoneBlack/70 transition-colors"
        >
          ✕ close
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-sm text-warmGold animate-pulse-soft">
          Analysing position…
        </div>
      ) : (
        <>
          {/* Explanation */}
          {explanation && (
            <p className="text-xs text-stoneBlack/60 mb-3 leading-relaxed bg-paper-light/60 rounded-lg px-3 py-2">
              {explanation}
            </p>
          )}

          {/* Candidates */}
          <div className="space-y-2">
            {candidates.map((cand, idx) => {
              const isSelected = selected === idx;
              const rank = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
              const dir = cand.move.direction as unknown as string;

              return (
                <button
                  key={idx}
                  onClick={() => selectCandidate(idx)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 border transition-all ${
                    isSelected
                      ? 'bg-warmGold/15 border-warmGold/40 shadow-sm'
                      : 'bg-paper-light/60 border-transparent hover:bg-paper-dark/20 hover:border-paper-dark/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{rank}</span>
                      <span className="text-xs font-semibold text-stoneBlack/70">
                        Row {cand.move.coord.row + 1}, Col {cand.move.coord.col + 1}{' '}
                        {dirLabel[dir] ?? dir}
                      </span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${
                      cand.score > 0 ? 'text-emerald-600' : cand.score < 0 ? 'text-red-500' : 'text-stoneBlack/40'
                    }`}>
                      {cand.score > 0 ? '+' : ''}{cand.score}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {cand.tags.map((tag, ti) => (
                      <span
                        key={ti}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-stoneBlack/8 text-stoneBlack/55 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
