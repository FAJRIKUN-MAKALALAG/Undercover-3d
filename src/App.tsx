/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { LoginScreen } from './components/LoginScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';

export default function App() {
  const { connect, room } = useGameStore();

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      {!room ? (
        <LoginScreen />
      ) : room.status === 'lobby' ? (
        <LobbyScreen />
      ) : (
        <GameScreen />
      )}
    </div>
  );
}

