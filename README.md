# ChatApp - Real-time Chat Application

A full-stack real-time chat application built with React.js, Node.js, Express.js, and MongoDB.

## Features

- Real-time messaging using Socket.io
- User authentication
- Create and join chat rooms
- Message formatting (bold, italic, links)
- Responsive design
- Message history
- User presence notifications

## Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time Communication**: Socket.io

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
   \`\`\`
   git clone https://github.com/yourusername/chatapp.git
   cd chatapp
   \`\`\`

2. Install frontend dependencies
   \`\`\`
   npm install
   \`\`\`

3. Install backend dependencies
   \`\`\`
   cd server
   npm install
   \`\`\`

### Running the Application

1. Start the MongoDB server (if using local MongoDB)
   \`\`\`
   mongod
   \`\`\`

2. Start the backend server
   \`\`\`
   cd server
   npm run dev
   \`\`\`

3. Start the frontend development server
   \`\`\`
   # From the root directory
   npm run dev
   \`\`\`

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

\`\`\`
chatapp/
├── app/                  # Next.js app directory
│   ├── chat/             # Chat page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (login)
├── components/           # UI components
├── server/               # Backend code
│   ├── models/           # MongoDB models
│   └── index.js          # Express and Socket.io server
└── README.md             # Project documentation
\`\`\`

## How It Works

1. Users enter a username on the home page
2. After entering a username, they are redirected to the chat page
3. Users can join existing rooms or create new ones
4. Messages are sent in real-time to all users in the same room
5. Message history is stored in MongoDB and loaded when joining a room

## License

MIT
