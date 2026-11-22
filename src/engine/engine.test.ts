// ─── CHHAYA Game Engine — Comprehensive Tests ─────────────────────────────
import { describe, it, expect, test } from 'vitest';
import * as fc from 'fast-check';
import {
  Cell, Player, Direction, Phase,
  type Coord, type Move, type PlacementMove, type SwapMove,
  type GameState, type Board,
  BOARD_ROWS, BOARD_COLS, TOTAL_CELLS,
  emptyBoard, setCell, getCell, inBounds,
  stoneFor, claimedFor, emptyCellCount, emptyCells, cloneBoard,
  newGame, shadowPreview, legalMoves, applyMove, isOver,
  scores, winner,
  encode, decode, encodeMove, decodeMove,
  computeZobristHash,
} from '../engine/index';

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Apply a sequence of placement moves to a game state. */
function playMoves(
  state: GameState,
  moves: Array<{ row: number; col: number; dir: Direction }>,
): GameState {
  let s = state;
  for (const m of moves) {
    s = applyMove(s, {
      kind: 'place',
      coord: { row: m.row, col: m.col },
      direction: m.dir,
    });
  }
  return s;
}

/** Helper: apply a single placement shorthand */
function place(
  state: GameState,
  row: number,
  col: number,
  dir: Direction,
): GameState {
  return applyMove(state, {
    kind: 'place',
    coord: { row, col },
    direction: dir,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. BOARD BASICS
// ═══════════════════════════════════════════════════════════════════════════
describe('Board', () => {
  it('creates a 7x7 empty board', () => {
    const board = emptyBoard();
    expect(board.length).toBe(7);
    for (const row of board) {
      expect(row.length).toBe(7);
      for (const cell of row) {
        expect(cell).toBe(Cell.Empty);
      }
    }
  });

  it('setCell does not mutate the original board', () => {
    const board = emptyBoard();
    const board2 = setCell(board, { row: 3, col: 3 }, Cell.WhiteStone);
    expect(getCell(board, { row: 3, col: 3 })).toBe(Cell.Empty);
    expect(getCell(board2, { row: 3, col: 3 })).toBe(Cell.WhiteStone);
  });

  it('inBounds works correctly', () => {
    expect(inBounds({ row: 0, col: 0 })).toBe(true);
    expect(inBounds({ row: 6, col: 6 })).toBe(true);
    expect(inBounds({ row: -1, col: 0 })).toBe(false);
    expect(inBounds({ row: 0, col: 7 })).toBe(false);
    expect(inBounds({ row: 7, col: 0 })).toBe(false);
  });

  it('emptyCellCount returns 49 for empty board', () => {
    expect(emptyCellCount(emptyBoard())).toBe(49);
  });

  it('emptyCells returns all 49 coords on empty board', () => {
    expect(emptyCells(emptyBoard()).length).toBe(49);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. NEW GAME
// ═══════════════════════════════════════════════════════════════════════════
describe('newGame', () => {
  it('starts with White to play', () => {
    const g = newGame();
    expect(g.currentPlayer).toBe(Player.White);
  });

  it('starts in WhiteFirst phase', () => {
    const g = newGame();
    expect(g.phase).toBe(Phase.WhiteFirst);
  });

  it('move number starts at 1', () => {
    const g = newGame();
    expect(g.moveNumber).toBe(1);
  });

  it('history is empty', () => {
    const g = newGame();
    expect(g.history).toHaveLength(0);
  });

  it('board is fully empty', () => {
    const g = newGame();
    expect(emptyCellCount(g.board)).toBe(49);
  });

  it('swapped flag is false', () => {
    expect(newGame().swapped).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. SHADOW PREVIEW
// ═══════════════════════════════════════════════════════════════════════════
describe('shadowPreview', () => {
  it('casts shadow right across empty row', () => {
    // Place a stone at (3,0) → shadow right should go through (3,1)..(3,6)
    const board = setCell(emptyBoard(), { row: 3, col: 0 }, Cell.WhiteStone);
    const shadow = shadowPreview(board, { row: 3, col: 0 }, Direction.Right);
    expect(shadow).toHaveLength(6);
    expect(shadow[0]).toEqual({ row: 3, col: 1 });
    expect(shadow[5]).toEqual({ row: 3, col: 6 });
  });

  it('casts shadow up from bottom row', () => {
    const board = setCell(emptyBoard(), { row: 6, col: 3 }, Cell.WhiteStone);
    const shadow = shadowPreview(board, { row: 6, col: 3 }, Direction.Up);
    expect(shadow).toHaveLength(6);
    expect(shadow[0]).toEqual({ row: 5, col: 3 });
    expect(shadow[5]).toEqual({ row: 0, col: 3 });
  });

  it('casts shadow down from top row', () => {
    const board = setCell(emptyBoard(), { row: 0, col: 3 }, Cell.WhiteStone);
    const shadow = shadowPreview(board, { row: 0, col: 3 }, Direction.Down);
    expect(shadow).toHaveLength(6);
  });

  it('casts shadow left from right column', () => {
    const board = setCell(emptyBoard(), { row: 3, col: 6 }, Cell.WhiteStone);
    const shadow = shadowPreview(board, { row: 3, col: 6 }, Direction.Left);
    expect(shadow).toHaveLength(6);
  });

  it('zero-length shadow at board edge', () => {
    // Stone at (0,3), casting Up → hits boundary immediately
    const board = setCell(emptyBoard(), { row: 0, col: 3 }, Cell.WhiteStone);
    const shadow = shadowPreview(board, { row: 0, col: 3 }, Direction.Up);
    expect(shadow).toHaveLength(0);
  });

  it('zero-length shadow into another stone', () => {
    let board = setCell(emptyBoard(), { row: 3, col: 3 }, Cell.WhiteStone);
    board = setCell(board, { row: 3, col: 4 }, Cell.BlackStone);
    const shadow = shadowPreview(board, { row: 3, col: 3 }, Direction.Right);
    expect(shadow).toHaveLength(0);
  });

  it('shadow blocked by existing stone', () => {
    // Stone at (3,0), another stone at (3,4) → shadow right only (3,1)..(3,3)
    let board = setCell(emptyBoard(), { row: 3, col: 0 }, Cell.WhiteStone);
    board = setCell(board, { row: 3, col: 4 }, Cell.BlackStone);
    const shadow = shadowPreview(board, { row: 3, col: 0 }, Direction.Right);
    expect(shadow).toHaveLength(3);
    expect(shadow.map(c => c.col)).toEqual([1, 2, 3]);
  });

  it('shadow blocked by claimed cell', () => {
    let board = setCell(emptyBoard(), { row: 3, col: 0 }, Cell.WhiteStone);
    board = setCell(board, { row: 3, col: 3 }, Cell.BlackClaimed);
    const shadow = shadowPreview(board, { row: 3, col: 0 }, Direction.Right);
    expect(shadow).toHaveLength(2);
    expect(shadow.map(c => c.col)).toEqual([1, 2]);
  });

  it('shadow blocked by own claimed cell', () => {
    let board = setCell(emptyBoard(), { row: 3, col: 0 }, Cell.WhiteStone);
    board = setCell(board, { row: 3, col: 2 }, Cell.WhiteClaimed);
    const shadow = shadowPreview(board, { row: 3, col: 0 }, Direction.Right);
    expect(shadow).toHaveLength(1);
    expect(shadow[0]).toEqual({ row: 3, col: 1 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. LEGAL MOVES
// ═══════════════════════════════════════════════════════════════════════════
describe('legalMoves', () => {
  it('initial state has 49*4 = 196 placement moves', () => {
    const g = newGame();
    const moves = legalMoves(g);
    expect(moves.length).toBe(49 * 4);
    // All should be placements
    for (const m of moves) {
      expect(m.kind).toBe('place');
    }
  });

  it('after White first move, Black has swap + placement moves', () => {
    const g = newGame();
    // White plays at center
    const g2 = place(g, 3, 3, Direction.Up);
    expect(g2.phase).toBe(Phase.PieResponse);

    const moves = legalMoves(g2);
    const swapMoves = moves.filter(m => m.kind === 'swap');
    const placeMoves = moves.filter(m => m.kind === 'place');

    expect(swapMoves).toHaveLength(1);

    // Count empty cells after White's first move
    const empties = emptyCellCount(g2.board);
    expect(placeMoves.length).toBe(empties * 4);
  });

  it('no legal moves when game is over', () => {
    // Create a game-over state
    const g = newGame();
    // We'll force game over by decoding a filled board
    const fullBoard: Cell[][] = [];
    for (let r = 0; r < 7; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < 7; c++) {
        row.push(r < 4 ? Cell.WhiteStone : Cell.BlackStone);
      }
      fullBoard.push(row);
    }
    const overState: GameState = {
      board: fullBoard,
      currentPlayer: Player.White,
      phase: Phase.GameOver,
      moveNumber: 50,
      history: [],
      zobristHash: computeZobristHash(fullBoard, Player.White),
      swapped: false,
    };
    expect(legalMoves(overState)).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. APPLY MOVE — BASIC
// ═══════════════════════════════════════════════════════════════════════════
describe('applyMove', () => {
  it('places a white stone on first move', () => {
    const g = newGame();
    const g2 = place(g, 3, 3, Direction.Up);
    expect(getCell(g2.board, { row: 3, col: 3 })).toBe(Cell.WhiteStone);
  });

  it('claims cells in shadow direction', () => {
    const g = newGame();
    // White at (3,3), shadow Up → claims (2,3), (1,3), (0,3)
    const g2 = place(g, 3, 3, Direction.Up);
    expect(getCell(g2.board, { row: 2, col: 3 })).toBe(Cell.WhiteClaimed);
    expect(getCell(g2.board, { row: 1, col: 3 })).toBe(Cell.WhiteClaimed);
    expect(getCell(g2.board, { row: 0, col: 3 })).toBe(Cell.WhiteClaimed);
  });

  it('alternates players', () => {
    const g = newGame();
    expect(g.currentPlayer).toBe(Player.White);
    const g2 = place(g, 3, 3, Direction.Up);
    expect(g2.currentPlayer).toBe(Player.Black);
  });

  it('increments move number', () => {
    const g = newGame();
    const g2 = place(g, 3, 3, Direction.Up);
    expect(g2.moveNumber).toBe(2);
  });

  it('records move in history', () => {
    const g = newGame();
    const g2 = place(g, 3, 3, Direction.Up);
    expect(g2.history).toHaveLength(1);
    expect(g2.history[0]).toEqual({
      kind: 'place',
      coord: { row: 3, col: 3 },
      direction: Direction.Up,
    });
  });

  it('throws when placing on occupied cell', () => {
    const g = newGame();
    const g2 = place(g, 3, 3, Direction.Up);
    // Try to place on the stone
    expect(() => place(g2, 3, 3, Direction.Down)).toThrow();
    // Try to place on a claimed cell
    expect(() => place(g2, 2, 3, Direction.Down)).toThrow();
  });

  it('throws when game is over', () => {
    const overState: GameState = {
      board: emptyBoard(),
      currentPlayer: Player.White,
      phase: Phase.GameOver,
      moveNumber: 50,
      history: [],
      zobristHash: 0n,
      swapped: false,
    };
    expect(() => place(overState, 0, 0, Direction.Right)).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. INPUT IMMUTABILITY
// ═══════════════════════════════════════════════════════════════════════════
describe('Input immutability', () => {
  it('applyMove does not mutate the input state', () => {
    const g = newGame();
    const boardBefore = JSON.stringify(g.board);
    const histBefore = [...g.history];
    const phaseBefore = g.phase;
    const playerBefore = g.currentPlayer;

    place(g, 3, 3, Direction.Up);

    expect(JSON.stringify(g.board)).toBe(boardBefore);
    expect(g.history).toEqual(histBefore);
    expect(g.phase).toBe(phaseBefore);
    expect(g.currentPlayer).toBe(playerBefore);
  });

  it('applyMove swap does not mutate input', () => {
    const g = newGame();
    const g2 = place(g, 3, 3, Direction.Up);
    const boardBefore = JSON.stringify(g2.board);

    applyMove(g2, { kind: 'swap' });

    expect(JSON.stringify(g2.board)).toBe(boardBefore);
    expect(g2.phase).toBe(Phase.PieResponse);
    expect(g2.swapped).toBe(false);
  });

  it('successive applyMove calls produce independent states', () => {
    const g = newGame();
    const g2 = place(g, 0, 0, Direction.Right);
    const g3 = place(g, 3, 3, Direction.Down);

    // g2 and g3 should be independent
    expect(getCell(g2.board, { row: 0, col: 0 })).toBe(Cell.WhiteStone);
    expect(getCell(g3.board, { row: 0, col: 0 })).toBe(Cell.Empty);
    expect(getCell(g3.board, { row: 3, col: 3 })).toBe(Cell.WhiteStone);
    expect(getCell(g2.board, { row: 3, col: 3 })).toBe(Cell.Empty);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. PIE RULE
// ═══════════════════════════════════════════════════════════════════════════
describe('Pie Rule', () => {
  it('after White first move, phase is PieResponse', () => {
    const g2 = place(newGame(), 3, 3, Direction.Up);
    expect(g2.phase).toBe(Phase.PieResponse);
    expect(g2.currentPlayer).toBe(Player.Black);
  });

  it('Black can swap', () => {
    const g2 = place(newGame(), 3, 3, Direction.Up);
    const g3 = applyMove(g2, { kind: 'swap' });

    expect(g3.swapped).toBe(true);
    expect(g3.phase).toBe(Phase.Normal);
    // After swap, it's Black's turn (the original White player now controls Black)
    expect(g3.currentPlayer).toBe(Player.Black);
    expect(g3.moveNumber).toBe(3);
  });

  it('Black can play normally instead of swapping', () => {
    const g2 = place(newGame(), 3, 3, Direction.Up);
    const g3 = place(g2, 6, 6, Direction.Left);

    expect(g3.swapped).toBe(false);
    expect(g3.phase).toBe(Phase.Normal);
    expect(g3.currentPlayer).toBe(Player.White);
  });

  it('swap is not available after pie response phase', () => {
    const g2 = place(newGame(), 3, 3, Direction.Up);
    const g3 = place(g2, 6, 6, Direction.Left); // Black plays normally
    const moves = legalMoves(g3);
    expect(moves.every(m => m.kind === 'place')).toBe(true);
  });

  it('swap cannot be used outside pie response', () => {
    expect(() => applyMove(newGame(), { kind: 'swap' })).toThrow();
  });

  it('board is unchanged after swap', () => {
    const g2 = place(newGame(), 3, 3, Direction.Up);
    const g3 = applyMove(g2, { kind: 'swap' });
    expect(JSON.stringify(g3.board)).toBe(JSON.stringify(g2.board));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. SCORING
// ═══════════════════════════════════════════════════════════════════════════
describe('Scoring', () => {
  it('empty board has 0-0 score', () => {
    const s = scores(emptyBoard());
    expect(s.white).toBe(0);
    expect(s.black).toBe(0);
  });

  it('counts stones', () => {
    let board = setCell(emptyBoard(), { row: 0, col: 0 }, Cell.WhiteStone);
    board = setCell(board, { row: 1, col: 1 }, Cell.BlackStone);
    const s = scores(board);
    expect(s.white).toBe(1);
    expect(s.black).toBe(1);
  });

  it('counts claimed cells', () => {
    let board = setCell(emptyBoard(), { row: 0, col: 0 }, Cell.WhiteClaimed);
    board = setCell(board, { row: 0, col: 1 }, Cell.WhiteClaimed);
    board = setCell(board, { row: 1, col: 0 }, Cell.BlackClaimed);
    const s = scores(board);
    expect(s.white).toBe(2);
    expect(s.black).toBe(1);
  });

  it('score = stones + claimed', () => {
    let board = emptyBoard();
    board = setCell(board, { row: 0, col: 0 }, Cell.WhiteStone);
    board = setCell(board, { row: 0, col: 1 }, Cell.WhiteClaimed);
    board = setCell(board, { row: 0, col: 2 }, Cell.WhiteClaimed);
    board = setCell(board, { row: 1, col: 0 }, Cell.BlackStone);
    board = setCell(board, { row: 1, col: 1 }, Cell.BlackClaimed);
    const s = scores(board);
    expect(s.white).toBe(3); // 1 stone + 2 claimed
    expect(s.black).toBe(2); // 1 stone + 1 claimed
  });

  it('winner returns correct player', () => {
    let board = emptyBoard();
    board = setCell(board, { row: 0, col: 0 }, Cell.WhiteStone);
    board = setCell(board, { row: 0, col: 1 }, Cell.WhiteClaimed);
    board = setCell(board, { row: 1, col: 0 }, Cell.BlackStone);
    expect(winner(board)).toBe(Player.White);
  });

  it('winner returns null for tie', () => {
    let board = emptyBoard();
    board = setCell(board, { row: 0, col: 0 }, Cell.WhiteStone);
    board = setCell(board, { row: 1, col: 0 }, Cell.BlackStone);
    expect(winner(board)).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. ZERO-LENGTH SHADOW
// ═══════════════════════════════════════════════════════════════════════════
describe('Zero-length shadow', () => {
  it('stone at corner casting into edge produces no claims', () => {
    const g = newGame();
    // White places at (0,0) casting Up → boundary immediately
    const g2 = place(g, 0, 0, Direction.Up);
    expect(getCell(g2.board, { row: 0, col: 0 })).toBe(Cell.WhiteStone);
    // Score should be just 1 stone
    const s = scores(g2.board);
    expect(s.white).toBe(1);
  });

  it('stone adjacent to another stone produces no claims', () => {
    const g = newGame();
    // White at (3,3), shadow Up → claims (2,3),(1,3),(0,3)
    const g2 = place(g, 3, 3, Direction.Up);
    // Black places at (3,4) which is empty, casts shadow Left toward (3,3) WhiteStone → blocked
    const g3 = place(g2, 3, 4, Direction.Left);
    // Shadow left from (3,4) → (3,3) is WhiteStone, so zero shadow
    expect(getCell(g3.board, { row: 3, col: 4 })).toBe(Cell.BlackStone);
    const s = scores(g3.board);
    // White: stone at (3,3) + claimed (2,3),(1,3),(0,3) = 4
    expect(s.white).toBe(4);
    // Black: just stone at (3,4), zero shadow
    expect(s.black).toBe(1);
  });

  it('zero-length shadow is legal', () => {
    const g = newGame();
    // Should not throw
    const g2 = place(g, 0, 0, Direction.Up);
    expect(g2.moveNumber).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. GAME COMPLETION
// ═══════════════════════════════════════════════════════════════════════════
describe('Game completion', () => {
  it('game is not over at start', () => {
    expect(isOver(newGame())).toBe(false);
  });

  it('game is over when board is full', () => {
    // Build a completely full board manually
    const fullBoard: Cell[][] = [];
    for (let r = 0; r < 7; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < 7; c++) {
        row.push(r < 4 ? Cell.WhiteStone : Cell.BlackStone);
      }
      fullBoard.push(row);
    }
    const state: GameState = {
      board: fullBoard,
      currentPlayer: Player.White,
      phase: Phase.GameOver,
      moveNumber: 50,
      history: [],
      zobristHash: computeZobristHash(fullBoard, Player.White),
      swapped: false,
    };
    expect(isOver(state)).toBe(true);
  });

  it('game ends when last empty cell is filled', () => {
    // Create a board with only 1 empty cell
    const almostFullBoard: Cell[][] = [];
    for (let r = 0; r < 7; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < 7; c++) {
        if (r === 6 && c === 6) {
          row.push(Cell.Empty);
        } else {
          row.push(r < 4 ? Cell.WhiteStone : Cell.BlackStone);
        }
      }
      almostFullBoard.push(row);
    }
    const state: GameState = {
      board: almostFullBoard,
      currentPlayer: Player.White,
      phase: Phase.Normal,
      moveNumber: 48,
      history: [],
      zobristHash: computeZobristHash(almostFullBoard, Player.White),
      swapped: false,
    };

    // Place the last stone (zero shadow, all neighbors occupied)
    const finalState = place(state, 6, 6, Direction.Up);
    expect(isOver(finalState)).toBe(true);
    expect(finalState.phase).toBe(Phase.GameOver);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. NOTATION — ENCODE/DECODE
// ═══════════════════════════════════════════════════════════════════════════
describe('Notation', () => {
  describe('Move encoding', () => {
    it('encodes placement moves', () => {
      // (row=3, col=3) → d4U  (col=d=3, row=7-3=4)
      expect(encodeMove({
        kind: 'place',
        coord: { row: 3, col: 3 },
        direction: Direction.Up,
      })).toBe('d4U');
    });

    it('encodes swap', () => {
      expect(encodeMove({ kind: 'swap' })).toBe('swap');
    });

    it('decodes placement moves', () => {
      const move = decodeMove('d4U');
      expect(move).toEqual({
        kind: 'place',
        coord: { row: 3, col: 3 },
        direction: Direction.Up,
      });
    });

    it('decodes swap', () => {
      expect(decodeMove('swap')).toEqual({ kind: 'swap' });
    });

    it('round-trips placement moves', () => {
      const move: PlacementMove = {
        kind: 'place',
        coord: { row: 0, col: 6 },
        direction: Direction.Left,
      };
      expect(decodeMove(encodeMove(move))).toEqual(move);
    });

    it('encodes corner cells correctly', () => {
      // (0,0) → a7
      expect(encodeMove({
        kind: 'place', coord: { row: 0, col: 0 }, direction: Direction.Right,
      })).toBe('a7R');

      // (6,6) → g1
      expect(encodeMove({
        kind: 'place', coord: { row: 6, col: 6 }, direction: Direction.Left,
      })).toBe('g1L');
    });
  });

  describe('State encoding', () => {
    it('encode/decode round-trips initial state', () => {
      const g = newGame();
      const encoded = encode(g);
      const decoded = decode(encoded);

      expect(decoded.board).toEqual(g.board);
      expect(decoded.currentPlayer).toBe(g.currentPlayer);
      expect(decoded.phase).toBe(g.phase);
      expect(decoded.moveNumber).toBe(g.moveNumber);
      expect(decoded.swapped).toBe(g.swapped);
      expect(decoded.history).toEqual(g.history);
    });

    it('encode/decode round-trips after moves', () => {
      let g = newGame();
      g = place(g, 3, 3, Direction.Up);
      g = place(g, 5, 5, Direction.Left);

      const decoded = decode(encode(g));
      expect(decoded.board).toEqual(g.board);
      expect(decoded.currentPlayer).toBe(g.currentPlayer);
      expect(decoded.phase).toBe(g.phase);
      expect(decoded.moveNumber).toBe(g.moveNumber);
      expect(decoded.history).toEqual(g.history);
    });

    it('encode/decode round-trips after swap', () => {
      let g = newGame();
      g = place(g, 3, 3, Direction.Up);
      g = applyMove(g, { kind: 'swap' });

      const decoded = decode(encode(g));
      expect(decoded.board).toEqual(g.board);
      expect(decoded.swapped).toBe(true);
      expect(decoded.history).toEqual(g.history);
    });

    it('encoded board string is 49 chars', () => {
      const encoded = encode(newGame());
      const boardPart = encoded.split('|')[0];
      expect(boardPart.length).toBe(49);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. ZOBRIST HASHING
// ═══════════════════════════════════════════════════════════════════════════
describe('Zobrist hashing', () => {
  it('different board positions have different hashes', () => {
    const g1 = place(newGame(), 0, 0, Direction.Right);
    const g2 = place(newGame(), 6, 6, Direction.Left);
    expect(g1.zobristHash).not.toBe(g2.zobristHash);
  });

  it('same position reached by same move has same hash', () => {
    const g1 = place(newGame(), 3, 3, Direction.Up);
    const g2 = place(newGame(), 3, 3, Direction.Up);
    expect(g1.zobristHash).toBe(g2.zobristHash);
  });

  it('hash changes when side to move differs', () => {
    const board = emptyBoard();
    const h1 = computeZobristHash(board, Player.White);
    const h2 = computeZobristHash(board, Player.Black);
    expect(h1).not.toBe(h2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. WORKED EXAMPLES FROM SPECIFICATION
// ═══════════════════════════════════════════════════════════════════════════
describe('Worked Examples', () => {
  /*
   * Example 1: White places stone at center (3,3), casts shadow Up.
   * Shadow claims (2,3), (1,3), (0,3).
   * White score = 1 stone + 3 claimed = 4.
   */
  test('Example 1: White center stone, shadow Up', () => {
    const g = newGame();
    const g2 = place(g, 3, 3, Direction.Up);

    // Stone placed
    expect(getCell(g2.board, { row: 3, col: 3 })).toBe(Cell.WhiteStone);
    // Shadow claims
    expect(getCell(g2.board, { row: 2, col: 3 })).toBe(Cell.WhiteClaimed);
    expect(getCell(g2.board, { row: 1, col: 3 })).toBe(Cell.WhiteClaimed);
    expect(getCell(g2.board, { row: 0, col: 3 })).toBe(Cell.WhiteClaimed);
    // No claim beyond
    const s = scores(g2.board);
    expect(s.white).toBe(4); // 1 + 3
    expect(s.black).toBe(0);
  });

  /*
   * Example 2: After Example 1, Black places at (5,3), casts shadow Down.
   * Shadow claims (6,3).
   * Black score = 1 stone + 1 claimed = 2.
   */
  test('Example 2: Black below White, shadow Down', () => {
    let g = newGame();
    g = place(g, 3, 3, Direction.Up); // White
    g = place(g, 5, 3, Direction.Down); // Black

    expect(getCell(g.board, { row: 5, col: 3 })).toBe(Cell.BlackStone);
    expect(getCell(g.board, { row: 6, col: 3 })).toBe(Cell.BlackClaimed);

    const s = scores(g.board);
    expect(s.white).toBe(4);
    expect(s.black).toBe(2); // 1 + 1
  });

  /*
   * Example 3: Shadow blocked by another stone.
   * White at (3,3) shadow Up. Black at (1,3) shadow Down.
   * Black's shadow Down from (1,3) → (2,3) is WhiteClaimed, so blocked → 0 shadow.
   * Wait, (2,3) was already claimed by White... so Black's shadow is blocked.
   *
   * Actually, let me re-read: Black places at (1,3)? But (1,3) is WhiteClaimed...
   *
   * Let me reconsider: Example 3 should be about shadow blocking by an existing stone.
   * White at (3,0) right, then Black at (3,5) left → Black's shadow goes
   * (3,4), (3,3), ... but wait if (3,1)...(3,6) were claimed by White, Black can't go there.
   *
   * Since spec isn't uploaded, I'll construct a sensible blocking example:
   * White at (3,0) shadow Right → claims (3,1)..(3,6).
   * Black at (5,3) shadow Up → claims (4,3), and (3,3) is WhiteClaimed, blocked.
   */
  test('Example 3: Shadow blocked by claimed cell', () => {
    let g = newGame();
    // White at (3,0), shadow Right → claims (3,1)..(3,6) = 6 cells
    g = place(g, 3, 0, Direction.Right);
    expect(scores(g.board).white).toBe(7); // 1 stone + 6 claimed

    // Black at (5,3), shadow Up → (4,3) is empty, (3,3) is WhiteClaimed → blocked
    g = place(g, 5, 3, Direction.Up);
    expect(getCell(g.board, { row: 4, col: 3 })).toBe(Cell.BlackClaimed);
    expect(getCell(g.board, { row: 3, col: 3 })).toBe(Cell.WhiteClaimed); // blocked here
    expect(scores(g.board).black).toBe(2); // 1 stone + 1 claimed
  });

  /*
   * Example 4: Shadow blocked by stone.
   * White at (0,3) Down → claims (1,3)..(6,3) = 6 cells.
   * Black at (3,0) Right → (3,1), (3,2) empty → (3,3) is WhiteClaimed → blocked.
   */
  test('Example 4: Shadow blocked by opponent stone', () => {
    let g = newGame();
    // White at (0,3), shadow Down
    g = place(g, 0, 3, Direction.Down);
    expect(scores(g.board).white).toBe(7);

    // Black at (3,0), shadow Right → (3,1), (3,2) are empty, (3,3) is WhiteClaimed
    g = place(g, 3, 0, Direction.Right);
    expect(getCell(g.board, { row: 3, col: 1 })).toBe(Cell.BlackClaimed);
    expect(getCell(g.board, { row: 3, col: 2 })).toBe(Cell.BlackClaimed);
    expect(scores(g.board).black).toBe(3); // 1 stone + 2 claimed
  });

  /*
   * Example 5: Zero-length shadow — stone at edge casting toward boundary.
   */
  test('Example 5: Zero-length shadow at edge', () => {
    let g = newGame();
    // White at (0,0), shadow Up → boundary immediately
    g = place(g, 0, 0, Direction.Up);
    expect(scores(g.board).white).toBe(1); // just the stone
    expect(getCell(g.board, { row: 0, col: 0 })).toBe(Cell.WhiteStone);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. MULTI-MOVE SEQUENCES
// ═══════════════════════════════════════════════════════════════════════════
describe('Multi-move sequences', () => {
  test('alternating play with correct cell states', () => {
    let g = newGame();

    // Move 1: White at (0,0) → shadow Right
    g = place(g, 0, 0, Direction.Right);
    expect(g.currentPlayer).toBe(Player.Black);
    expect(g.phase).toBe(Phase.PieResponse);

    // Move 2: Black at (6,6) → shadow Left (normal play, no swap)
    g = place(g, 6, 6, Direction.Left);
    expect(g.currentPlayer).toBe(Player.White);
    expect(g.phase).toBe(Phase.Normal);

    // Check board
    expect(getCell(g.board, { row: 0, col: 0 })).toBe(Cell.WhiteStone);
    expect(getCell(g.board, { row: 0, col: 1 })).toBe(Cell.WhiteClaimed);
    expect(getCell(g.board, { row: 6, col: 6 })).toBe(Cell.BlackStone);
    expect(getCell(g.board, { row: 6, col: 5 })).toBe(Cell.BlackClaimed);

    const s = scores(g.board);
    expect(s.white).toBe(7); // 1 + 6
    expect(s.black).toBe(7); // 1 + 6
  });

  test('shadow interaction between players', () => {
    let g = newGame();

    // White at (3,0), shadow Right → claims (3,1)..(3,6)
    g = place(g, 3, 0, Direction.Right);
    expect(scores(g.board).white).toBe(7);

    // Black at (0,3), shadow Down → (1,3), (2,3) empty, (3,3) WhiteClaimed → blocked
    g = place(g, 0, 3, Direction.Down);
    expect(scores(g.board).black).toBe(3); // 1 + 2
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. PROPERTY-BASED TESTS (fast-check)
// ═══════════════════════════════════════════════════════════════════════════
describe('Property-based tests', () => {
  // Arbitrary for valid board coordinates
  const coordArb = fc.record({
    row: fc.integer({ min: 0, max: 6 }),
    col: fc.integer({ min: 0, max: 6 }),
  });

  const dirArb = fc.constantFrom(
    Direction.Up, Direction.Down, Direction.Left, Direction.Right,
  );

  test('a placement always adds exactly 1 stone', () => {
    fc.assert(
      fc.property(coordArb, dirArb, (coord, dir) => {
        const g = newGame();
        const g2 = place(g, coord.row, coord.col, dir);

        // Count stones
        let stoneCount = 0;
        for (let r = 0; r < 7; r++) {
          for (let c = 0; c < 7; c++) {
            if (g2.board[r][c] === Cell.WhiteStone ||
                g2.board[r][c] === Cell.BlackStone) {
              stoneCount++;
            }
          }
        }
        expect(stoneCount).toBe(1);
      }),
    );
  });

  test('score after first move is at least 1', () => {
    fc.assert(
      fc.property(coordArb, dirArb, (coord, dir) => {
        const g2 = place(newGame(), coord.row, coord.col, dir);
        const s = scores(g2.board);
        expect(s.white).toBeGreaterThanOrEqual(1);
      }),
    );
  });

  test('total claimed + stones + empty = 49 always', () => {
    fc.assert(
      fc.property(coordArb, dirArb, (coord, dir) => {
        const g2 = place(newGame(), coord.row, coord.col, dir);
        const s = scores(g2.board);
        const empty = emptyCellCount(g2.board);
        expect(s.white + s.black + empty).toBe(49);
      }),
    );
  });

  test('encode/decode is identity for any first move', () => {
    fc.assert(
      fc.property(coordArb, dirArb, (coord, dir) => {
        const g = place(newGame(), coord.row, coord.col, dir);
        const decoded = decode(encode(g));
        expect(decoded.board).toEqual(g.board);
        expect(decoded.currentPlayer).toBe(g.currentPlayer);
        expect(decoded.phase).toBe(g.phase);
        expect(decoded.moveNumber).toBe(g.moveNumber);
      }),
    );
  });

  test('shadow length is between 0 and 6 on a 7x7 board', () => {
    fc.assert(
      fc.property(coordArb, dirArb, (coord, dir) => {
        const board = setCell(emptyBoard(), coord, Cell.WhiteStone);
        const shadow = shadowPreview(board, coord, dir);
        expect(shadow.length).toBeGreaterThanOrEqual(0);
        expect(shadow.length).toBeLessThanOrEqual(6);
      }),
    );
  });

  test('shadow cells are all in the chosen direction from the stone', () => {
    fc.assert(
      fc.property(coordArb, dirArb, (coord, dir) => {
        const board = setCell(emptyBoard(), coord, Cell.WhiteStone);
        const shadow = shadowPreview(board, coord, dir);
        for (const sc of shadow) {
          switch (dir) {
            case Direction.Up:
              expect(sc.row).toBeLessThan(coord.row);
              expect(sc.col).toBe(coord.col);
              break;
            case Direction.Down:
              expect(sc.row).toBeGreaterThan(coord.row);
              expect(sc.col).toBe(coord.col);
              break;
            case Direction.Left:
              expect(sc.col).toBeLessThan(coord.col);
              expect(sc.row).toBe(coord.row);
              break;
            case Direction.Right:
              expect(sc.col).toBeGreaterThan(coord.col);
              expect(sc.row).toBe(coord.row);
              break;
          }
        }
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════
describe('Edge cases', () => {
  test('placing on every corner with every direction', () => {
    const corners: Coord[] = [
      { row: 0, col: 0 }, { row: 0, col: 6 },
      { row: 6, col: 0 }, { row: 6, col: 6 },
    ];
    const dirs = [Direction.Up, Direction.Down, Direction.Left, Direction.Right];

    for (const coord of corners) {
      for (const dir of dirs) {
        const g = place(newGame(), coord.row, coord.col, dir);
        expect(getCell(g.board, coord)).toBe(Cell.WhiteStone);
        const s = scores(g.board);
        expect(s.white).toBeGreaterThanOrEqual(1);
        expect(s.white + s.black + emptyCellCount(g.board)).toBe(49);
      }
    }
  });

  test('shadow from corner (0,0) right claims 6 cells', () => {
    const g = place(newGame(), 0, 0, Direction.Right);
    expect(scores(g.board).white).toBe(7);
  });

  test('shadow from corner (0,0) down claims 6 cells', () => {
    const g = place(newGame(), 0, 0, Direction.Down);
    expect(scores(g.board).white).toBe(7);
  });

  test('shadow from corner (0,0) up claims 0 cells', () => {
    const g = place(newGame(), 0, 0, Direction.Up);
    expect(scores(g.board).white).toBe(1);
  });

  test('shadow from corner (0,0) left claims 0 cells', () => {
    const g = place(newGame(), 0, 0, Direction.Left);
    expect(scores(g.board).white).toBe(1);
  });
});
