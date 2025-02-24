import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create an HTTP server for Express and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/chat", chatRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Store connected users: { username: socketId }
// let connectedUsers = {};
const userSockets = {}; // This stores the mapping of usernames to socket IDs


// **Socket.IO Logic**
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // **Join Event: Store username with socket ID**
  socket.on("join", (username) => {
    userSockets[username] = socket.id;
    console.log(`✅ ${username} connected with socket ID: ${socket.id}`);
  });

  socket.on("send-connection-request", ({ sender, receiver, aesKey }) => {
    const receiverSocket = userSockets[receiver];
    if (receiverSocket) {
      io.to(receiverSocket).emit("receive-connection-request", { sender, aesKey });
    }
    console.log(`🔑 ${sender} sent AES key to ${receiver}: ${aesKey}`);
  });

  // **Response Event (Accept/Reject)**
  socket.on("connection-response", ({ sender, receiver, accepted, aesKey }) => {
    const senderSocket = userSockets[sender];
    if (accepted && senderSocket) {
      console.log(`✅ Connection accepted between ${receiver} and ${sender}`);
      io.to(senderSocket).emit("connection-accepted", { receiver, aesKey });
    } else {
      io.to(senderSocket).emit("connection-rejected", { receiver });
    }
  });

  // **Message Event**
  socket.on("sendMessage", ({ sender, receiver, text }) => {
    const receiverSocketId = userSockets[receiver];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", { sender, text }); // Forward as-is
    }
  });


  // **Disconnect Event**
  socket.on("disconnect", () => {
    const user = Object.keys(userSockets).find((key) => userSockets[key] === socket.id);
    if (user) delete userSockets[user];
    console.log(`🔴 ${user} disconnected`);
  });
});

// **Start Server**
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
