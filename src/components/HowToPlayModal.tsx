'use client';

import { useGameStore } from '../store/gameStore';

export function HowToPlayModal() {
  const navigateTo = useGameStore((s) => s.navigateTo);

  return (
    <div className="min-h-screen flex items-start justify-center p-4 py-10">
      <div className="bg-white/70 backdrop-blur rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-lg border border-white/40 animate-fade-in">
        <h2
          className="text-2xl font-bold text-stoneBlack mb-5 text-center"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          How to Play CHHAYA
        </h2>

        <div className="space-y-4 text-sm text-stoneBlack/70 leading-relaxed">
          <Section title="Objective">
            Control the most territory on the 7×7 board. Your score equals your
            stones plus your claimed cells. The player with the higher score wins.
          </Section>

          <Section title="Your Turn">
            <ol className="list-decimal pl-4 space-y-1">
              <li>Select any <strong>empty cell</strong> and place your stone.</li>
              <li>Choose a <strong>direction</strong> (↑ ↓ ← →) to cast a shadow.</li>
              <li>Every consecutive empty cell in that direction becomes <strong>claimed</strong> by you.</li>
            </ol>
          </Section>

          <Section title="Shadow Rules">
            The shadow stops before: the board edge, any existing stone, or any
            already-claimed cell. A zero-length shadow (hitting a boundary or
            obstacle immediately) is legal. All stones and claims are permanent.
          </Section>

          <Section title="Pie Rule">
            After White&apos;s very first move, Black may choose to <strong>swap
            positions</strong> — taking control of White&apos;s pieces. This balances the
            first-move advantage.
          </Section>

          <Section title="Game End">
            The game ends when no empty cells remain. The player with the most
            stones + claimed cells wins.
          </Section>
        </div>

        <button
          onClick={() => navigateTo('home')}
          className="mt-6 w-full py-3 rounded-xl bg-stoneBlack text-white font-semibold text-sm hover:bg-stoneBlack-light transition-colors"
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-stoneBlack/80 mb-1">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
