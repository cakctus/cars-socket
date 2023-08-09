// dotenv
import * as dotenv from "dotenv"
dotenv.config()
// express
import express from "express"
import cors from "cors"
// socket.io
import { Server } from "socket.io"
// http
import { createServer } from "http"

const app = express()
const server = createServer(app)

server.listen(5001, () => {
  console.log("server is running")
})

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
})

const onlineUsers = new Map()

const connectedUsers = {}

io.on("connection", (socket) => {
  /* receiving user from the client */
  socket.on("add-user", (userId) => {
    /* set user in a map */
    onlineUsers.set(userId, socket.id)

    /* send user to client */
    io.emit("user-status-change", Array.from(onlineUsers))

    /* when user is disconnecting  */
    socket.on("disconnect", () => {
      const userId = [...onlineUsers.entries()].find(
        ([key, value]) => value === socket.id
      )?.[0]
      if (userId) {
        onlineUsers.delete(userId)
        /* send updating data to the client */
        io.emit("exit-user", userId)
      }
    })
  })

  // socket.on("send-message", (message) => {
  //   // Save the message to the database or perform any desired actions
  //   // console.log("Received message:", message)
  //   // Broadcast the message to all connected clients except the sender
  //   socket.broadcast.emit("receive-message", message)
  // })

  /* receiving message from the client with specific ID */
  socket.on("send-msg", (data) => {
    /* from */
    // const socketFrom = onlineUsers.get(data.from)
    /* to */
    const sendUserSocket = onlineUsers.get(data.to)

    /* receiving message from the client with specific ID */
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", {
        message: data.message,
        from: data.from,
        to: data.to,
        id: Date.now(),
        unread: data.unread,
      })
    }
  })

  /* sended when user receiving bottom of div element */
  socket.on("message-read", (messageId) => {
    const senderSocketId = onlineUsers.get(messageId)
    /* Notify the sender that the message has been read */
    if (senderSocketId) {
      // connectedUsers.emit("message-read-notification", messageId)
      socket.to(senderSocketId).emit("message-read-notification", messageId)
    }
  })

  /* check if recipient is online or not when sender send message */
  socket.on("send-message", (data) => {
    const recipient = onlineUsers.get(data.to)
    // const sender = onlineUsers.get(message.from)
    if (recipient) {
      /*if recipient is online send recevied true */
      socket.emit("message-sended", {
        received: true,
      })
    } else {
      /*if recipient is not online send recevied true */
      socket.emit("message-sended", { received: false })
    }
  })

  /* handle a user joining the chat */
  socket.on("join", (userId) => {
    connectedUsers[userId] = socket
  })

  // // // Handle a user leaving the chat
  // socket.on("disconnect", () => {
  //   const userId = Object.keys(connectedUsers).find(
  //     (key) => connectedUsers[key] === socket
  //   )
  //   delete connectedUsers[userId]
  // })

  /* receive recepientId when typing */
  socket.on("typing", (recipientId) => {
    if (connectedUsers[recipientId]) {
      /* send event to recepient */
      connectedUsers[recipientId].emit("typing")
    }
  })

  /* receive recepientId when stop typing */
  socket.on("stopTyping", (recipientId) => {
    if (connectedUsers[recipientId]) {
      /* send event to recepient */
      connectedUsers[recipientId].emit("stopTyping")
    }
  })
})
