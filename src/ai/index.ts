// ─── CHHAYA AI Engine ──────────────────────────────────────────────────────
// Negamax search with alpha-beta pruning, iterative deepening,
// transposition table, and endgame solver.

import {
  Cell, Player, Direction, Phase,
  type GameState, type Move, type Board,
  BOARD_ROWS, BOARD_COLS,
  legalMoves, applyMove, isOver,
  scores, emptyCellCount, shadowPreview,
  stoneFor, setCell,
} from '../engine/index';

// ─── Types ─────────────────────────────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SearchResult {
  move: Move;
  score: number;
  depth: number;
  nodes: number;
  pv: Move[];
}

// ─── Transposition Table ───────────────────────────────────────────────────
const TT_EXACT = 0;
const TT_LOWER = 1;
const TT_UPPER = 2;

interface TTEntry {
  hash: bigint;
  depth: number;
  score: number;
  flag: number;
  move: Move | null;
}

class TranspositionTable {
  private table = new Map<string, TTEntry>();

  get(hash: bigint): TTEntry | undefined {
    return this.table.get(hash.toString());
  }

  set(hash: bigint, entry: TTEntry): void {
    const key = hash.toString();
    const existing = this.table.get(key);
    if (!existing || existing.depth <= entry.depth) {
      this.table.set(key, entry);
    }
  }

  clear(): void { this.table.clear(); }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function opponent(p: Player): Player {
  return p === Player.White ? Player.Black : Player.White;
}

// ─── Evaluation ────────────────────────────────────────────────────────────
const W1 = 0.3;

function lanePotential(board: Board, player: Player): number {
  const myStone = player === Player.White ? Cell.WhiteStone : Cell.BlackStone;
  const myClaim = player === Player.White ? Cell.WhiteClaimed : Cell.BlackClaimed;
  let total = 0;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      if (cell !== myStone && cell !== myClaim) continue;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        let nr = r + dr, nc = c + dc, len = 0;
        while (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS && board[nr][nc] === Cell.Empty) {
          len++; nr += dr; nc += dc;
        }
        total += len;
      }
    }
  }
  return total;
}

export function evaluate(state: GameState): number {
  const board = state.board;
  const s = scores(board);
  const me = state.currentPlayer;
  const myScore = me === Player.White ? s.white : s.black;
  const oppScore = me === Player.White ? s.black : s.white;
  const empty = emptyCellCount(board);

  if (empty === 0) return (myScore - oppScore) * 1000;

  const scoreDiff = myScore - oppScore;
  const laneDiff = lanePotential(board, me) - lanePotential(board, opponent(me));
  return scoreDiff + W1 * laneDiff;
}

// ─── Move Ordering ─────────────────────────────────────────────────────────
function movesEqual(a: Move, b: Move): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'swap') return true;
  if (a.kind === 'place' && b.kind === 'place') {
    return a.coord.row === b.coord.row && a.coord.col === b.coord.col && a.direction === b.direction;
  }
  return false;
}

function orderMoves(state: GameState, moves: Move[], ttMove: Move | null): Move[] {
  const scored = moves.map(move => {
    let priority = 0;
    if (ttMove && movesEqual(move, ttMove)) {
      priority = 10000;
    } else if (move.kind === 'place') {
      const tempBoard = setCell(state.board, move.coord, stoneFor(state.currentPlayer));
      const shadow = shadowPreview(tempBoard, move.coord, move.direction);
      priority = shadow.length * 10;
      const cr = Math.abs(move.coord.row - 3);
      const cc = Math.abs(move.coord.col - 3);
      priority += (6 - cr - cc);
    } else {
      priority = 5000;
    }
    return { move, priority };
  });
  scored.sort((a, b) => b.priority - a.priority);
  return scored.map(s => s.move);
}

// ─── Negamax with Alpha-Beta ───────────────────────────────────────────────
let nodesSearched = 0;
let searchCancelled = false;
let searchStartTime = 0;
let searchTimeLimit = 0;

function checkTime(): boolean {
  if (searchTimeLimit > 0 && (nodesSearched & 1023) === 0) {
    if (Date.now() - searchStartTime > searchTimeLimit) {
      searchCancelled = true;
    }
  }
  return searchCancelled;
}

function negamax(
  state: GameState, depth: number, alpha: number, beta: number, tt: TranspositionTable,
): { score: number; move: Move | null; pv: Move[] } {
  if (checkTime()) return { score: 0, move: null, pv: [] };
  nodesSearched++;

  // TT lookup
  const ttEntry = tt.get(state.zobristHash);
  let ttMove: Move | null = null;
  if (ttEntry && ttEntry.hash === state.zobristHash) {
    ttMove = ttEntry.move;
    if (ttEntry.depth >= depth) {
      if (ttEntry.flag === TT_EXACT) {
        return { score: ttEntry.score, move: ttEntry.move, pv: ttEntry.move ? [ttEntry.move] : [] };
      }
      if (ttEntry.flag === TT_LOWER) alpha = Math.max(alpha, ttEntry.score);
      if (ttEntry.flag === TT_UPPER) beta = Math.min(beta, ttEntry.score);
      if (alpha >= beta) {
        return { score: ttEntry.score, move: ttEntry.move, pv: ttEntry.move ? [ttEntry.move] : [] };
      }
    }
  }

  if (depth === 0 || isOver(state)) {
    return { score: evaluate(state), move: null, pv: [] };
  }

  const moves = legalMoves(state);
  if (moves.length === 0) return { score: evaluate(state), move: null, pv: [] };

  const orderedMoves = orderMoves(state, moves, ttMove);
  const origAlpha = alpha;
  let bestMove = orderedMoves[0];
  let bestScore = -Infinity;
  let bestPV: Move[] = [];

  for (const move of orderedMoves) {
    if (searchCancelled) break;
    const child = applyMove(state, move);
    const result = negamax(child, depth - 1, -beta, -alpha, tt);
    const score = -result.score;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      bestPV = [move, ...result.pv];
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }

  if (!searchCancelled) {
    let flag: number;
    if (bestScore <= origAlpha) flag = TT_UPPER;
    else if (bestScore >= beta) flag = TT_LOWER;
    else flag = TT_EXACT;
    tt.set(state.zobristHash, { hash: state.zobristHash, depth, score: bestScore, flag, move: bestMove });
  }

  return { score: bestScore, move: bestMove, pv: bestPV };
}

// ─── Pie Rule Decision ────────────────────────────────────────────────────
export function shouldSwap(state: GameState, difficulty: Difficulty): boolean {
  if (state.phase !== Phase.PieResponse) return false;
  if (difficulty === 'easy') return false;
  const s = scores(state.board);
  if (s.white >= 4) return true;
  if (difficulty === 'hard') {
    const tt = new TranspositionTable();
    nodesSearched = 0; searchCancelled = false; searchTimeLimit = 500; searchStartTime = Date.now();
    const r = negamax(state, 4, -Infinity, Infinity, tt);
    return r.score < -2;
  }
  return s.white >= 4;
}

// ─── Difficulty Implementations ────────────────────────────────────────────
function computeEasy(state: GameState): SearchResult {
  const tt = new TranspositionTable();
  nodesSearched = 0; searchCancelled = false; searchTimeLimit = 0;

  const moves = legalMoves(state);
  const results: Array<{ move: Move; score: number; pv: Move[] }> = [];

  for (const move of moves) {
    const child = applyMove(state, move);
    const r = negamax(child, 1, -Infinity, Infinity, tt);
    results.push({ move, score: -r.score, pv: [move, ...r.pv] });
  }

  results.sort((a, b) => b.score - a.score);
  const topN = Math.min(3, results.length);
  const pick = results[Math.floor(Math.random() * topN)];

  return { move: pick.move, score: pick.score, depth: 2, nodes: nodesSearched, pv: pick.pv };
}

function computeMedium(state: GameState): SearchResult {
  const tt = new TranspositionTable();
  nodesSearched = 0; searchCancelled = false; searchTimeLimit = 5000; searchStartTime = Date.now();

  const result = negamax(state, Math.random() < 0.15 ? 2 : 4, -Infinity, Infinity, tt);

  return { move: result.move!, score: result.score, depth: 4, nodes: nodesSearched, pv: result.pv };
}

function computeHard(state: GameState, timeBudgetMs = 1500): SearchResult {
  const tt = new TranspositionTable();
  nodesSearched = 0; searchCancelled = false; searchStartTime = Date.now(); searchTimeLimit = timeBudgetMs;

  const empty = emptyCellCount(state.board);
  if (empty <= 12) {
    searchTimeLimit = timeBudgetMs * 2;
    const r = negamax(state, empty, -Infinity, Infinity, tt);
    if (r.move) return { move: r.move, score: r.score, depth: empty, nodes: nodesSearched, pv: r.pv };
  }

  let best: { move: Move | null; score: number; pv: Move[] } = { move: null, score: 0, pv: [] };
  let completedDepth = 0;

  for (let depth = 1; depth <= 50; depth++) {
    searchCancelled = false;
    const r = negamax(state, depth, -Infinity, Infinity, tt);
    if (!searchCancelled && r.move) { best = r; completedDepth = depth; }
    if (Date.now() - searchStartTime > timeBudgetMs) break;
  }

  if (!best.move) best.move = legalMoves(state)[0];

  return { move: best.move!, score: best.score, depth: completedDepth, nodes: nodesSearched, pv: best.pv };
}

// ─── Public API ────────────────────────────────────────────────────────────
export function computeAiMove(state: GameState, difficulty: Difficulty): SearchResult {
  if (state.phase === Phase.PieResponse && shouldSwap(state, difficulty)) {
    return { move: { kind: 'swap' }, score: 0, depth: 0, nodes: 1, pv: [{ kind: 'swap' }] };
  }
  switch (difficulty) {
    case 'easy': return computeEasy(state);
    case 'medium': return computeMedium(state);
    case 'hard': return computeHard(state);
  }
}

export function computeHint(state: GameState): SearchResult {
  return computeHard(state, 1000);
}
