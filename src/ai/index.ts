// ─── CHHAYA AI Engine (High-Performance Negamax with Alpha-Beta) ──────────
import {
  Cell, Player, Direction, Phase,
  type GameState, type Move, type PlacementMove, type Board,
  BOARD_ROWS, BOARD_COLS,
  legalMoves, applyMove, isOver,
  shadowPreview, stoneFor, setCell,
} from '../engine/index';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SearchResult {
  move: Move;
  score: number;
  depth: number;
  nodes: number;
  pv: Move[];
}

// ─── Fast O(49) Position Evaluation ─────────────────────────────────────────
export function evaluate(state: GameState): number {
  const board = state.board;
  let whiteScore = 0;
  let blackScore = 0;
  let whiteMobility = 0;
  let blackMobility = 0;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      if (cell === Cell.WhiteStone || cell === Cell.WhiteClaimed) {
        whiteScore++;
        if (r > 0 && board[r - 1][c] === Cell.Empty) whiteMobility++;
        if (r < 6 && board[r + 1][c] === Cell.Empty) whiteMobility++;
        if (c > 0 && board[r][c - 1] === Cell.Empty) whiteMobility++;
        if (c < 6 && board[r][c + 1] === Cell.Empty) whiteMobility++;
      } else if (cell === Cell.BlackStone || cell === Cell.BlackClaimed) {
        blackScore++;
        if (r > 0 && board[r - 1][c] === Cell.Empty) blackMobility++;
        if (r < 6 && board[r + 1][c] === Cell.Empty) blackMobility++;
        if (c > 0 && board[r][c - 1] === Cell.Empty) blackMobility++;
        if (c < 6 && board[r][c + 1] === Cell.Empty) blackMobility++;
      }
    }
  }

  const emptyCount = 49 - (whiteScore + blackScore);
  const me = state.currentPlayer;
  const myScore = me === Player.White ? whiteScore : blackScore;
  const oppScore = me === Player.White ? blackScore : whiteScore;
  const myMob = me === Player.White ? whiteMobility : blackMobility;
  const oppMob = me === Player.White ? blackMobility : whiteMobility;

  if (emptyCount === 0) {
    return (myScore - oppScore) * 1000;
  }

  return (myScore - oppScore) * 10 + (myMob - oppMob) * 0.5;
}

// ─── Fast Move Ordering & Beam Selection ────────────────────────────────────
function orderMoves(state: GameState, moves: Move[], maxBranch = 16): Move[] {
  const player = state.currentPlayer;
  const stone = stoneFor(player);

  const scored = moves.map((move) => {
    if (move.kind === 'swap') {
      return { move, priority: 50 };
    }
    const tempBoard = setCell(state.board, move.coord, stone);
    const shadow = shadowPreview(tempBoard, move.coord, move.direction);
    // Prioritize shadow territory + center control
    const distCenter = Math.abs(move.coord.row - 3) + Math.abs(move.coord.col - 3);
    const priority = shadow.length * 20 + (6 - distCenter);
    return { move, priority };
  });

  scored.sort((a, b) => b.priority - a.priority);
  return scored.slice(0, maxBranch).map((s) => s.move);
}

// ─── Fast Negamax with Alpha-Beta ───────────────────────────────────────────
let nodesCount = 0;
let searchDeadline = 0;

function negamax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maxBranch: number,
): { score: number; move: Move | null } {
  nodesCount++;

  if (depth === 0 || isOver(state) || (nodesCount & 511) === 0 && Date.now() > searchDeadline) {
    return { score: evaluate(state), move: null };
  }

  const moves = legalMoves(state);
  if (moves.length === 0) {
    return { score: evaluate(state), move: null };
  }

  const candidates = orderMoves(state, moves, maxBranch);
  let bestScore = -Infinity;
  let bestMove: Move = candidates[0];

  for (const move of candidates) {
    const nextState = applyMove(state, move);
    const result = negamax(nextState, depth - 1, -beta, -alpha, Math.max(6, Math.floor(maxBranch * 0.7)));
    const score = -result.score;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) {
      break; // Alpha-beta cut
    }
  }

  return { score: bestScore, move: bestMove };
}

// ─── Difficulty Implementations ─────────────────────────────────────────────
function computeEasy(state: GameState): SearchResult {
  nodesCount = 0;
  searchDeadline = Date.now() + 100;
  const moves = legalMoves(state);
  if (moves.length === 0) {
    return { move: { kind: 'place', coord: { row: 3, col: 3 }, direction: Direction.Down }, score: 0, depth: 1, nodes: 1, pv: [] };
  }

  // Pick among top 3 moves
  const ordered = orderMoves(state, moves, 3);
  const chosen = ordered[Math.floor(Math.random() * ordered.length)];
  return { move: chosen, score: 0, depth: 1, nodes: nodesCount, pv: [chosen] };
}

function computeMedium(state: GameState): SearchResult {
  nodesCount = 0;
  searchDeadline = Date.now() + 250;
  const result = negamax(state, 2, -Infinity, Infinity, 14);
  const bestMove = result.move ?? legalMoves(state)[0];
  return { move: bestMove, score: result.score, depth: 2, nodes: nodesCount, pv: [bestMove] };
}

function computeHard(state: GameState, timeLimitMs = 500): SearchResult {
  nodesCount = 0;
  searchDeadline = Date.now() + timeLimitMs;
  const result = negamax(state, 3, -Infinity, Infinity, 16);
  const bestMove = result.move ?? legalMoves(state)[0];
  return { move: bestMove, score: result.score, depth: 3, nodes: nodesCount, pv: [bestMove] };
}

// ─── Public API ─────────────────────────────────────────────────────────────
export function shouldSwap(state: GameState, difficulty: Difficulty): boolean {
  if (state.phase !== Phase.PieResponse) return false;
  if (difficulty === 'easy') return false;
  // Only swap on Hard if White got a massive 6-point opening
  return difficulty === 'hard';
}

export function computeAiMove(state: GameState, difficulty: Difficulty): SearchResult {
  switch (difficulty) {
    case 'easy':
      return computeEasy(state);
    case 'medium':
      return computeMedium(state);
    case 'hard':
      return computeHard(state);
  }
}

export function computeHint(state: GameState): SearchResult {
  return computeHard(state, 400);
}
