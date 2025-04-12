"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlusCircle, Send } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Message {
  id: string
  text: string
  username: string
  room: string
  timestamp: Date
}

interface Room {
  id: string
  name: string
}

// Get the API URL based on environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoom, setCurrentRoom] = useState("general")
  const [newRoomName, setNewRoomName] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUsername = localStorage.getItem("chatUsername")
    if (!storedUsername) {
      router.push("/")
      return
    }
    setUsername(storedUsername)

    // Connect to the socket server
    const newSocket = io(API_URL)
    setSocket(newSocket)

    // Socket event listeners
    newSocket.on("connect", () => {
      setIsConnected(true)
      newSocket.emit("joinRoom", { username: storedUsername, room: currentRoom })
    })

    newSocket.on("message", (message: Message) => {
      setMessages((prev) => [...prev, message])
    })

    newSocket.on("roomList", (roomList: Room[]) => {
      setRooms(roomList)
    })

    // Clean up on component unmount
    return () => {
      newSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (socket && isConnected) {
      // Leave previous room and join new room when room changes
      socket.emit("leaveRoom", { username, room: currentRoom })
      socket.emit("joinRoom", { username, room: currentRoom })
      setMessages([])
    }
  }, [currentRoom, socket, isConnected])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && socket) {
      const newMessage = {
        text: message,
        username,
        room: currentRoom,
      }
      socket.emit("chatMessage", newMessage)
      setMessage("")
    }
  }

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (newRoomName.trim() && socket) {
      socket.emit("createRoom", { name: newRoomName })
      setNewRoomName("")
      setIsDialogOpen(false)
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatMessage = (text: string) => {
    // Basic formatting for bold, italic, and links
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">$1</a>',
      )

    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with rooms */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Rooms</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Enter room name"
                  />
                </div>
                <Button type="submit">Create Room</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-1">
          <Button
            variant={currentRoom === "general" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setCurrentRoom("general")}
          >
            # general
          </Button>
          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={currentRoom === room.name ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setCurrentRoom(room.name)}
            >
              # {room.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-bold">#{currentRoom}</h1>
          <p className="text-sm text-gray-500">
            Connected as <span className="font-medium">{username}</span>
          </p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg?.username === username ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg?.username === username ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-900"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{msg?.username === username ? "You" : msg?.username || "Unknown User"}</div>
                  <div className="break-words">{formatMessage(msg?.text || "")}</div>
                  <div className="text-xs mt-1 opacity-70">{formatTimestamp(msg?.timestamp || new Date())}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message #${currentRoom}`}
              className="flex-1"
            />
            <Button type="submit" disabled={!isConnected}>
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </form>
          <div className="text-xs text-gray-500 mt-2">Tip: Use **bold**, *italic*, and paste links for formatting</div>
        </div>
      </div>
    </div>
  )
}
