// ─── Public API barrel export ──────────────────────────────────────────────
export {
  Cell, Player, Direction, Phase,
  type Coord, type Move, type PlacementMove, type SwapMove,
  type GameState, type Board, type Scores,
} from './types.js';

export { BOARD_ROWS, BOARD_COLS, TOTAL_CELLS, ALL_DIRECTIONS } from './rules.config.js';

export {
  emptyBoard, setCell, getCell, inBounds,
  stoneFor, claimedFor, emptyCellCount, emptyCells, cloneBoard,
} from './board.js';

export {
  newGame, shadowPreview, legalMoves, applyMove, isOver,
} from './moves.js';

export { scores, winner } from './score.js';

export { encode, decode, encodeMove, decodeMove } from './notation.js';

export {
  computeZobristHash, updateZobristCell, toggleSideToMove, ZOBRIST_BLACK_TO_MOVE,
} from './zobrist.js';

