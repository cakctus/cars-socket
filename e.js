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
const clientUrl = process.env.CLIENT_URL

server.listen(5001, () => {
  console.log("server is running")
})

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
})

const onlineUsers = new Map()
const lastVisit = new Map()
const requestCounts = new Map()
const disconnectTimers = new Map()

const connectedUsers = {}
let timer

io.on("connection", (socket) => {
  /* receiving user from the client */
  socket.on("add-user", (userId) => {
    // const userData = lastVisit.get(userId)

    /* set user in a map */
    onlineUsers.set(userId, socket.id)

    console.log("connect", disconnectTimers.get(userId))

    if (lastVisit.get(userId)?.disconnectTimeout) {
      lastVisit.set(userId, {
        socketId: socket.id,
        id: userId,
        timestamp: new Date(),
        online: true,
        connected: true,
        resendConnect: "yes",
        disconnectTimeout: "yes",
      })
    } else {
      lastVisit.set(userId, {
        socketId: socket.id,
        id: userId,
        timestamp: new Date(),
        online: true,
        connected: true,
      })
    }

    console.log("connect", lastVisit.get(userId))

    if (!lastVisit.get(userId)?.resendConnect) {
      // console.log("send last-logout")
      io.emit("last-logout", Array.from(lastVisit))
    }

    const userData = lastVisit.get(userId)

    if (userData) {
      // console.log("lastVisitSelf")
      socket.emit("lastVisitSelf", Array.from(lastVisit))
    }

    socket.broadcast.emit(
      "update-received-message-status",
      Array.from(onlineUsers)
    ) // io.emit

    /* when user is disconnecting  */
    socket.on("disconnect", async () => {
      const userId = [...onlineUsers.entries()].find(
        ([key, value]) => value === socket.id
      )?.[0]
      if (userId) {
        onlineUsers.delete(userId)
        /* send updating data to the client */
        io.emit("exit-user", userId)
      }

      lastVisit.set(userId, {
        socketId: socket.id,
        id: userId,
        timestamp: new Date(),
        online: true,
        connected: true,
        disconnectTimeout: "asd",
      })

      console.log("disconnect", lastVisit.get(userId))

      const userData = lastVisit.get(userId)

      // if (userData) {
      const disconnectTime = new Date()
      // userData.disconnectTimeout = "yes"

      disconnectTimers.set(userId, {
        timeoutId: null,
        method: () => {
          const timeoutId = setTimeout(() => {
            lastVisit.set(userId, {
              socketId: socket.id,
              id: userId,
              timestamp: disconnectTime,
              online: false,
              connected: false,
            })
            io.emit("exit-user2", Array.from(lastVisit))
          }, 50000)
          return timeoutId
        },
      })

      const uData = disconnectTimers.get(userId)

      if (uData && typeof uData.method === "function") {
        uData.timeoutId = uData.method()
      }

      // timer = setTimeout(() => {
      //   lastVisit.set(userId, {
      //     socketId: socket.id,
      //     id: userId,
      //     timestamp: disconnectTime,
      //     online: false,
      //     connected: false,
      //     // disconnectTimeout: "asd",
      //   })
      //   console.log("timer set timeout", lastVisit.get(userId))
      //   io.emit("exit-user2", Array.from(lastVisit))
      //   // io.emit("user-disconnected", userId) // Emit a user-disconnected event
      // }, 50000)

      // Store the disconnectTimeout in userData for future reference
      // }

      // if (userData) {
      //   const connected = new Promise((resolve, reject) => {
      //     if (userData) {
      //       let timer = setTimeout(() => {
      //         lastVisit.set(userId, {
      //           socketId: socket.id,
      //           id: userId,
      //           timestamp: new Date(),
      //           online: false,
      //           connected: false,
      //         })
      //         resolve(lastVisit.get(userId), "exit2")
      //       }, 5000)
      //     } else {
      //       reject()
      //     }
      //   })

      //   const lastVisitPromise = await connected

      //   console.log(lastVisitPromise, "exit2")

      //   // setTimeout(() => {
      //   //   const userData = lastVisit.get(userId)

      //   //   console.log("exit1")
      //   //   if (userData) {
      //   //     lastVisit.set(userId, {
      //   //       socketId: socket.id,
      //   //       id: userId,
      //   //       timestamp: new Date(),
      //   //       online: false,
      //   //     })

      //   //     io.emit("exit-user2", Array.from(lastVisit))
      //   //   }
      //   // }, 2000)

      //   // lastVisit.set(userId, {
      //   //   socketId: socket.id,
      //   //   id: userId,
      //   //   timestamp: new Date(),
      //   //   online: false,
      //   // })
      // }
    })

    // // Clear any existing timer for the user
    // if (disconnectTimers.has(userId)) {
    //   clearTimeout(disconnectTimers.get(userId))
    // }

    // // Set a new timer for 3 seconds
    // disconnectTimers.set(
    //   userId,
    //   setTimeout(() => {
    //     const currentUserData = lastVisit.get(userId)

    //     if (currentUserData) {
    //       const currentTime = new Date().getTime()
    //       const disconnectTime = new Date(currentUserData.timestamp).getTime()
    //       const timeDifference = currentTime - disconnectTime

    //       if (timeDifference >= 3000) {
    //         // User has been disconnected for more than 3 seconds
    //         const originalTimestamp = new Date(currentUserData.timestamp)
    //         originalTimestamp.setSeconds(originalTimestamp.getSeconds() + 5)
    //         // console.log(originalTimestamp)

    //         // Perform additional logic here
    //         requestCounts.set(userId, 0)
    //       }
    //     }

    //     // Clear the timer from the Map
    //     disconnectTimers.delete(userId)
    //   }, 3000)
    // )
  })

  // socket.on("add-user", (userId) => {
  //   // Set user in the map with current timestamp and online status
  //   lastVisit.set(userId, {
  //     socketId: socket.id,
  //     timestamp: new Date(),
  //     online: true,
  //   })

  //   // Send updated online user list to clients
  //   io.emit("last-logout", Array.from(lastVisit))

  //   // When user is disconnecting
  //   socket.on("disconnect", () => {
  //     const userData = lastVisit.get(userId)

  //     if (userData) {
  //       // Mark user as offline and update timestamp
  //       lastVisit.set(userId, {
  //         socketId: socket.id,
  //         timestamp: new Date(),
  //         online: false,
  //       })

  //       io.emit("exit-user2", Array.from(lastVisit))
  //     }
  //   })
  // })

  // socket.on("send-message", (message) => {
  //   // Save the message to the database or perform any desired actions
  //   // console.log("Received message:", message)
  //   // Broadcast the message to all connected clients except the sender
  //   socket.broadcast.emit("receive-message", message)
  // })

  socket.on("delete-timer-id", (id) => {
    console.log(`delete timer id ${id}`)
    if (
      disconnectTimers.get(id) &&
      disconnectTimers.get(id).timeoutId !== null
    ) {
      clearTimeout(disconnectTimers.get(id).timeoutId)
    }
  })

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

  socket.on("sender", (data) => {
    const sendUserSocket = onlineUsers.get(data.userId)
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("receive-from-sender", data)
    }
  })

  /* sended when user receiving bottom of div element */
  socket.on("message-read", (messageId) => {
    const senderSocketId = onlineUsers.get(messageId.user)
    /* Notify the sender that the message has been read */
    if (senderSocketId) {
      // connectedUsers.emit("message-read-notification", messageId)
      socket.broadcast.emit("message-read-notification", {
        ...messageId,
        id: socket.id,
        id2: messageId.id,
        fromSelf: senderSocketId,
        shouldEmit: senderSocketId === onlineUsers.get(messageId.id),
      })
    }
  })

  socket.on("add-chat", (data) => {
    const recipient = onlineUsers.get(data.id)

    if (recipient) {
      socket.to(recipient).emit("added-chat", data)
    }
  })

  /* check if recipient is online or not when sender send message */
  socket.on("send-message", (data) => {
    const recipient = onlineUsers.get(data.to)
    // const sender = onlineUsers.get(message.from)

    if (recipient) {
      /*if recipient is online send recevied true */
      socket.emit("message-sended", {
        from: data.from,
        received: true,
        to: data.to,
      })
    } else {
      /*if recipient is not online send recevied false */
      socket.emit("message-sended", {
        from: data.from,
        received: false,
        to: data.to,
      })
    }
  })

  socket.on("check-user-online", (data) => {
    const user = onlineUsers.get(data.from)

    if (user) {
      socket.broadcast.emit("message-sended2", {
        from: data.from,
        received: true,
        count: requestCounts.get(data.from),
      })
    } else {
      /*if recipient is not online send recevied false */
      socket.broadcast.emit("message-sended2", {
        from: data.from,
        received: false,
        count: requestCounts.get(data.from),
      })
    }
  })

  socket.on("update-message-received", (data) => {
    const user = onlineUsers.get(data.to)
    console.log("update-message-received")
    if (user) {
      socket.emit("message-sended3", {
        from: data.from,
        to: data.to,
        received: true,
      })
    } else {
      /*if recipient is not online send recevied false */
      socket.emit("message-sended3", {
        from: data.from,
        received: false,
        to: data.to,
      })
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
  socket.on("typing", (data) => {
    const recipient = onlineUsers.get(data.userId)
    if (recipient) {
      /* send event to recepient */
      socket.to(recipient).emit("typing", data)
    }
  })

  /* receive recepientId when stop typing */
  socket.on("stopTyping", (data) => {
    const recipient = onlineUsers.get(data.userId)
    if (recipient) {
      /* send event to recepient */
      socket.to(recipient).emit("stopTyping", data)
    }
  })
})
