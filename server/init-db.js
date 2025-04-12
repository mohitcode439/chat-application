const mongoose = require("mongoose")
const { v4: uuidv4 } = require("uuid")
const Room = require("./models/Room")

// MongoDB connection string - use environment variable
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/chatapp"

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log("Connected to MongoDB")

    // Check if general room exists
    const generalRoom = await Room.findOne({ name: "general" })

    // Create general room if it doesn't exist
    if (!generalRoom) {
      const newRoom = new Room({
        id: uuidv4(),
        name: "general",
      })
      await newRoom.save()
      console.log("Created general room")
    } else {
      console.log("General room already exists")
    }

    console.log("Database initialization complete")
  } catch (error) {
    console.error("Database initialization error:", error)
  } finally {
    // Close the connection
    await mongoose.connection.close()
  }
}

// Run the initialization
initializeDatabase()
