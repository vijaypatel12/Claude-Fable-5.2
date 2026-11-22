'use client';

import { Player } from '../engine/index';
import { useGameStore, type GameMode } from '../store/gameStore';
import type { Difficulty } from '../ai/index';
import { useState } from 'react';

export function HomeScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const navigateTo = useGameStore((s) => s.navigateTo);
  const [showSetup, setShowSetup] = useState(false);
  const [mode, setMode] = useState<GameMode>('computer');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [color, setColor] = useState<Player>(Player.White);

  function handleStart() {
    startGame(mode, difficulty, color);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="mb-12 text-center">
        <h1
          className="text-6xl md:text-7xl font-bold tracking-wider text-stoneBlack mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          CHHAYA
        </h1>
        <p className="text-sm tracking-[0.3em] uppercase text-stoneBlack/50 font-medium">
          Shadow Strategy
        </p>
        {/* Decorative line */}
        <div className="mt-4 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-warmGold to-transparent" />
      </div>

      {!showSetup ? (
        /* Main Menu */
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <MenuButton onClick={() => { setMode('computer'); setShowSetup(true); }}>
            Play vs Computer
          </MenuButton>
          <MenuButton onClick={() => { setMode('local'); setShowSetup(true); }}>
            Play with a Friend
          </MenuButton>
          <MenuButton onClick={() => navigateTo('howtoplay')} secondary>
            How to Play
          </MenuButton>
        </div>
      ) : (
        /* Setup Panel */
        <div className="w-full max-w-xs animate-fade-in">
          <div className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/40">
            <h2 className="text-lg font-semibold mb-4 text-center text-stoneBlack/80">
              {mode === 'computer' ? 'vs Computer' : 'Local Game'}
            </h2>

            {mode === 'computer' && (
              <>
                {/* Difficulty */}
                <label className="block text-xs font-medium text-stoneBlack/60 uppercase tracking-wider mb-2">
                  Difficulty
                </label>
                <div className="flex gap-2 mb-4">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        difficulty === d
                          ? 'bg-warmGold text-white shadow-md'
                          : 'bg-paper-dark/40 text-stoneBlack/60 hover:bg-paper-dark/60'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                {/* Color */}
                <label className="block text-xs font-medium text-stoneBlack/60 uppercase tracking-wider mb-2">
                  Play as
                </label>
                <div className="flex gap-2 mb-5">
                  {[
                    { label: 'White', value: Player.White },
                    { label: 'Black', value: Player.Black },
                  ].map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => setColor(value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        color === value
                          ? 'bg-warmGold text-white shadow-md'
                          : 'bg-paper-dark/40 text-stoneBlack/60 hover:bg-paper-dark/60'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border ${
                          value === Player.White
                            ? 'bg-stoneWhite border-stoneWhite-dark'
                            : 'bg-stoneBlack border-stoneBlack-light'
                        }`}
                      />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={handleStart}
              className="w-full py-3 rounded-xl bg-stoneBlack text-white font-semibold text-sm hover:bg-stoneBlack-light transition-colors shadow-md"
            >
              Start Game
            </button>
            <button
              onClick={() => setShowSetup(false)}
              className="w-full py-2 mt-2 text-sm text-stoneBlack/50 hover:text-stoneBlack/80 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-16 text-xs text-stoneBlack/30">
        An abstract strategy game of shadow and territory
      </p>
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  secondary,
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
          : 'bg-white/70 text-stoneBlack hover:bg-white/90 border border-white/50'
      }`}
    >
      {children}
    </button>
  );
}
