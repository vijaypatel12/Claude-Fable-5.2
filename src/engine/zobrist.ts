// ─── Zobrist hashing ───────────────────────────────────────────────────────
import { Cell, Player, type Board } from './types';
import { BOARD_ROWS, BOARD_COLS } from './rules.config';

const NUM_CELL_STATES = 5;

// BigInt constants using constructor to satisfy strict TS targets
const C1 = BigInt('0x9e3779b97f4a7c15');
const M1 = BigInt('0xbf58476d1ce4e5b9');
const M2 = BigInt('0x94d049bb133111eb');
const MASK64 = BigInt('0xFFFFFFFFFFFFFFFF');
const S30 = BigInt(30);
const S27 = BigInt(27);
const S31 = BigInt(31);
const SEED_INIT = BigInt('0x4368686179615A6F'); // "ChhayaZo"
const SEED_SIDE = BigInt('0xDEADBEEFCAFEBABE');
const ZERO = BigInt(0);

function splitmix64(seed: bigint): bigint {
  let z = (seed + C1) & MASK64;
  z = ((z ^ (z >> S30)) * M1) & MASK64;
  z = ((z ^ (z >> S27)) * M2) & MASK64;
  return (z ^ (z >> S31)) & MASK64;
}

function generateTable(): bigint[][] {
  const table: bigint[][] = [];
  let seed = SEED_INIT;
  for (let pos = 0; pos < BOARD_ROWS * BOARD_COLS; pos++) {
    const row: bigint[] = [];
    for (let state = 0; state < NUM_CELL_STATES; state++) {
      seed = splitmix64(seed);
      row.push(seed);
    }
    table.push(row);
  }
  return table;
}

const zobristTable: bigint[][] = generateTable();
export const ZOBRIST_BLACK_TO_MOVE: bigint = splitmix64(SEED_SIDE);

export function computeZobristHash(board: Board, currentPlayer: Player): bigint {
  let hash = ZERO;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const pos = r * BOARD_COLS + c;
      const cellVal: number = board[r][c] as number;
      hash ^= zobristTable[pos][cellVal];
    }
  }
  if (currentPlayer === Player.Black) {
    hash ^= ZOBRIST_BLACK_TO_MOVE;
  }
  return hash;
}

export function updateZobristCell(
  hash: bigint,
  row: number,
  col: number,
  oldCell: Cell,
  newCell: Cell,
): bigint {
  const pos = row * BOARD_COLS + col;
  hash ^= zobristTable[pos][oldCell as number];
  hash ^= zobristTable[pos][newCell as number];
  return hash;
}

export function toggleSideToMove(hash: bigint): bigint {
  return hash ^ ZOBRIST_BLACK_TO_MOVE;
}
