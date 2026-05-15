import express from "express";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const httpServer = createHttpServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});
const PORT = 3000;

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Real-time Game State and Socket Handlers
import { initSocketHandlers } from './server/socketHandlers';

initSocketHandlers(io);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
