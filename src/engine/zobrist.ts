// ─── Zobrist hashing ───────────────────────────────────────────────────────
// Provides incremental hashing for transposition tables / repetition checks.

import { Cell, Player, type Board } from './types.js';
import { BOARD_ROWS, BOARD_COLS } from './rules.config.js';

// Number of distinct cell states (Empty=0, WhiteStone=1, BlackStone=2,
// WhiteClaimed=3, BlackClaimed=4)
const NUM_CELL_STATES = 5;

// ─── Deterministic PRNG (xoshiro256**) for reproducible tables ─────────────
function splitmix64(seed: bigint): bigint {
  let z = seed + 0x9e3779b97f4a7c15n;
  z = (z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n;
  z = (z ^ (z >> 27n)) * 0x94d049bb133111ebn;
  return (z ^ (z >> 31n)) & 0xFFFFFFFFFFFFFFFFn;
}

function generateTable(): bigint[][] {
  const table: bigint[][] = [];
  let seed = 0x4368686179615A6Fn; // "ChhayaZo" in hex

  for (let pos = 0; pos < BOARD_ROWS * BOARD_COLS; pos++) {
    const row: bigint[] = [];
    for (let state = 0; state < NUM_CELL_STATES; state++) {
      seed = splitmix64(BigInt(seed));
      row.push(seed);
    }
    table.push(row);
  }
  return table;
}

/** Zobrist table: zobristTable[position][cellState] → random bigint */
const zobristTable: bigint[][] = generateTable();

/** Random value XOR'd when it is Black's turn. */
export const ZOBRIST_BLACK_TO_MOVE: bigint = splitmix64(0xDEADBEEFCAFEBABEn);

/**
 * Compute the full Zobrist hash from scratch for a board + current player.
 */
export function computeZobristHash(board: Board, currentPlayer: Player): bigint {
  let hash = 0n;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const pos = r * BOARD_COLS + c;
      const cellVal: number = board[r][c];
      hash ^= zobristTable[pos][cellVal];
    }
  }
  if (currentPlayer === Player.Black) {
    hash ^= ZOBRIST_BLACK_TO_MOVE;
  }
  return hash;
}

/**
 * Incrementally update a Zobrist hash when a single cell changes.
 */
export function updateZobristCell(
  hash: bigint,
  row: number,
  col: number,
  oldCell: Cell,
  newCell: Cell,
): bigint {
  const pos = row * BOARD_COLS + col;
  // XOR out old, XOR in new
  hash ^= zobristTable[pos][oldCell as number];
  hash ^= zobristTable[pos][newCell as number];
  return hash;
}

/**
 * Toggle the side-to-move component of the hash.
 */
export function toggleSideToMove(hash: bigint): bigint {
  return hash ^ ZOBRIST_BLACK_TO_MOVE;
}

