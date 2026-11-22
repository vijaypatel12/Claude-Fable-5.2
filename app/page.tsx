'use client';

export const dynamic = 'force-dynamic';

import { useGameStore } from '../src/store/gameStore';
import { HomeScreen } from '../src/components/HomeScreen';
import { GameScreen } from '../src/components/GameScreen';
import { HowToPlayModal } from '../src/components/HowToPlayModal';

export default function Page() {
  const screen = useGameStore((s) => s.screen);

  return (
    <>
      {screen === 'home' && <HomeScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'howtoplay' && <HowToPlayModal />}
    </>
  );
}
