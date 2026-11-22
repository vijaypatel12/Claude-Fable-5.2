'use client';

import { useEffect, useRef } from 'react';
import { useTutorialStore, TUTORIAL_STEPS } from '../store/tutorialStore';
import { useGameStore } from '../store/gameStore';
import { Player } from '../engine/index';

export function TutorialOverlay() {
  const { active, currentStep, exitTutorial, advanceStep } = useTutorialStore();
  const startGame = useGameStore((s) => s.startGame);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = TUTORIAL_STEPS[currentStep - 1];

  // Auto-advance for final step
  useEffect(() => {
    if (!active || !step) return;
    if (step.autoAdvanceMs) {
      timerRef.current = setTimeout(advanceStep, step.autoAdvanceMs);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, currentStep, step, advanceStep]);

  if (!active || !step) return null;

  const progress = (currentStep / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Semi-transparent background strip at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <div className="mx-4 mb-6 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-paper-dark/30">
            <div
              className="h-full bg-warmGold transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-5">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                {TUTORIAL_STEPS.map((s) => (
                  <div
                    key={s.id}
                    className={`w-2 h-2 rounded-full transition-all ${
                      s.id < currentStep
                        ? 'bg-warmGold'
                        : s.id === currentStep
                        ? 'bg-warmGold w-4'
                        : 'bg-paper-dark/40'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-stoneBlack/40 font-medium">
                Step {currentStep} of {TUTORIAL_STEPS.length}
              </span>
            </div>

            {/* Content */}
            <h3
              className="text-lg font-bold text-stoneBlack mb-1"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {step.title}
            </h3>
            <p className="text-sm text-stoneBlack/65 leading-relaxed mb-4">
              {step.instruction}
            </p>

            {/* Action hint */}
            {step.waitForAction !== 'done' && step.waitForAction !== 'observe' && (
              <div className="flex items-center gap-2 text-xs text-warmGold font-medium">
                <span className="animate-pulse-soft">●</span>
                <span>
                  {step.waitForAction === 'place-stone'
                    ? 'Tap an empty cell on the board'
                    : 'Tap one of the direction arrows'}
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              {(step.waitForAction === 'done' || step.waitForAction === 'observe') && (
                <button
                  onClick={advanceStep}
                  className="flex-1 py-2.5 rounded-xl bg-stoneBlack text-white text-sm font-semibold hover:bg-stoneBlack-light transition-colors"
                >
                  {currentStep === TUTORIAL_STEPS.length ? 'Start Playing!' : 'Next →'}
                </button>
              )}
              <button
                onClick={() => {
                  exitTutorial();
                  startGame('computer', 'medium', Player.White);
                }}
                className="px-4 py-2.5 rounded-xl bg-paper-dark/30 text-stoneBlack/50 text-sm hover:bg-paper-dark/50 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
