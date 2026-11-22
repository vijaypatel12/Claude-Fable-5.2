// ─── Move logic ────────────────────────────────────────────────────────────
import {
  Cell, Player, Direction, Phase,
  type Coord, type Move, type PlacementMove, type SwapMove,
  type GameState, type Board,
} from './types.js';
import {
  emptyBoard, setCell, getCell, inBounds,
  stoneFor, claimedFor, emptyCells, emptyCellCount,
} from './board.js';
import { computeZobristHash, updateZobristCell, toggleSideToMove } from './zobrist.js';
import { ALL_DIRECTIONS } from './rules.config.js';

// ─── Direction deltas ──────────────────────────────────────────────────────
const DELTA: Record<Direction, { dr: number; dc: number }> = {
  [Direction.Up]:    { dr: -1, dc:  0 },
  [Direction.Down]:  { dr:  1, dc:  0 },
  [Direction.Left]:  { dr:  0, dc: -1 },
  [Direction.Right]: { dr:  0, dc:  1 },
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function opponent(p: Player): Player {
  return p === Player.White ? Player.Black : Player.White;
}

// ─── New Game ──────────────────────────────────────────────────────────────
/**
 * Create a fresh game state.
 */
export function newGame(): GameState {
  const board = emptyBoard();
  const player = Player.White;
  return {
    board,
    currentPlayer: player,
    phase: Phase.WhiteFirst,
    moveNumber: 1,
    history: [],
    zobristHash: computeZobristHash(board, player),
    swapped: false,
  };
}

// ─── Shadow Preview ────────────────────────────────────────────────────────
/**
 * Compute the cells that a stone at `coord` would claim in `direction`.
 * The stone itself is assumed to already be placed on the board.
 * Returns an array of coordinates that the shadow touches (may be empty).
 */
export function shadowPreview(
  board: Board,
  coord: Coord,
  direction: Direction,
): Coord[] {
  const { dr, dc } = DELTA[direction];
  const result: Coord[] = [];

  let r = coord.row + dr;
  let c = coord.col + dc;

  while (inBounds({ row: r, col: c })) {
    const cell = getCell(board, { row: r, col: c });
    if (cell !== Cell.Empty) break;  // blocked by stone or claimed cell
    result.push({ row: r, col: c });
    r += dr;
    c += dc;
  }

  return result;
}

// ─── Legal Moves ───────────────────────────────────────────────────────────
/**
 * Return all legal moves for the current game state.
 */
export function legalMoves(state: GameState): Move[] {
  if (state.phase === Phase.GameOver) return [];

  // During pie response, Black can swap OR play normally
  if (state.phase === Phase.PieResponse) {
    const swap: SwapMove = { kind: 'swap' };
    const placements = placementMoves(state.board);
    return [swap, ...placements];
  }

  return placementMoves(state.board);
}

/**
 * Generate all placement moves (every empty cell × 4 directions).
 */
function placementMoves(board: Board): PlacementMove[] {
  const moves: PlacementMove[] = [];
  const empties = emptyCells(board);
  for (const coord of empties) {
    for (const dir of ALL_DIRECTIONS) {
      moves.push({ kind: 'place', coord, direction: dir as Direction });
    }
  }
  return moves;
}

// ─── Apply Move ────────────────────────────────────────────────────────────
/**
 * Apply a move to a game state, returning a new game state.
 * Does NOT mutate the input state.
 */
export function applyMove(state: GameState, move: Move): GameState {
  if (state.phase === Phase.GameOver) {
    throw new Error('Cannot apply move: game is over');
  }

  if (move.kind === 'swap') {
    return applySwap(state);
  }

  return applyPlacement(state, move);
}

function applySwap(state: GameState): GameState {
  if (state.phase !== Phase.PieResponse) {
    throw new Error('Swap is only allowed during pie response');
  }

  // Swap: Black takes White's position and vice versa.
  // The board stays the same, but the stone that was White's is now Black's
  // perspective, and the current player becomes White (the original White
  // player now controls Black, and the original Black player now controls White).
  //
  // After swap, the original Black player is now "White" and it's White's turn
  // (the new White, who was originally Black). But actually:
  //
  // Per standard pie rule: Black chooses to swap. This means Black takes over
  // White's position (the stone already placed). The player who was originally
  // White now becomes Black, and must play the next move as Black.
  //
  // After swap, it's the new Black's turn (original White player).
  // The stone on the board is now considered to belong to the new White (original Black).
  //
  // Implementation: the board stays identical. The swap just means:
  // - The stone on the board (WhiteStone) remains WhiteStone
  // - But the PLAYERS swap seats: who controls White vs Black swaps
  // - Next turn: it's the new-Black player's turn (the person who originally was White)
  //
  // Since our game state tracks color (not physical player identity), after a swap:
  // - currentPlayer becomes Black (the new Black, originally White)
  // - phase becomes Normal
  // - moveNumber increments

  return {
    board: state.board,
    currentPlayer: Player.Black,
    phase: Phase.Normal,
    moveNumber: state.moveNumber + 1,
    history: [...state.history, { kind: 'swap' } as SwapMove],
    zobristHash: state.zobristHash, // Board unchanged; recompute with new side
    swapped: true,
  };
}

function applyPlacement(state: GameState, move: PlacementMove): GameState {
  const { coord, direction } = move;
  const player = state.currentPlayer;

  // Validate: cell must be empty
  if (getCell(state.board, coord) !== Cell.Empty) {
    throw new Error(`Cell (${coord.row},${coord.col}) is not empty`);
  }

  // 1. Place the stone
  const stone = stoneFor(player);
  let board: Board = setCell(state.board, coord, stone);
  let hash = updateZobristCell(
    state.zobristHash, coord.row, coord.col, Cell.Empty, stone,
  );

  // 2. Cast shadow
  const claimed = claimedFor(player);
  const shadowCells = shadowPreview(board, coord, direction);
  for (const sc of shadowCells) {
    board = setCell(board, sc, claimed);
    hash = updateZobristCell(hash, sc.row, sc.col, Cell.Empty, claimed);
  }

  // 3. Toggle side to move
  hash = toggleSideToMove(hash);

  // 4. Determine next phase and player
  const nextPlayer = opponent(player);
  let nextPhase: Phase;

  if (emptyCellCount(board) === 0) {
    nextPhase = Phase.GameOver;
  } else if (state.phase === Phase.WhiteFirst) {
    nextPhase = Phase.PieResponse;
  } else {
    nextPhase = Phase.Normal;
  }

  return {
    board,
    currentPlayer: nextPlayer,
    phase: nextPhase,
    moveNumber: state.moveNumber + 1,
    history: [...state.history, move],
    zobristHash: hash,
    swapped: state.swapped,
  };
}

// ─── Game-over checks ──────────────────────────────────────────────────────
/**
 * Is the game over?
 */
export function isOver(state: GameState): boolean {
  return state.phase === Phase.GameOver;
}
