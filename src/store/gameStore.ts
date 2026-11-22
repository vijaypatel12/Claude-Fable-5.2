// ─── CHHAYA Game Store (Zustand) ───────────────────────────────────────────
import { create } from 'zustand';
import {
  Cell, Player, Direction, Phase,
  type Coord, type Move, type GameState, type PlacementMove,
  newGame, legalMoves, applyMove, isOver, shadowPreview,
  scores, winner, emptyCellCount,
  stoneFor, setCell, encodeMove,
} from '../engine/index';
import { computeAiMove, computeHint, shouldSwap, type Difficulty, type SearchResult } from '../ai/index';

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
  humanColor: Player; // which color the human plays (vs computer)

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

  // Modals
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
  if (mode === 'local') return true;
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

    // If AI goes first
    if (mode === 'computer' && color !== Player.White) {
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

    const infos = computeDirectionInfos(gameState.board, coord, gameState.currentPlayer);
    set({
      selectedCell: coord,
      directionInfos: infos,
      previewDirection: null,
      shadowPreviewCells: [],
      hintMove: null,
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
    const { selectedCell, gameState, gameMode, humanColor, stateHistory } = get();
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
    });

    // Post-move checks
    afterMove(newState, set, get);
  },

  // ── Cancel Selection ──
  cancelSelection: () => {
    set({ selectedCell: null, directionInfos: [], previewDirection: null, shadowPreviewCells: [] });
  },

  // ── Pie Rule ──
  handlePieRule: (swap) => {
    const { gameState, stateHistory, gameMode, humanColor } = get();
    if (swap) {
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
        isAiThinking: false, hintMove: null, showGameOver: false,
      });
    } else {
      const prevState = stateHistory[stateHistory.length - 1];
      set({
        gameState: prevState,
        stateHistory: stateHistory.slice(0, -1),
        selectedCell: null, directionInfos: [], previewDirection: null, shadowPreviewCells: [],
        hintMove: null, showGameOver: false,
      });
    }
  },

  // ── Hint ──
  requestHint: () => {
    const { gameState } = get();
    if (isOver(gameState)) return;
    setTimeout(() => {
      const result = computeHint(gameState);
      set({ hintMove: result.move, lastAiResult: result });
    }, 10);
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

    // Pie rule check
  if (state.phase === Phase.PieResponse) {
    if (gameMode === 'computer' && state.currentPlayer !== humanColor) {
      // AI decides pie rule
      if (shouldSwap(state, get().difficulty)) {
        const newState = applyMove(state, { kind: 'swap' });
        set({
          gameState: newState,
          humanColor: Player.Black, // AI took White, human is now Black
          stateHistory: [...get().stateHistory, state],
        });
        afterMove(newState, set, get);
      } else {
        // AI plays normally — trigger AI move
        triggerAiMove(set, get);
      }
    } else if (gameMode === 'computer' && state.currentPlayer === humanColor) {
      // Human decides pie rule
      set({ showPieRule: true });
    }
    // For local mode, human decides naturally (show modal)
    if (gameMode === 'local') {
      set({ showPieRule: true });
    }
    return;
  }

  // AI turn check
  if (gameMode === 'computer' && !isHumanTurn(state, gameMode, humanColor)) {
    triggerAiMove(set, get);
  }
}

function triggerAiMove(
  set: (s: Partial<GameStore>) => void,
  get: () => GameStore,
) {
  set({ isAiThinking: true });
  setTimeout(() => {
    const { gameState, difficulty, stateHistory } = get();
    if (isOver(gameState)) { set({ isAiThinking: false }); return; }

    const result = computeAiMove(gameState, difficulty);
    const newState = applyMove(gameState, result.move);

    set({
      gameState: newState,
      stateHistory: [...stateHistory, gameState],
      isAiThinking: false,
      lastAiResult: result,
    });

    afterMove(newState, set, get);
  }, 100);
}
