// ─── Board utilities ───────────────────────────────────────────────────────
import { Cell, Player, type Board, type Coord } from './types.js';
import { BOARD_ROWS, BOARD_COLS } from './rules.config.js';

/**
 * Create a fresh empty board.
 */
export function emptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => Cell.Empty),
  );
}

/**
 * Return a new board with the cell at `coord` set to `cell`.
 * Does NOT mutate the input.
 */
export function setCell(board: Board, coord: Coord, cell: Cell): Board {
  return board.map((row, r) =>
    r === coord.row
      ? row.map((c, col) => (col === coord.col ? cell : c))
      : row,
  );
}

/**
 * Read the cell at `coord`.
 */
export function getCell(board: Board, coord: Coord): Cell {
  return board[coord.row][coord.col];
}

/**
 * Is `coord` within the board bounds?
 */
export function inBounds(coord: Coord): boolean {
  return (
    coord.row >= 0 &&
    coord.row < BOARD_ROWS &&
    coord.col >= 0 &&
    coord.col < BOARD_COLS
  );
}

/**
 * Return the stone Cell for a player.
 */
export function stoneFor(player: Player): Cell {
  return player === Player.White ? Cell.WhiteStone : Cell.BlackStone;
}

/**
 * Return the claimed Cell for a player.
 */
export function claimedFor(player: Player): Cell {
  return player === Player.White ? Cell.WhiteClaimed : Cell.BlackClaimed;
}

/**
 * Count the number of empty cells on the board.
 */
export function emptyCellCount(board: Board): number {
  let count = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === Cell.Empty) count++;
    }
  }
  return count;
}

/**
 * Return all empty cell coordinates.
 */
export function emptyCells(board: Board): Coord[] {
  const cells: Coord[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (board[r][c] === Cell.Empty) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

/**
 * Deep-clone a board (for safety / testing).
 */
export function cloneBoard(board: Board): Cell[][] {
  return board.map(row => [...row]);
}

