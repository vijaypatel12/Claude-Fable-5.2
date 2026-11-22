'use client';

import { useState } from 'react';
import { Player } from '../engine/index';
import { useGameStore, type GameMode } from '../store/gameStore';
import { useTutorialStore } from '../store/tutorialStore';
import type { Difficulty } from '../ai/index';

export function HomeScreen() {
  const startGame  = useGameStore((s) => s.startGame);
  const navigateTo = useGameStore((s) => s.navigateTo);
  const { startTutorial } = useTutorialStore();

  const [showSetup, setShowSetup] = useState(false);
  const [mode,       setMode]     = useState<GameMode>('computer');
  const [difficulty, setDiff]     = useState<Difficulty>('medium');
  const [color,      setColor]    = useState<Player>(Player.White);

  function handleStart() { startGame(mode, difficulty, color); }

  function handleTutorial() {
    startTutorial();
    startGame('computer', 'easy', Player.White);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1
          className="text-6xl md:text-7xl font-bold tracking-wider text-stoneBlack mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          CHHAYA
        </h1>
        <p className="text-sm tracking-[0.3em] uppercase text-stoneBlack/50 font-medium">
          Shadow Strategy
        </p>
        <div className="mt-4 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-warmGold to-transparent" />
      </div>

      {!showSetup ? (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <MenuButton onClick={() => { setMode('computer'); setShowSetup(true); }}>
            <span className="flex items-center justify-center gap-2">
              <span>🤖</span> Play vs Computer
            </span>
          </MenuButton>

          <MenuButton onClick={() => { setMode('local'); setShowSetup(true); }}>
            <span className="flex items-center justify-center gap-2">
              <span>👥</span> Play with a Friend (2 Players)
            </span>
          </MenuButton>

          <MenuButton onClick={handleTutorial}>
            <span className="flex items-center justify-center gap-2">
              <span>🎓</span> Interactive Tutorial
            </span>
          </MenuButton>

          <MenuButton onClick={() => navigateTo('howtoplay')} secondary>
            How to Play
          </MenuButton>
        </div>
      ) : (
        <div className="w-full max-w-sm animate-fade-in">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-xl border border-white/60">
            <h2 className="text-xl font-bold mb-4 text-center text-stoneBlack" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {mode === 'computer' ? 'Play vs Computer' : '2-Player Pass & Play'}
            </h2>

            {mode === 'computer' ? (
              <>
                <label className="block text-xs font-semibold text-stoneBlack/60 uppercase tracking-wider mb-2">
                  AI Difficulty
                </label>
                <div className="flex gap-2 mb-4">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDiff(d)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        difficulty === d
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                          : 'bg-paper-dark/40 text-stoneBlack/70 hover:bg-paper-dark/60'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-semibold text-stoneBlack/60 uppercase tracking-wider mb-2">
                  Play as
                </label>
                <div className="flex gap-2 mb-5">
                  {[
                    { label: 'White (Moves 1st)', value: Player.White },
                    { label: 'Black (Moves 2nd)', value: Player.Black },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => setColor(value)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        color === value
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                          : 'bg-paper-dark/40 text-stoneBlack/70 hover:bg-paper-dark/60'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border ${
                          value === Player.White
                            ? 'bg-stoneWhite border-stoneWhite-dark shadow-sm'
                            : 'bg-stoneBlack border-stoneBlack-light shadow-sm'
                        }`}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* 2-Player Local Explanation Card */
              <div className="space-y-3 mb-5 text-xs text-stone-700 bg-amber-50/60 p-4 rounded-xl border border-amber-200/60">
                <div className="font-semibold text-sm text-stone-800 flex items-center gap-2">
                  <span>🎮</span> Pass & Play Rules:
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-stoneWhite border border-stone-400 inline-block shrink-0 mt-0.5" />
                  <span><strong>Player 1 (White):</strong> Takes the first turn on this board.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-stoneBlack border border-stone-600 inline-block shrink-0 mt-0.5" />
                  <span><strong>Player 2 (Black):</strong> Plays next, and can choose the Pie Rule (Swap sides).</span>
                </div>
                <div className="text-stone-500 pt-1 border-t border-amber-200/50">
                  Both players take turns on this same screen!
                </div>
              </div>
            )}

            <button
              onClick={handleStart}
              className="w-full py-3.5 rounded-xl bg-stoneBlack text-white font-semibold text-sm hover:bg-stoneBlack-light transition-all shadow-md active:scale-98"
            >
              {mode === 'local' ? 'Start 2-Player Game' : 'Start Match'}
            </button>
            <button
              onClick={() => setShowSetup(false)}
              className="w-full py-2.5 mt-2 text-xs font-semibold text-stoneBlack/50 hover:text-stoneBlack/80 transition-colors"
            >
              ← Back to Menu
            </button>
          </div>
        </div>
      )}

      <p className="mt-12 text-xs text-stoneBlack/35">
        An abstract strategy board game of shadow and territory
      </p>
    </div>
  );
}

function MenuButton({
  children, onClick, secondary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${
        secondary
          ? 'bg-white/40 text-stoneBlack/60 hover:bg-white/60 border border-white/30'
          : 'bg-white/80 text-stoneBlack hover:bg-white border border-white/60 font-semibold'
      }`}
    >
      {children}
    </button>
  );
}
