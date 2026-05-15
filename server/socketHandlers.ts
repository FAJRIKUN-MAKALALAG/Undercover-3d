import { Server, Socket } from "socket.io";
import { GameEngine } from "./GameEngine";

export function initSocketHandlers(io: Server) {
  const engine = new GameEngine(io);

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_room", (data: { roomId: string; playerName: string }) => {
      engine.joinRoom(socket, data.roomId, data.playerName);
    });

    socket.on("add_bot", (data: { roomId: string }) => {
      engine.addBot(socket.id, data.roomId);
    });

    socket.on("start_game", (data: { roomId: string }) => {
      engine.startGame(socket.id, data.roomId);
    });

    socket.on("send_description", (data: { roomId: string; description: string }) => {
      engine.handleDescription(socket.id, data.roomId, data.description);
    });

    socket.on("vote_prompt", (data: { roomId: string; voteForVoting: boolean }) => {
      engine.handleVotePrompt(socket.id, data.roomId, data.voteForVoting);
    });

    socket.on("submit_vote", (data: { roomId: string; targetId: string }) => {
      engine.submitEliminationVote(socket.id, data.roomId, data.targetId);
    });

    socket.on("play_again", (data: { roomId: string }) => {
      engine.playAgain(socket.id, data.roomId);
    });

    socket.on("force_restart", (data: { roomId: string }) => {
      engine.forceRestart(socket.id, data.roomId);
    });

    socket.on("disconnect", () => {
      engine.handleDisconnect(socket);
    });
  });
}
