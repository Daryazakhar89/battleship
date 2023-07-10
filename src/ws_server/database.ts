export interface User {
  name: string;
  password: string;
  id: number;
}

export interface Room {
  roomId: number;
  roomUsers: User[];
}

export const users: User[] = [];
export const rooms: Room[] = [];