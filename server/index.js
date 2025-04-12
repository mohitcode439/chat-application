const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const mongoose = require("mongoose")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")

// MongoDB models
const User = require("./models/User")
const Room = require("./models/Room")
const Message = require("./models/Message")

// Initialize Express app
const app = express()
app.use(cors())
app.use(express.json())

// Create HTTP server
const server = http.createServer(app)

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://chat-application-tan-seven.vercel.app","https://social-animals-chat-application.vercel.app"]
        : "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// MongoDB connection string - use environment variable in production
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/chatapp"

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Socket.io connection
io.on("connection", (socket) => {
  console.log("New client connected")

  // Send current room list to the client
  const sendRoomList = async () => {
    try {
      const rooms = await Room.find()
      socket.emit("roomList", rooms)
    } catch (error) {
      console.error("Error fetching rooms:", error)
    }
  }

  sendRoomList()

  // Join a room
  socket.on("joinRoom", async ({ username, room }) => {
    socket.join(room)
    console.log(`${username} joined ${room}`)

    // Create user if not exists
    try {
      let user = await User.findOne({ username })
      if (!user) {
        user = new User({ username })
        await user.save()
      }
    } catch (error) {
      console.error("Error saving user:", error)
    }

    // Send room history
    try {
      const roomMessages = await Message.find({ room }).sort({ timestamp: 1 }).limit(50)
      socket.emit("message", ...roomMessages)
    } catch (error) {
      console.error("Error fetching messages:", error)
    }

    // Notify room about new user
    socket.to(room).emit("message", {
      id: uuidv4(),
      text: `${username} has joined the room`,
      username: "System",
      room,
      timestamp: new Date(),
    })
  })

  // Leave a room
  socket.on("leaveRoom", ({ username, room }) => {
    socket.leave(room)
    console.log(`${username} left ${room}`)

    // Notify room about user leaving
    socket.to(room).emit("message", {
      id: uuidv4(),
      text: `${username} has left the room`,
      username: "System",
      room,
      timestamp: new Date(),
    })
  })

  // Listen for chat messages
  socket.on("chatMessage", async ({ text, username, room }) => {
    const message = {
      id: uuidv4(),
      text,
      username,
      room,
      timestamp: new Date(),
    }

    // Save message to database
    try {
      const newMessage = new Message(message)
      await newMessage.save()
    } catch (error) {
      console.error("Error saving message:", error)
    }

    // Broadcast message to the room
    io.to(room).emit("message", message)
  })

  // Create a new room
  socket.on("createRoom", async ({ name }) => {
    try {
      const roomExists = await Room.findOne({ name })
      if (!roomExists) {
        const newRoom = new Room({
          id: uuidv4(),
          name,
        })
        await newRoom.save()
        sendRoomList()
      }
    } catch (error) {
      console.error("Error creating room:", error)
    }
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected")
  })
})

// API routes
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find()
    res.json(rooms)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get("/api/messages/:room", async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room }).sort({ timestamp: 1 }).limit(50)
    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" })
})

// Start server
const PORT = process.env.PORT || 8080
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
