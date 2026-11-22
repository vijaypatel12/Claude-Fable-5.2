// ─── CHHAYA Game Store (Zustand) ───────────────────────────────────────────
import { create } from 'zustand';
import {
  Cell, Player, Direction, Phase,
  type Coord, type Move, type GameState, type PlacementMove,
  newGame, legalMoves, applyMove, isOver, shadowPreview,
  scores, winner, emptyCellCount,
  stoneFor, setCell, encodeMove,
} from '../engine/index';
import { computeAiMove, computeHint, type Difficulty, type SearchResult } from '../ai/index';

export type Screen = 'home' | 'game' | 'howtoplay';
export type GameMode = 'computer' | 'local';

export interface DirectionInfo {
  direction: Direction;
  claimCount: number;
}

interface GameStore {
  // Navigation
  screen: Screen;

  // Game config
  gameMode: GameMode;
  difficulty: Difficulty;
  humanColor: Player; // which color human plays (in computer mode)

  // Game state
  gameState: GameState;
  stateHistory: GameState[];

  // UI selection state
  selectedCell: Coord | null;
  directionInfos: DirectionInfo[];
  previewDirection: Direction | null;
  shadowPreviewCells: Coord[];

  // AI state
  isAiThinking: boolean;
  lastAiResult: SearchResult | null;
  hintMove: Move | null;

  // Modals / banners
  showPieRule: boolean;
  showGameOver: boolean;

  // Actions
  navigateTo: (screen: Screen) => void;
  startGame: (mode: GameMode, difficulty: Difficulty, color: Player) => void;
  selectCell: (coord: Coord) => void;
  previewDir: (dir: Direction) => void;
  confirmDirection: (dir: Direction) => void;
  cancelSelection: () => void;
  handlePieRule: (swap: boolean) => void;
  undoMove: () => void;
  requestHint: () => void;
  clearHint: () => void;
  resetGame: () => void;
  dismissGameOver: () => void;
}

function isHumanTurn(state: GameState, mode: GameMode, humanColor: Player): boolean {
  if (mode === 'local') return true; // Local mode: both players are human!
  return state.currentPlayer === humanColor;
}

function computeDirectionInfos(board: GameState['board'], coord: Coord, player: Player): DirectionInfo[] {
  const tempBoard = setCell(board, coord, stoneFor(player));
  return [Direction.Up, Direction.Down, Direction.Left, Direction.Right].map(dir => ({
    direction: dir,
    claimCount: shadowPreview(tempBoard, coord, dir).length,
  }));
}

export const useGameStore = create<GameStore>((set, get) => ({
  // ── Defaults ──
  screen: 'home',
  gameMode: 'computer',
  difficulty: 'medium',
  humanColor: Player.White,
  gameState: newGame(),
  stateHistory: [],
  selectedCell: null,
  directionInfos: [],
  previewDirection: null,
  shadowPreviewCells: [],
  isAiThinking: false,
  lastAiResult: null,
  hintMove: null,
  showPieRule: false,
  showGameOver: false,

  // ── Navigation ──
  navigateTo: (screen) => set({ screen }),

  // ── Start Game ──
  startGame: (mode, difficulty, color) => {
    const gs = newGame();
    set({
      screen: 'game',
      gameMode: mode,
      difficulty,
      humanColor: color,
      gameState: gs,
      stateHistory: [],
      selectedCell: null,
      directionInfos: [],
      previewDirection: null,
      shadowPreviewCells: [],
      isAiThinking: false,
      lastAiResult: null,
      hintMove: null,
      showPieRule: false,
      showGameOver: false,
    });

    // If AI moves first (when human chose Black in vs computer)
    if (mode === 'computer' && color === Player.Black) {
      triggerAiMove(set, get);
    }
  },

  // ── Cell Selection ──
  selectCell: (coord) => {
    const { gameState, gameMode, humanColor, isAiThinking } = get();
    if (isAiThinking) return;
    if (!isHumanTurn(gameState, gameMode, humanColor)) return;
    if (isOver(gameState)) return;
    if (gameState.board[coord.row][coord.col] !== Cell.Empty) return;

    // Calculate shadow claims for whoever's turn it is right now!
    const infos = computeDirectionInfos(gameState.board, coord, gameState.currentPlayer);
    set({
      selectedCell: coord,
      directionInfos: infos,
      previewDirection: null,
      shadowPreviewCells: [],
      hintMove: null,
      showPieRule: false, // If Player 2 clicks a cell, pie rule is implicitly dismissed
    });
  },

  // ── Preview Direction (hover) ──
  previewDir: (dir) => {
    const { selectedCell, gameState } = get();
    if (!selectedCell) return;
    const tempBoard = setCell(gameState.board, selectedCell, stoneFor(gameState.currentPlayer));
    const cells = shadowPreview(tempBoard, selectedCell, dir);
    set({ previewDirection: dir, shadowPreviewCells: cells });
  },

  // ── Confirm Direction (click arrow) ──
  confirmDirection: (dir) => {
    const { selectedCell, gameState, stateHistory } = get();
    if (!selectedCell) return;

    const move: PlacementMove = { kind: 'place', coord: selectedCell, direction: dir };
    const newState = applyMove(gameState, move);

    set({
      gameState: newState,
      stateHistory: [...stateHistory, gameState],
      selectedCell: null,
      directionInfos: [],
      previewDirection: null,
      shadowPreviewCells: [],
      hintMove: null,
      showPieRule: false,
    });

    // Trigger next turn
    afterMove(newState, set, get);
  },

  // ── Cancel Selection ──
  cancelSelection: () => {
    set({ selectedCell: null, directionInfos: [], previewDirection: null, shadowPreviewCells: [] });
  },

  // ── Pie Rule (Swap Sides) ──
  handlePieRule: (swap) => {
    const { gameState, stateHistory, gameMode, humanColor } = get();
    if (swap && gameState.phase === Phase.PieResponse) {
      const newState = applyMove(gameState, { kind: 'swap' });
      const newHumanColor = gameMode === 'computer'
        ? (humanColor === Player.White ? Player.Black : Player.White)
        : humanColor;

      set({
        gameState: newState,
        humanColor: newHumanColor,
        stateHistory: [...stateHistory, gameState],
        showPieRule: false,
      });
      afterMove(newState, set, get);
    } else {
      set({ showPieRule: false });
    }
  },

  // ── Undo ──
  undoMove: () => {
    const { stateHistory, gameMode } = get();
    if (stateHistory.length === 0) return;

    if (gameMode === 'computer' && stateHistory.length >= 2) {
      // Undo both AI and human moves
      const prevState = stateHistory[stateHistory.length - 2];
      set({
        gameState: prevState,
        stateHistory: stateHistory.slice(0, -2),
        selectedCell: null, directionInfos: [], previewDirection: null, shadowPreviewCells: [],
        isAiThinking: false, hintMove: null, showGameOver: false, showPieRule: false,
      });
    } else {
      const prevState = stateHistory[stateHistory.length - 1];
      set({
        gameState: prevState,
        stateHistory: stateHistory.slice(0, -1),
        selectedCell: null, directionInfos: [], previewDirection: null, shadowPreviewCells: [],
        hintMove: null, showGameOver: false, showPieRule: false,
      });
    }
  },

  // ── Hint ──
  requestHint: () => {
    const { gameState } = get();
    if (isOver(gameState)) return;
    const result = computeHint(gameState);
    set({ hintMove: result.move, lastAiResult: result });
  },

  clearHint: () => set({ hintMove: null }),

  // ── Reset ──
  resetGame: () => {
    const { gameMode, difficulty, humanColor } = get();
    get().startGame(gameMode, difficulty, humanColor);
  },

  dismissGameOver: () => set({ showGameOver: false }),
}));

// ─── After Move Logic ──────────────────────────────────────────────────────
function afterMove(
  state: GameState,
  set: (s: Partial<GameStore>) => void,
  get: () => GameStore,
) {
  if (isOver(state)) {
    set({ showGameOver: true });
    return;
  }

  const { gameMode, humanColor } = get();

  // In local 2-player mode:
  if (gameMode === 'local') {
    // If it's move 2 (Black's first turn), show optional pie rule banner/modal
    if (state.phase === Phase.PieResponse) {
      set({ showPieRule: true });
    } else {
      set({ showPieRule: false });
    }
    // Turn naturally belongs to currentPlayer (Player 2 or Player 1)
    return;
  }

  // In computer mode:
  if (gameMode === 'computer') {
    if (!isHumanTurn(state, gameMode, humanColor)) {
      // It's computer's turn! Trigger fast AI move
      triggerAiMove(set, get);
    }
  }
}

function triggerAiMove(
  set: (s: Partial<GameStore>) => void,
  get: () => GameStore,
) {
  set({ isAiThinking: true });

  // 180ms delay: feels natural & snappy, no freezing
  setTimeout(() => {
    const { gameState, difficulty, stateHistory, humanColor } = get();
    if (isOver(gameState)) {
      set({ isAiThinking: false });
      return;
    }

    // Compute move with fast Negamax
    const result = computeAiMove(gameState, difficulty);
    const newState = applyMove(gameState, result.move);

    set({
      gameState: newState,
      stateHistory: [...stateHistory, gameState],
      isAiThinking: false,
      lastAiResult: result,
      showPieRule: false,
    });

    if (isOver(newState)) {
      set({ showGameOver: true });
    }
  }, 180);
}
