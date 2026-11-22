// ─── Game configuration constants ──────────────────────────────────────────
// All game-rule constants in one place. Change only here to adjust the game.

/** Number of rows on the board. */
export const BOARD_ROWS = 7;

/** Number of columns on the board. */
export const BOARD_COLS = 7;

/** Total number of cells. */
export const TOTAL_CELLS = BOARD_ROWS * BOARD_COLS;  // 49

/** All four cardinal directions. */
export const ALL_DIRECTIONS = ['U', 'D', 'L', 'R'] as const;

