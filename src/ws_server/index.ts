import WebSocket from "ws";

import { Action } from "./actions";
import { users, rooms, User, Ships, ship, ships} from "./database";
import {
  ExtendedWebSocket,
  sendUpdatedRooms,
  sendCreateGame,
  sendRegisterUser,
  sendCreateRooms,
} from "./sendCommands";

let user: User;
let playerGameData: Ships;

const server = new WebSocket.Server({
  port: 3000,
});

server.on("connection", (socket: ExtendedWebSocket) => {
  console.log("WebSocket has been connected!");

  socket.on("message", (buffer: Buffer) => {
    console.log(String(buffer));
    const message = JSON.parse(buffer.toString());
    message.data = JSON.parse(message.data || null);

    if (message.type === Action.Register) {
      user = {
        name: message.data.name,
        password: message.data.password,
        id: users.length,
      };

      sendRegisterUser(user, socket);
      sendUpdatedRooms(socket);
    } else if (message.type === Action.CreateRoom) {
      sendCreateRooms(socket);
      sendUpdatedRooms(socket);
    } else if (message.type === Action.AddUserToRoom) {
      const indexRoom = message.data.indexRoom;
      const room = rooms.find((room) => room.roomId === indexRoom);

      if (room && room.roomUsers.length === 1 && user) {
        socket.connectionState = {
          userId: socket.connectionState.userId,
          roomId: room.roomId,
        };
        room.roomUsers.push(user);

        sendUpdatedRooms(socket);
        sendCreateGame(server, socket);
      }
    } else if (message.type === Action.AddShips) {
      playerGameData = {
        gameId: message.data.idGame,
        indexPlayer: user.id,
        ships: message.data.ships,
      }
      ships.push(playerGameData);

      socket.send(JSON.stringify({
        type: Action.StartGame,
        data:
            {
                ships: playerGameData.ships,
                currentPlayerIndex: playerGameData.indexPlayer,
            },
        id: 0,
    }))
    }
  });

  socket.on("close", () => {
    console.log("WebSocket connection closed!");
  });
});

