'use client';

import { useGameStore } from '../store/gameStore';
import { encodeMove } from '../engine/index';

export function MoveHistory() {
  const history = useGameStore((s) => s.gameState.history);

  if (history.length === 0) {
    return (
      <div className="text-center text-xs text-stoneBlack/30 py-4">
        No moves yet
      </div>
    );
  }

  // Group into pairs (White, Black)
  const pairs: Array<{ n: number; white: string; black?: string }> = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      n: Math.floor(i / 2) + 1,
      white: encodeMove(history[i]),
      black: i + 1 < history.length ? encodeMove(history[i + 1]) : undefined,
    });
  }

  return (
    <div className="max-h-48 overflow-y-auto scrollbar-thin pr-1">
      <table className="w-full text-xs tabular-nums">
        <thead>
          <tr className="text-stoneBlack/40 uppercase tracking-wider">
            <th className="w-8 text-left font-medium">#</th>
            <th className="text-left font-medium">White</th>
            <th className="text-left font-medium">Black</th>
          </tr>
        </thead>
        <tbody>
          {pairs.map((p) => (
            <tr key={p.n} className="border-t border-paper-dark/30">
              <td className="py-0.5 text-stoneBlack/35">{p.n}</td>
              <td className="py-0.5 text-stoneBlack/70 font-medium">{p.white}</td>
              <td className="py-0.5 text-stoneBlack/70 font-medium">{p.black ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
