// ─── Cell States ───────────────────────────────────────────────────────────
export enum Cell {
  Empty        = 0,
  WhiteStone   = 1,
  BlackStone   = 2,
  WhiteClaimed = 3,
  BlackClaimed = 4,
}

// ─── Players ───────────────────────────────────────────────────────────────
export enum Player {
  White = 1,
  Black = 2,
}

// ─── Directions ────────────────────────────────────────────────────────────
export enum Direction {
  Up    = 'U',
  Down  = 'D',
  Left  = 'L',
  Right = 'R',
}

// ─── Board coordinates (0-indexed) ─────────────────────────────────────────
export interface Coord {
  readonly row: number;   // 0 = top row
  readonly col: number;   // 0 = left column
}

// ─── A placement move ──────────────────────────────────────────────────────
export interface PlacementMove {
  readonly kind: 'place';
  readonly coord: Coord;
  readonly direction: Direction;
}

// ─── A pie-rule swap move ──────────────────────────────────────────────────
export interface SwapMove {
  readonly kind: 'swap';
}

// ─── Union of all move types ───────────────────────────────────────────────
export type Move = PlacementMove | SwapMove;

// ─── Game phase ────────────────────────────────────────────────────────────
export enum Phase {
  WhiteFirst   = 'WHITE_FIRST',   // White's opening move
  PieResponse  = 'PIE_RESPONSE',  // Black decides: play or swap
  Normal       = 'NORMAL',        // Standard alternating play
  GameOver     = 'GAME_OVER',
}

// ─── Immutable board type ──────────────────────────────────────────────────
export type Board = ReadonlyArray<ReadonlyArray<Cell>>;

// ─── Scores ────────────────────────────────────────────────────────────────
export interface Scores {
  readonly white: number;
  readonly black: number;
}

// ─── Full game state ───────────────────────────────────────────────────────
export interface GameState {
  readonly board: Board;
  readonly currentPlayer: Player;
  readonly phase: Phase;
  readonly moveNumber: number;
  readonly history: ReadonlyArray<Move>;
  readonly zobristHash: bigint;

  // Track if a swap happened (for display / notation purposes)
  readonly swapped: boolean;
}

