// ─── Public API barrel export ──────────────────────────────────────────────
export {
  Cell, Player, Direction, Phase,
  type Coord, type Move, type PlacementMove, type SwapMove,
  type GameState, type Board, type Scores,
} from './types';

export { BOARD_ROWS, BOARD_COLS, TOTAL_CELLS, ALL_DIRECTIONS } from './rules.config';

export {
  emptyBoard, setCell, getCell, inBounds,
  stoneFor, claimedFor, emptyCellCount, emptyCells, cloneBoard,
} from './board';

export {
  newGame, shadowPreview, legalMoves, applyMove, isOver,
} from './moves';

export { scores, winner } from './score';

export { encode, decode, encodeMove, decodeMove } from './notation';

export {
  computeZobristHash, updateZobristCell, toggleSideToMove, ZOBRIST_BLACK_TO_MOVE,
} from './zobrist';
