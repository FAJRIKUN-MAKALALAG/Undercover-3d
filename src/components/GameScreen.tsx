import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { TableScene } from './TableScene';
import { Send, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SoundManager } from '../lib/sounds';

export function GameScreen() {
  const { room, socket, sendDescription, votePrompt, submitVote, playAgain, forceRestart } = useGameStore();
  const [desc, setDesc] = useState('');
  const [prevStatus, setPrevStatus] = useState<string>('');

  useEffect(() => {
    if (room && room.status !== prevStatus) {
      if (room.status === 'voting') SoundManager.playTurn();
      if (room.status === 'ended') {
        const isWinner = room.winner === room.players.find(p => p.id === socket?.id)?.role;
        if (isWinner) SoundManager.playWin();
        else SoundManager.playLose();
      }
      setPrevStatus(room.status);
    }
  }, [room?.status, prevStatus, room?.winner, socket?.id]);

  if (!room || !socket) return null;

  const me = room.players.find(p => p.id === socket.id);
  const isMyTurn = room.players[room.currentTurnIndex]?.id === socket.id;
  const isVotingPrompt = room.status === 'voting_prompt';
  const isVoting = room.status === 'voting';
  const isEnded = room.status === 'ended';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (desc.trim() && isMyTurn) {
      SoundManager.playPop();
      sendDescription(desc.trim());
      setDesc('');
    }
  };

  const handleVotePrompt = (vote: boolean) => {
    SoundManager.playClick();
    votePrompt(vote);
  };

  const handleSubmitVote = (id: string) => {
    SoundManager.playPop();
    submitVote(id);
  };

  const handlePlayAgain = () => {
    SoundManager.playTurn();
    playAgain();
  };

  return (
    <div className="flex-1 flex flex-col relative w-full h-full bg-slate-950 font-sans text-slate-200 overflow-hidden">
      {/* Top Bar - Sleek Theme */}
      <motion.div 
        initial={{ y: -50 }} animate={{ y: 0 }}
        className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/20">U</div>
          <h1 className="text-lg font-bold tracking-tight uppercase">Undercover <span className="text-red-500">3D</span></h1>
        </div>
        
        <div className="flex items-center gap-4 hidden sm:flex">
          <div className="bg-slate-800 px-3 py-1 rounded text-xs font-mono text-slate-400 border border-slate-700">ROOM: #{room.id}</div>
          <div className="flex items-center gap-2">
            {!isEnded && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
            <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              {isEnded ? 'Game Over' : isVoting ? 'Voting' : isVotingPrompt ? 'Vote Prompt' : 'Playing • Round ' + (Math.floor(room.messages.length / room.players.length) + 1)}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="px-3 py-1 sm:px-4 bg-slate-800 rounded text-xs font-bold text-slate-400 border border-slate-700 flex items-center">
            <span className="hidden sm:inline">Role:</span> 
            <span className={`sm:ml-2 uppercase px-2 py-0.5 rounded text-[10px] tracking-widest ${
            me?.role === 'civilian' ? 'bg-blue-900/30 text-blue-400 border border-blue-800/30' : 
            me?.role === 'undercover' ? 'bg-red-900/30 text-red-400 border border-red-800/30' : 'bg-slate-700 text-slate-300'
          }`}>{me?.role === '?' ? 'Hidden' : me?.role}</span>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-1 min-h-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950 relative">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
        
        {/* 3D Scene */}
        <div className="flex-1 absolute inset-0 z-0">
          <TableScene />
        </div>

        {/* Word Hud - Floating Bottom Center */}
        {room.status === 'playing' && !me?.isEliminated && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-slate-800/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Your Secret Word</span>
                <span className="text-xl font-black text-red-500 tracking-tight leading-none mt-1 uppercase">{me?.word || '??'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Overlays / Popups */}
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          {isVotingPrompt && !room.votePromptVotes[socket.id] && !me?.isEliminated && (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-8 rounded-2xl max-w-sm w-full text-center pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <h3 className="text-xl font-bold mb-2 tracking-tight uppercase text-slate-200">Round Complete</h3>
              <p className="text-slate-400 mb-8 text-sm">Ready to vote for the imposter or listen to more descriptions?</p>
              <div className="flex gap-4">
                <button onClick={() => handleVotePrompt(false)} className="flex-1 py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm tracking-wide text-slate-200 transition-colors">CONTINUE</button>
                <button onClick={() => handleVotePrompt(true)} className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 font-bold text-sm tracking-wide text-white shadow-lg shadow-red-900/20 transition-colors">VOTE NOW</button>
              </div>
            </div>
          )}

          {isVotingPrompt && room.votePromptVotes[socket.id] && (
            <div className="bg-slate-800/90 backdrop-blur-md px-6 py-2 rounded border border-slate-700 text-sm font-medium text-slate-400">
              Waiting for others to vote...
            </div>
          )}

          {isVoting && !room.votes[socket.id] && !me?.isEliminated && (
            <div className="bg-slate-900/95 backdrop-blur-md border-t-4 border-t-red-600 border-x border-b border-slate-700 p-8 rounded-2xl max-w-md w-full text-center pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <AlertTriangle className="mx-auto text-red-500 mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2 tracking-tight uppercase text-slate-200">Elimination Vote</h3>
              <p className="text-slate-400 mb-6 text-sm">Select the player you suspect.</p>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {room.players.map(p => {
                  if (p.isEliminated || p.id === socket.id) return null;
                  return (
                    <button key={p.id} onClick={() => handleSubmitVote(p.id)} className="w-full py-3 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm flex items-center justify-between transition-all group">
                      <span className="text-slate-300 group-hover:text-white">{p.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded">Select</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {isEnded && (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-8 rounded-2xl max-w-md w-full text-center pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <h3 className="text-2xl font-black mb-2 uppercase tracking-widest text-slate-200">Game Over</h3>
              <div className="text-sm text-slate-400 mb-8 uppercase tracking-widest">
                 Winner: <span className="font-bold text-red-500 text-xl block mt-1">{room.winner}</span>
              </div>
              
              <div className="text-left mb-8 border-t border-slate-800 pt-6">
                <h4 className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-4">Final Roles</h4>
                <div className="space-y-3">
                  {room.players.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-800 text-sm">
                      <span className="font-medium text-slate-300">{p.name} {p.isEliminated && <span className="text-red-500/80 text-xs ml-1">(X)</span>}</span>
                      <span className={`font-mono text-xs uppercase px-2 py-1 rounded ${p.role === 'civilian' ? 'bg-blue-900/20 text-blue-400 border border-blue-900/30' : p.role === 'undercover' ? 'bg-red-900/20 text-red-400 border border-red-900/30' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>
                        {p.role} 
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {me?.isReady ? (
                  <div className="w-full py-3 px-4 rounded-lg bg-slate-800 border border-slate-600 text-slate-400 font-bold text-sm tracking-wide text-center">
                    Menunggu pemain lain... ({room.players.filter(p => p.isReady).length}/{room.players.filter(p => !p.isBot).length})
                  </div>
                ) : (
                  <button onClick={handlePlayAgain} className="w-full py-3 px-4 rounded-lg bg-green-600 hover:bg-green-500 font-bold text-sm tracking-wide text-white shadow-lg shadow-green-900/20 transition-colors">
                    MULAI LAGI
                  </button>
                )}
                
                {room.hostId === socket.id && (
                  <button onClick={() => { SoundManager.playClick(); forceRestart(); }} className="w-full py-3 px-4 rounded-lg bg-orange-800 hover:bg-orange-700 border border-orange-600 hover:border-orange-500 text-slate-200 font-bold text-sm tracking-wide transition-colors">
                    MULAI PAKSA (KICK UNREADY)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar: Input */}
        <AnimatePresence>
          {room.status === 'playing' && !me?.isEliminated && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-20 pointer-events-none">
              {isMyTurn ? (
                <form onSubmit={handleSend} className="bg-slate-900 backdrop-blur-md border border-slate-700 p-2 rounded-lg flex items-center gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-auto">
                  <input
                    type="text"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Describe your word subtly..."
                    className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                    autoFocus
                  />
                  <button type="submit" disabled={!desc.trim()} className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50 hover:bg-red-500 transition-colors flex items-center gap-2">
                    SEND <Send size={14} />
                  </button>
                </form>
              ) : (
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 py-3 px-6 rounded-lg text-center shadow-xl pointer-events-auto w-max mx-auto">
                  <p className="text-slate-400 text-sm font-medium flex items-center gap-3">
                    Waiting for <span className="text-slate-200 font-bold">{room.players[room.currentTurnIndex]?.name}</span>
                    <span className="flex gap-1 h-1.5 items-center">
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="block w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.span>
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="block w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.span>
                      <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="block w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.span>
                    </span>
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {me?.isEliminated && room.status !== 'ended' && (
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="bg-red-900/80 backdrop-blur-md border border-red-500/50 px-6 py-2 rounded text-red-200 font-bold text-sm shadow-[0_0_30px_rgba(255,0,0,0.2)] uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={16} /> You were eliminated
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
