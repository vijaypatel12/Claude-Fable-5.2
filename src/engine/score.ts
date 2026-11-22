// ─── Scoring ───────────────────────────────────────────────────────────────
import { Cell, Player, type Board, type Scores } from './types';
import { BOARD_ROWS, BOARD_COLS } from './rules.config';

/**
 * Count each player's score.
 * Score = own stones + own claimed cells.
 */
export function scores(board: Board): Scores {
  let white = 0;
  let black = 0;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      if (cell === Cell.WhiteStone || cell === Cell.WhiteClaimed) white++;
      else if (cell === Cell.BlackStone || cell === Cell.BlackClaimed) black++;
    }
  }
  return { white, black };
}

/**
 * Determine the winner from final scores.
 * Returns null if tie, otherwise the winning player.
 */
export function winner(board: Board): Player | null {
  const s = scores(board);
  if (s.white > s.black) return Player.White;
  if (s.black > s.white) return Player.Black;
  return null; // tie
}

