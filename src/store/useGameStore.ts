import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  avatarIndex?: number;
  word: string;
  role: 'civilian' | 'undercover' | 'mrwhite' | '?';
  isEliminated: boolean;
  isReady?: boolean;
}

export interface RoomState {
  id: string;
  hostId: string;
  status: 'lobby' | 'playing' | 'voting_prompt' | 'voting' | 'ended';
  players: Player[];
  currentTurnIndex: number;
  wordPair: [string, string];
  messages: { id: string; playerId: string; text: string }[];
  votes: Record<string, string>;
  votePromptVotes: Record<string, boolean>;
  winner: string | null;
}

interface GameStore {
  socket: Socket | null;
  connect: () => void;
  room: RoomState | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  
  // Actions
  joinRoom: (roomId: string) => void;
  addBot: () => void;
  startGame: () => void;
  sendDescription: (desc: string) => void;
  votePrompt: (voteForVoting: boolean) => void;
  submitVote: (targetId: string) => void;
  playAgain: () => void;
  forceRestart: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  room: null,
  playerName: '',
  setPlayerName: (name) => set({ playerName: name }),

  connect: () => {
    if (get().socket) return;
    const socket = io(); // Connects to same host/port 
    
    socket.on('room_state', (data: RoomState) => {
      set({ room: data });
    });

    set({ socket });
  },

  joinRoom: (roomId: string) => {
    const { socket, playerName } = get();
    if (socket) {
      socket.emit('join_room', { roomId, playerName: playerName || 'Player' });
    }
  },

  addBot: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('add_bot', { roomId: room.id });
    }
  },

  startGame: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('start_game', { roomId: room.id });
    }
  },

  sendDescription: (description: string) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('send_description', { roomId: room.id, description });
    }
  },

  votePrompt: (voteForVoting: boolean) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('vote_prompt', { roomId: room.id, voteForVoting });
    }
  },

  submitVote: (targetId: string) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('submit_vote', { roomId: room.id, targetId });
    }
  },

  playAgain: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('play_again', { roomId: room.id });
    }
  },

  forceRestart: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit('force_restart', { roomId: room.id });
    }
  }
}));
