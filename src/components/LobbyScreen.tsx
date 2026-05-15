import { useGameStore } from '../store/useGameStore';
import { Users, Bot, Play, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { SoundManager } from '../lib/sounds';

export function LobbyScreen() {
  const { room, socket, addBot, startGame } = useGameStore();
  const [copied, setCopied] = useState(false);

  if (!room || !socket) return null;

  const isHost = room.hostId === socket.id;

  const handleCopy = () => {
    SoundManager.playClick();
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddBot = () => {
    SoundManager.playPop();
    addBot();
  };

  const handleStartGame = () => {
    SoundManager.playTurn();
    startGame();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
      <motion.div 
        animate={{ backgroundPosition: ["0px 0px", "-40px -40px"] }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="absolute inset-0 opacity-10 bg-grid" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-lg bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col h-[70vh]"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">
              Room Code
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black tracking-widest text-slate-200">
                {room.id}
              </span>
              <button 
                onClick={handleCopy}
                className="p-1.5 hover:bg-slate-800 rounded bg-slate-800/50 border border-slate-700 transition-colors text-slate-300"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          <div className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2">
            <Users size={14} />
            {room.players.length} / 8
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {room.players.map((p, i) => (
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
              key={p.id} 
              className="flex items-center gap-4 bg-slate-950/50 border border-slate-800 p-3 rounded-lg"
            >
              <div className="w-8 h-8 rounded border-2 border-slate-700 bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300 shadow-inner">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                  {p.name}
                  {p.id === room.hostId && (
                    <span className="text-[10px] uppercase bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded">Host</span>
                  )}
                  {p.isBot && (
                    <span className="text-[10px] uppercase bg-blue-900/30 text-blue-400 border border-blue-800/30 px-2 py-0.5 rounded">Bot</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {isHost ? (
          <div className="mt-6 flex gap-3 pt-6 border-t border-slate-800">
            <button
              onClick={handleAddBot}
              disabled={room.players.length >= 8}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Bot size={18} /> ADD AI BOT
            </button>
            <button
              onClick={handleStartGame}
              disabled={room.players.length < 3}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-red-900/20"
            >
              <Play size={18} /> START GAME
            </button>
          </div>
        ) : (
          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-slate-500 text-sm font-medium pb-2 tracking-wide uppercase">
            Waiting for host to start the game...
          </div>
        )}
      </motion.div>
    </div>
  );
}
