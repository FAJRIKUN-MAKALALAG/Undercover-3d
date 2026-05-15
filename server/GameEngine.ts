import { Server, Socket } from "socket.io";
import { GoogleGenAI } from "@google/genai";

interface Player {
  id: string;
  name: string;
  isBot: boolean;
  avatarIndex?: number;
  word: string;
  role: 'civilian' | 'undercover' | 'mrwhite' | '?';
  isEliminated: boolean;
  isReady?: boolean;
}

interface Room {
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
  roundSpeakerCount: number;
}

const WORD_PAIRS = [
  ['Sepeda', 'Motor'],
  ['Apel', 'Jeruk'],
  ['Kucing', 'Anjing'],
  ['Polisi', 'Tentara'],
  ['Buku', 'Koran'],
  ['Matahari', 'Bulan'],
  ['Kopi', 'Teh'],
  ['Gitar', 'Biola']
];

const BOT_NAMES = [
  "Budi", "Siti", "Joko", "Ayu", "Agus", "Dewi", 
  "Hendro", "Lestari", "Andi", "Rini", "Rudi", "Eka"
];

export class GameEngine {
  private io: Server;
  private rooms: Map<string, Room> = new Map();
  private ai: GoogleGenAI | null = null;
  private botCounter = 1;

  constructor(io: Server) {
    this.io = io;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        this.ai = new GoogleGenAI({ apiKey: apiKey });
      } else {
        console.warn("Valid GEMINI_API_KEY not found. Bots will use fallback logic.");
      }
    } catch (e) {
      console.error("Failed to init AI:", e);
    }
  }

  joinRoom(socket: Socket, roomId: string, playerName: string) {
    socket.join(roomId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        hostId: socket.id,
        status: 'lobby',
        players: [],
        currentTurnIndex: 0,
        wordPair: ['', ''],
        messages: [],
        votes: {},
        votePromptVotes: {},
        winner: null,
        roundSpeakerCount: 0
      });
    }

    const room = this.rooms.get(roomId)!;
    // Check if player exists
    const exists = room.players.find(p => p.id === socket.id);
    if (!exists) {
      const isLateJoin = room.status !== 'lobby';
      room.players.push({
        id: socket.id,
        name: playerName,
        isBot: false,
        word: '',
        role: isLateJoin ? '?' : 'civilian',
        isEliminated: isLateJoin, // Cannot play current round if late
        avatarIndex: room.players.length % 5,
        isReady: false
      });
    }

    this.broadcastRoomState(roomId);
  }

  addBot(requesterId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== requesterId || room.status !== 'lobby') return;

    const usedNames = new Set(room.players.map(p => p.name.replace(' (Bot)', '')));
    const availableNames = BOT_NAMES.filter(n => !usedNames.has(n));
    const randomName = availableNames.length > 0 ? availableNames[Math.floor(Math.random() * availableNames.length)] : BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const uniqueName = `${randomName} (Bot)`;

    room.players.push({
      id: `bot_${this.botCounter++}`,
      name: uniqueName,
      isBot: true,
      word: '',
      role: 'civilian',
      isEliminated: false,
      avatarIndex: room.players.length % 5,
      isReady: true // bots always ready
    });

    this.broadcastRoomState(roomId);
  }

  startGame(requesterId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== requesterId || room.players.length < 3) return;

    room.status = 'playing';
    room.currentTurnIndex = 0;
    room.roundSpeakerCount = 0;
    room.messages = [];
    room.votes = {};
    room.votePromptVotes = {};
    room.winner = null;

    // Assign roles randomly
    const shuffled = [...room.players].sort(() => Math.random() - 0.5);
    const wPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    const isMirrored = Math.random() > 0.5;
    room.wordPair = [wPair[isMirrored ? 1 : 0], wPair[isMirrored ? 0 : 1]];

    let ucIndex = 0;
    let mwIndex = -1;
    if (room.players.length >= 4) {
      mwIndex = 1; // 1 Mr White
    }

    shuffled.forEach((p, i) => {
      p.isEliminated = false;
      if (i === ucIndex) {
        p.role = 'undercover';
        p.word = room.wordPair[1];
      } else if (i === mwIndex) {
        p.role = 'mrwhite';
        p.word = '';
      } else {
        p.role = 'civilian';
        p.word = room.wordPair[0];
      }
    });

    // Start with a valid player randomly
    this.advanceTurnUntilValid(room, Math.floor(Math.random() * room.players.length));

    this.broadcastRoomState(roomId);
    this.checkBotTurn(room);
  }

  private advanceTurnUntilValid(room: Room, startIndex: number) {
    let attempts = 0;
    room.currentTurnIndex = startIndex;
    while (room.players[room.currentTurnIndex].isEliminated && attempts < room.players.length) {
      room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
      attempts++;
    }
  }

  handleDescription(playerId: string, roomId: string, description: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer.id !== playerId) return;

    room.messages.push({
      id: Math.random().toString(),
      playerId,
      text: description
    });

    room.roundSpeakerCount++;
    const activePlayersCount = room.players.filter(p => !p.isEliminated).length;

    // Next turn
    this.advanceTurnUntilValid(room, (room.currentTurnIndex + 1) % room.players.length);

    if (room.roundSpeakerCount >= activePlayersCount) {
      // 1 full round done, go to voting prompt
      room.status = 'voting_prompt';
      room.votePromptVotes = {};
      room.roundSpeakerCount = 0;
    }

    this.broadcastRoomState(roomId);
    if (room.status === 'playing') {
      this.checkBotTurn(room);
    } else if (room.status === 'voting_prompt') {
      this.checkBotVotes(room, 'prompt');
    }
  }

  handleVotePrompt(playerId: string, roomId: string, voteForVoting: boolean) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'voting_prompt') return;

    const activePlayers = room.players.filter(p => !p.isEliminated);
    if (!room.players.find(p => p.id === playerId) || room.players.find(p => p.id === playerId)?.isEliminated) return;

    room.votePromptVotes[playerId] = voteForVoting;
    
    if (Object.keys(room.votePromptVotes).length === activePlayers.length) {
      const yesVotes = Object.values(room.votePromptVotes).filter(v => v).length;
      if (yesVotes > activePlayers.length / 2) {
        room.status = 'voting';
        room.votes = {};
        this.broadcastRoomState(roomId);
        this.checkBotVotes(room, 'elimination');
      } else {
        // continue playing
        room.status = 'playing';
        room.votePromptVotes = {};
        this.broadcastRoomState(roomId);
        this.checkBotTurn(room);
      }
      return;
    }

    this.broadcastRoomState(roomId);
  }

  submitEliminationVote(playerId: string, roomId: string, targetId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'voting') return;

    if (room.players.find(p => p.id === playerId)?.isEliminated) return;
    
    room.votes[playerId] = targetId;
    
    const activePlayers = room.players.filter(p => !p.isEliminated);
    if (Object.keys(room.votes).length >= activePlayers.length) {
      this.tallyVotes(room);
    }

    this.broadcastRoomState(roomId);
  }

  private tallyVotes(room: Room) {
    const counts: Record<string, number> = {};
    Object.values(room.votes).forEach(v => counts[v] = (counts[v] || 0) + 1);
    
    let maxVotes = 0;
    let target = null;
    let isTie = false;

    for (const [id, count] of Object.entries(counts)) {
      if (count > maxVotes) {
        maxVotes = count;
        target = id;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    if (target && !isTie) {
      const player = room.players.find(p => p.id === target);
      if (player) {
        player.isEliminated = true;
      }
    }

    this.checkWinCondition(room);
    
    if (room.status !== 'ended') {
      room.status = 'playing';
      room.votes = {};
      room.votePromptVotes = {};
      room.roundSpeakerCount = 0;
      this.checkBotTurn(room);
    }
  }

  playAgain(playerId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = true;
    }

    // Check if all real players are ready
    const realPlayers = room.players.filter(p => !p.isBot);
    const allReady = realPlayers.length > 0 && realPlayers.every(p => p.isReady);

    if (allReady) {
      this.restartGame(room);
    } else {
      this.broadcastRoomState(roomId);
    }
  }

  forceRestart(requesterId: string, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== requesterId) return;

    // kick unready real players
    room.players = room.players.filter(p => p.isBot || p.isReady);
    
    this.restartGame(room);
  }

  private restartGame(room: Room) {
    // Reset players state for a new game
    room.players.forEach(p => {
      p.isEliminated = false;
      p.role = 'civilian';
      p.word = '';
      if (!p.isBot) p.isReady = false;
    });
    room.winner = null;
    room.messages = [];
    room.votes = {};
    room.votePromptVotes = {};
    room.roundSpeakerCount = 0;
    room.status = 'lobby'; // temporarily to lobby

    // If we have at least 3 players (bots + real), start it instantly
    if (room.players.length >= 3) {
       this.startGame(room.hostId, room.id);
    } else {
       this.broadcastRoomState(room.id);
    }
  }

  private checkWinCondition(room: Room) {
    const active = room.players.filter(p => !p.isEliminated);
    const civs = active.filter(p => p.role === 'civilian').length;
    const bads = active.filter(p => p.role !== 'civilian').length;

    if (bads === 0) {
      room.status = 'ended';
      room.winner = 'civilian';
    } else if (bads >= civs) {
      room.status = 'ended';
      room.winner = 'undercover/mrwhite';
    }
  }

  handleDisconnect(socket: Socket) {
    // Just simple handling for now - mostly keep state
  }

  broadcastRoomState(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      // Hide words from roles
      // For real game, we should send individual state to each player, but to simplify for prototype, we send everyone's word only to that player if possible, but io.to(roomId) sends to all.
      // So let's construct sanitized state!
      this.io.to(roomId).socketsJoin(roomId); // ensure

      this.io.in(roomId).fetchSockets().then(sockets => {
        for (const sock of sockets) {
          const sanitized = JSON.parse(JSON.stringify(room));
          sanitized.players.forEach((p: Player) => {
            if (p.id !== sock.id && room.status !== 'ended') {
              p.word = '?';
              p.role = '?';
            }
          });
          sock.emit("room_state", sanitized);
        }
      });
    }
  }

  private async checkBotTurn(room: Room) {
    const currentPlayer = room.players[room.currentTurnIndex];
    if (currentPlayer && currentPlayer.isBot && !currentPlayer.isEliminated && room.status === 'playing') {
      // Simulate delay
      setTimeout(async () => {
        let desc = "Hmm, aku setuju sama yang lain...";
        if (this.ai) {
          try {
            const history = room.messages.map(m => {
              const p = room.players.find(x => x.id === m.playerId);
              return `${p?.name}: ${m.text}`;
            }).join('\n');
            const prompt = `Ini giliranmu di game Undercover.
Peranmu: ${currentPlayer.role}.
Kata rahasiamu: "${currentPlayer.word || "KAMU ADALAH MR. WHITE (KOSONG)"}"

Chat log sejauh ini (analisis deskripsi mereka):
${history || '(Kamu yang mulai pertama, berikan clue umum duluan)'}

INSTRUKSI KHUSUS SESUAI PERANMU:
${currentPlayer.role === 'civilian' ? '- Berikan klue samar (fungsi, rasa, tempat, bentuk) dari katamu. Clue harus nyambung, tapi jangan terlalu persis supaya Undercover kesulitan.' : ''}
${currentPlayer.role === 'undercover' ? '- Katamu sedikit berbeda dari pemain lain (Civilian)! Berikan clue yang nyambung dengan Chat log tapi masih terkait dengan katamu. Bertingkahlah senormal mungkin dan membaur.' : ''}
${currentPlayer.role === 'mrwhite' ? '- KAMU ADALAH MR. WHITE! Kamu TIDAK tahu satupun kata! Analisis Chat log dari pemain lain untuk meraba apa garis merah/benda yang dibicarakan, lalu berikan contoh sifat/deskripsi LUAS yang sangat generik agar kamu selamat (misal: "Harganya bervariasi", "Bisa nemu di rumah", "Orang sering pake tiap hari").' : ''}

ATURAN WAJIB:
1. DILARANG KERAS membeo (mengulang deskripsi orang), menyetujui ("aku setuju"), atau memberi respon sosial/basa-basi.
2. Panjang jawaban MAKSIMAL 6 KATA, gunakan bahasa gaul awam (contoh: "enak banget pas ujan", "ukurannya segenggaman tangan", "bikin mata perih", "teksturnya kasar").
3. Jangan pernah sebut langsung nama katamu!
4. Berikan langsung hasil deskripsimu tanpa intro atau tanda kutip.`;

            const response = await this.ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: prompt,
              config: { temperature: 1.0 }
            });
            let generated = response.text || "Bisa dipakai kapan saja";
            
            // Clean up: stop at newlines, trim quotes
            generated = generated.split('\n')[0].replace(/^["']|["']$/g, '').trim();
            if (generated.length > 50) generated = generated.substring(0, 50) + "...";
            desc = generated;
          } catch (e) {
            console.error("Bot AI error", e);
            desc = "Mirip lah sama yang dibilang " + (room.players.find(p => p.id !== currentPlayer.id && !p.isEliminated)?.name || "kalian");
          }
        }
        this.handleDescription(currentPlayer.id, room.id, desc.trim() + "!");
      }, 3000);
    }
  }

  private async checkBotVotes(room: Room, phase: 'prompt'|'elimination') {
    const bots = room.players.filter(p => p.isBot && !p.isEliminated);
    bots.forEach(bot => {
      // random delay for each bot
      setTimeout(() => {
        // Ensure state hasn't changed heavily
        const currentRoom = this.rooms.get(room.id);
        if (!currentRoom) return;

        if (phase === 'prompt' && currentRoom.status === 'voting_prompt') {
            // bot randomly votes to vote or not
            const voteToVote = Math.random() > 0.5;
            this.handleVotePrompt(bot.id, room.id, voteToVote);
        } else if (phase === 'elimination' && currentRoom.status === 'voting') {
            const validTargets = currentRoom.players.filter(p => p.id !== bot.id && !p.isEliminated);
            if (validTargets.length > 0) {
              const target = validTargets[Math.floor(Math.random() * validTargets.length)];
              this.submitEliminationVote(bot.id, room.id, target.id);
            }
        }
      }, 2000 + Math.random() * 3000);
    });
  }
}
