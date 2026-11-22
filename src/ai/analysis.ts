// ─── AI Analysis: candidate moves + explanations ───────────────────────────
import {
  Cell, Player, Direction,
  type GameState, type Move, type PlacementMove, type Board,
  BOARD_ROWS, BOARD_COLS,
  legalMoves, applyMove,
  scores, emptyCellCount, shadowPreview,
  stoneFor, setCell,
} from '../engine/index';
import { evaluate, computeHint, type SearchResult } from './index';

export interface CandidateMove {
  move: PlacementMove;
  score: number;
  claimCount: number;
  tags: string[];
  shadowCells: { row: number; col: number }[];
}

export interface HintResult {
  search: SearchResult;
  candidates: CandidateMove[];
  explanation: string;
}

// ─── Lane analysis helpers ─────────────────────────────────────────────────
function longestOpenLane(board: Board, player: Player): number {
  const opp = player === Player.White ? Player.Black : Player.White;
  const oppStone = opp === Player.White ? Cell.WhiteStone : Cell.BlackStone;
  const oppClaim = opp === Player.White ? Cell.WhiteClaimed : Cell.BlackClaimed;
  let best = 0;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === oppStone || board[r][c] === oppClaim) {
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          let nr = r + dr, nc = c + dc, len = 0;
          while (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS && board[nr][nc] === Cell.Empty) {
            len++; nr += dr; nc += dc;
          }
          if (len > best) best = len;
        }
      }
    }
  }
  return best;
}

// ─── Generate tags from engine data ───────────────────────────────────────
function generateTags(
  before: GameState,
  move: PlacementMove,
  claimCount: number,
  shadowCells: { row: number; col: number }[],
): string[] {
  const tags: string[] = [];
  const after = applyMove(before, move);

  const sBefore = scores(before.board);
  const sAfter  = scores(after.board);
  const me = before.currentPlayer;

  // Claims
  if (claimCount >= 5) tags.push(`Claims ${claimCount} cells`);
  else if (claimCount >= 3) tags.push(`Claims ${claimCount} cells`);
  else if (claimCount === 1) tags.push('Claims 1 cell');
  else if (claimCount === 0) tags.push('Zero-shadow — safe placement');

  // Score gain
  const myBefore = me === Player.White ? sBefore.white : sBefore.black;
  const myAfter  = me === Player.White ? sAfter.white  : sAfter.black;
  const gain     = myAfter - myBefore;
  if (gain >= 4) tags.push(`+${gain} points this turn`);

  // Opponent lane cut
  const oppLaneBefore = longestOpenLane(before.board, me);
  const oppLaneAfter  = longestOpenLane(after.board, me);
  if (oppLaneBefore - oppLaneAfter >= 3) {
    tags.push(`Cuts opponent's lane from ${oppLaneBefore} → ${oppLaneAfter}`);
  } else if (oppLaneBefore - oppLaneAfter >= 2) {
    tags.push(`Reduces opponent's lane from ${oppLaneBefore} → ${oppLaneAfter}`);
  }

  // Centre control
  const { row, col } = move.coord;
  if (row >= 2 && row <= 4 && col >= 2 && col <= 4) {
    tags.push('Controls the centre');
  }

  // Shadow direction benefit
  if (claimCount >= 4) {
    const dirLabel: Record<Direction, string> = {
      [Direction.Up]:    'up',
      [Direction.Down]:  'down',
      [Direction.Left]:  'left',
      [Direction.Right]: 'right',
    };
    tags.push(`Long ${dirLabel[move.direction]} shadow`);
  }

  // Blocks opponent future play
  const empBefore = emptyCellCount(before.board);
  const empAfter  = emptyCellCount(after.board);
  if (empBefore - empAfter > claimCount + 1) {
    tags.push('Blocks open space');
  }

  return tags.slice(0, 3); // cap at 3 tags
}

// ─── Top 3 candidates ─────────────────────────────────────────────────────
export function computeCandidates(state: GameState): CandidateMove[] {
  const moves = legalMoves(state).filter((m): m is PlacementMove => m.kind === 'place');
  if (moves.length === 0) return [];

  const scored = moves.map(move => {
    const tempBoard = setCell(state.board, move.coord, stoneFor(state.currentPlayer));
    const shadow    = shadowPreview(tempBoard, move.coord, move.direction);
    const after     = applyMove(state, move);
    const ev        = evaluate(after);
    return { move, ev, shadow };
  });

  scored.sort((a, b) => b.ev - a.ev);
  const top3 = scored.slice(0, 3);

  return top3.map(({ move, ev, shadow }) => {
    const tags = generateTags(state, move, shadow.length, shadow);
    return {
      move,
      score: Math.round(ev * 10) / 10,
      claimCount: shadow.length,
      tags,
      shadowCells: shadow,
    };
  });
}

// ─── Full hint with explanation ────────────────────────────────────────────
export function computeFullHint(state: GameState): HintResult {
  const search     = computeHint(state);
  const candidates = computeCandidates(state);

  let explanation = 'Best move found by AI search.';
  if (candidates.length > 0) {
    const best = candidates[0];
    if (best.claimCount >= 5) {
      explanation = `Claims ${best.claimCount} cells — maximum territory gain.`;
    } else if (best.tags.length > 0) {
      explanation = best.tags[0] + '.';
    }
  }

  return { search, candidates, explanation };
}
