export interface User {
  name: string;
  password: string;
  id: number;
}

export interface Room {
  roomId: number;
  roomUsers: User[];
}

export interface Ship {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  lenght: number;
  type: "small" | "medium" | "large" | "huge";
}
export interface Ships {
  gameId: number;
  indexPlayer: number;
  ships: Ship[];
}

export const users: User[] = [];
export const rooms: Room[] = [];
export const ship: Ship[] = [];
export const ships: Ships[] = [];