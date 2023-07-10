import WebSocket, { WebSocketServer } from "ws";

enum Action {
  Register = "reg",
  CreateRoom = "create_room",
  AddUserToRoom = "add_user_to_room",
  UpdateRoom = "update_room",
  CreateGame = "create_game",
}

interface ExtendedWebSocket extends WebSocket {
  connectionState: {
    userId: number;
    gameId?: number;
    roomId?: number;
  };
}

interface User {
  name: string;
  password: string;
  id: number;
}

interface Room {
  roomId: number;
  roomUsers: User[];
}

const users: User[] = [];
const rooms: Room[] = [];

const server = new WebSocket.Server({
  port: 3000,
});

const sendUpdatedRooms = (socket: WebSocket) => {
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

const sendCreateGame = (wss: WebSocketServer, socket: ExtendedWebSocket) => {
  const roomId = socket.connectionState.roomId;

  if (typeof roomId === 'number') {
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

server.on("connection", (socket: ExtendedWebSocket) => {
  console.log("WebSocket has been connected!");
  let user: User | undefined;

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

      socket.connectionState = {
        userId: user.id,
      };
      users.push(user);

      socket.send(
        JSON.stringify({
          type: Action.Register,
          data: JSON.stringify({
            name: user.name,
            index: user.id,
            error: false,
            errorText: "",
          }),
          id: 0,
        })
      );
      sendUpdatedRooms(socket);
    } else if (message.type === Action.CreateRoom) {
      const room: Room = {
        roomId: rooms.length,
        roomUsers: [users[0]],
      };

      rooms.push(room);
      socket.connectionState = {
        userId: socket.connectionState.userId,
        roomId: room.roomId,
      };

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
    }
  });

  socket.on("close", () => {
    console.log("WebSocket connection closed!");
  });
});
