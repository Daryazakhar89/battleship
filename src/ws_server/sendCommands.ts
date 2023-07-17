import WebSocket, { WebSocketServer } from "ws";

import { users, rooms, Room, User } from "./database";
import { Action } from "./actions";

export interface ExtendedWebSocket extends WebSocket {
  connectionState: {
    userId: number;
    gameId?: number;
    roomId?: number;
  };
}

export const sendUpdatedRooms = (socket: WebSocket) => {
  const roomsWithOnePlayer = rooms.filter(
    (room) => room.roomUsers.length === 1
  );
  const formattedDataMessage = roomsWithOnePlayer.map((room) => {
    return {
      roomId: room.roomId,
      roomUsers: room.roomUsers.map((player) => ({
        name: player.name,
        index: player.id,
      })),
    };
  });

  socket.send(
    JSON.stringify({
      type: Action.UpdateRoom,
      data: JSON.stringify(formattedDataMessage),
      id: 0,
    })
  );
};

export const sendCreateGame = (
  wss: WebSocketServer,
  socket: ExtendedWebSocket
) => {
  const roomId = socket.connectionState.roomId;

  if (typeof roomId === "number") {
    wss.clients.forEach((client) => {
      const ws = Object.assign({}, client) as ExtendedWebSocket;

      if (ws.connectionState.roomId === roomId) {
        client.send(
          JSON.stringify({
            type: Action.CreateGame,
            data: JSON.stringify({
              idGame: ws.connectionState.gameId,
              idPlayer: ws.connectionState.userId,
            }),
            id: 0,
          })
        );
      }
    });
  }
};

export const sendRegisterUser = (user: User, socket: ExtendedWebSocket) => {
  let error = false;
  let errorText = "";

  socket.connectionState = {
    userId: user.id,
  };

  //backend validation
  if (user.name.length >= 6 && user.password.length >= 6) {
    users.push(user);
  } else {
    error = true;
    errorText = "Invalid lenght of user credentials";
  }

  socket.send(
    JSON.stringify({
      type: Action.Register,
      data: JSON.stringify({
        name: user.name,
        index: user.id,
        error,
        errorText,
      }),
      id: 0,
    })
  );
};

export const sendCreateRooms = (socket: ExtendedWebSocket) => {
  const room: Room = {
    roomId: rooms.length,
    roomUsers: [users[0]],
  };

  rooms.push(room);
  socket.connectionState = {
    userId: socket.connectionState.userId,
    roomId: room.roomId,
  };
};

