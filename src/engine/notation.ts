// ─── Notation / serialization ──────────────────────────────────────────────
// Encodes/decodes game state to/from a compact string representation.

import {
  Cell, Player, Phase, Direction,
  type GameState, type Move, type PlacementMove,
} from './types';
import { BOARD_ROWS, BOARD_COLS } from './rules.config';
import { computeZobristHash } from './zobrist';

// ─── Cell encoding ─────────────────────────────────────────────────────────
const CELL_CHARS: Record<number, string> = {
  [Cell.Empty]:        '.',
  [Cell.WhiteStone]:   'W',
  [Cell.BlackStone]:   'B',
  [Cell.WhiteClaimed]: 'w',
  [Cell.BlackClaimed]: 'b',
};

const CHAR_TO_CELL: Record<string, Cell> = {
  '.': Cell.Empty,
  'W': Cell.WhiteStone,
  'B': Cell.BlackStone,
  'w': Cell.WhiteClaimed,
  'b': Cell.BlackClaimed,
};

// ─── Move notation ─────────────────────────────────────────────────────────
// Column labels: a-g, Row labels: 1-7 (row 0 = "7", row 6 = "1") — chess-like

function colLabel(col: number): string {
  return String.fromCharCode(97 + col); // a=0, b=1, ..., g=6
}

function rowLabel(row: number): string {
  return String(BOARD_ROWS - row); // row0="7", row6="1"
}

function parseCol(ch: string): number {
  return ch.charCodeAt(0) - 97;
}

function parseRow(ch: string): number {
  return BOARD_ROWS - parseInt(ch, 10);
}

/**
 * Encode a move to notation string.
 * Placement: "d4U" (column, row, direction)
 * Swap: "swap"
 */
export function encodeMove(move: Move): string {
  if (move.kind === 'swap') return 'swap';
  const { coord, direction } = move;
  return `${colLabel(coord.col)}${rowLabel(coord.row)}${direction}`;
}

/**
 * Decode a notation string to a move.
 */
export function decodeMove(notation: string): Move {
  if (notation === 'swap') return { kind: 'swap' };
  if (notation.length !== 3) throw new Error(`Invalid move notation: ${notation}`);

  const col = parseCol(notation[0]);
  const row = parseRow(notation[1]);
  const dir = notation[2] as Direction;

  if (![Direction.Up, Direction.Down, Direction.Left, Direction.Right].includes(dir)) {
    throw new Error(`Invalid direction: ${notation[2]}`);
  }

  return {
    kind: 'place',
    coord: { row, col },
    direction: dir,
  } as PlacementMove;
}

// ─── Full state encoding ──────────────────────────────────────────────────
/**
 * Encode a GameState to a compact string.
 *
 * Format:  <boardStr>|<player>|<phase>|<moveNum>|<swapped>|<moveHistory>
 *
 * Board: 49 chars (row-major), one char per cell.
 */
export function encode(state: GameState): string {
  // Board
  let boardStr = '';
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      boardStr += CELL_CHARS[state.board[r][c]];
    }
  }

  // Player
  const playerStr = state.currentPlayer === Player.White ? 'W' : 'B';

  // Phase
  const phaseMap: Record<Phase, string> = {
    [Phase.WhiteFirst]:  'WF',
    [Phase.PieResponse]: 'PR',
    [Phase.Normal]:      'N',
    [Phase.GameOver]:    'GO',
  };
  const phaseStr = phaseMap[state.phase];

  // Move history
  const histStr = state.history.map(encodeMove).join(',');

  // Swapped flag
  const swapStr = state.swapped ? '1' : '0';

  return `${boardStr}|${playerStr}|${phaseStr}|${state.moveNumber}|${swapStr}|${histStr}`;
}

/**
 * Decode a compact string back to a GameState.
 */
export function decode(encoded: string): GameState {
  const parts = encoded.split('|');
  if (parts.length !== 6) throw new Error('Invalid encoded state');

  const [boardStr, playerStr, phaseStr, moveNumStr, swapStr, histStr] = parts;

  // Board
  if (boardStr.length !== BOARD_ROWS * BOARD_COLS) {
    throw new Error('Invalid board string length');
  }
  const board: Cell[][] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < BOARD_COLS; c++) {
      const ch = boardStr[r * BOARD_COLS + c];
      if (!(ch in CHAR_TO_CELL)) throw new Error(`Invalid cell char: ${ch}`);
      row.push(CHAR_TO_CELL[ch]);
    }
    board.push(row);
  }

  // Player
  const currentPlayer = playerStr === 'W' ? Player.White : Player.Black;

  // Phase
  const phaseRevMap: Record<string, Phase> = {
    'WF': Phase.WhiteFirst,
    'PR': Phase.PieResponse,
    'N':  Phase.Normal,
    'GO': Phase.GameOver,
  };
  const phase = phaseRevMap[phaseStr];
  if (phase === undefined) throw new Error(`Invalid phase: ${phaseStr}`);

  // Move number
  const moveNumber = parseInt(moveNumStr, 10);

  // Swapped
  const swapped = swapStr === '1';

  // History
  const history: Move[] = histStr
    ? histStr.split(',').map(decodeMove)
    : [];

  // Recompute hash
  const zobristHash = computeZobristHash(board, currentPlayer);

  return {
    board,
    currentPlayer,
    phase,
    moveNumber,
    history,
    zobristHash,
    swapped,
  };
}
