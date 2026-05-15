import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { motion } from 'motion/react';
import { SoundManager } from '../lib/sounds';

export function LoginScreen() {
  const [roomId, setRoomId] = useState('');
  const { playerName, setPlayerName, joinRoom } = useGameStore();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomId.trim()) {
      SoundManager.init();
      SoundManager.playClick();
      joinRoom(roomId.trim().toUpperCase());
    }
  };

  const handleCreate = () => {
    if (playerName.trim()) {
      SoundManager.init();
      SoundManager.playClick();
      const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
      joinRoom(newRoom);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <motion.div 
        animate={{ backgroundPosition: ["0px 0px", "40px 40px"] }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="absolute inset-0 opacity-10 bg-grid" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="z-10 bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        <h1 className="text-3xl font-bold mb-2 text-center tracking-tight uppercase">
          Undercover <span className="text-red-500">3D</span>
        </h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          A multiplayer social deduction game.
        </p>

        <form onSubmit={handleJoin} className="flex flex-col gap-5">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. detective007"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-red-500 transition-colors"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">
              Room Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Code"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-red-500 transition-colors uppercase"
              />
              <button
                type="submit"
                disabled={!roomId || !playerName}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg shadow-red-900/20 transition-all"
              >
                JOIN
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">or</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={!playerName}
            className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 border border-slate-700 px-6 py-3 rounded-lg font-bold text-sm shadow-md transition-colors"
          >
            CREATE NEW ROOM
          </button>
        </form>
      </motion.div>
    </div>
  );
}
