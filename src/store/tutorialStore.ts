// ─── Tutorial state and logic ───────────────────────────────────────────────
import { create } from 'zustand';

export interface TutorialStep {
  id: number;
  title: string;
  instruction: string;
  highlight: 'cell' | 'arrow' | 'shadow' | 'score' | 'none';
  targetCell?: { row: number; col: number };
  targetDir?: 'U' | 'D' | 'L' | 'R';
  waitForAction: 'place-stone' | 'choose-direction' | 'observe' | 'done';
  autoAdvanceMs?: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Place a Stone',
    instruction: 'Tap any empty cell on the board to place your stone there. Try tapping the centre cell.',
    highlight: 'cell',
    targetCell: { row: 3, col: 3 },
    waitForAction: 'place-stone',
  },
  {
    id: 2,
    title: 'Cast a Shadow',
    instruction: 'Each stone casts a shadow. Choose a direction — the arrows show how many empty cells it will claim. Tap an arrow!',
    highlight: 'arrow',
    waitForAction: 'choose-direction',
  },
  {
    id: 3,
    title: 'Stones Block Shadows',
    instruction: 'An opponent\'s stone blocks your shadow — it stops just before the stone. Watch the preview carefully.',
    highlight: 'shadow',
    waitForAction: 'place-stone',
  },
  {
    id: 4,
    title: 'Claimed Cells Block Shadows',
    instruction: 'Already-claimed cells also stop shadows. Territory is permanent — plan ahead!',
    highlight: 'shadow',
    waitForAction: 'place-stone',
  },
  {
    id: 5,
    title: 'Score & Pie Rule',
    instruction: 'Your score = your stones + your claimed cells. After White\'s first move, Black can swap sides using the Pie Rule.',
    highlight: 'score',
    waitForAction: 'done',
    autoAdvanceMs: 5000,
  },
];

interface TutorialStore {
  active: boolean;
  currentStep: number;
  stoneWasPlaced: boolean;
  directionWasChosen: boolean;

  startTutorial: () => void;
  exitTutorial: () => void;
  advanceStep: () => void;
  onStonePlaced: () => void;
  onDirectionChosen: () => void;
  reset: () => void;
}

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  active: false,
  currentStep: 1,
  stoneWasPlaced: false,
  directionWasChosen: false,

  startTutorial: () => set({ active: true, currentStep: 1, stoneWasPlaced: false, directionWasChosen: false }),
  exitTutorial:  () => set({ active: false }),
  reset:         () => set({ active: false, currentStep: 1, stoneWasPlaced: false, directionWasChosen: false }),

  advanceStep: () => {
    const { currentStep } = get();
    if (currentStep >= TUTORIAL_STEPS.length) {
      set({ active: false });
    } else {
      set({ currentStep: currentStep + 1, stoneWasPlaced: false, directionWasChosen: false });
    }
  },

  onStonePlaced: () => {
    const { currentStep, advanceStep } = get();
    const step = TUTORIAL_STEPS[currentStep - 1];
    set({ stoneWasPlaced: true });
    if (step?.waitForAction === 'place-stone') {
      // Don't advance yet — wait for direction too (step 1 & 3 & 4)
      // Step 1 advances after direction chosen in onDirectionChosen
    }
  },

  onDirectionChosen: () => {
    const { currentStep, stoneWasPlaced, advanceStep } = get();
    const step = TUTORIAL_STEPS[currentStep - 1];
    set({ directionWasChosen: true });
    if (step?.waitForAction === 'choose-direction') {
      advanceStep();
    } else if (step?.waitForAction === 'place-stone' && stoneWasPlaced) {
      // After both stone + direction (steps 1, 3, 4)
      setTimeout(advanceStep, 800);
    }
  },
}));
