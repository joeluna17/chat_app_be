const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const app = express();
const { addUser, removeUser, getUser, getUsersInRoom } = require("./user");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = socketio(server);

const router = require("./router");
app.use(router);

io.on("connection", socket => {
  console.log("We have a new connection!");

  socket.on("join", ({ name, room }, callback) => {
    console.log("we have a join", name, room);
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, Welcome to the room ${user.room}`
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name}, has joined!` });

    socket.join(user.room);

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    console.log('here is the id', socket.id);
    const user = getUser(socket.id);
    console.log('here is the user:', user)
    io.to(user.room).emit("message", { user: user.name, text: message });
    callback();
  });

  socket.on("disconnect", () => {
      const user = removeUser(socket.id);

    if(user){
      io.to(user.room).emit('message',{ user:'admin', text:`${user.name} has left.` }) 
    }

    console.log("User has left!");
  });
});

server.listen(PORT, () => {
  console.log(`Majic Man on port ${PORT}`);
});
