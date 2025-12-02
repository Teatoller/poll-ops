// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';

export class SocketService {
  private socket: Socket | null = null;

  connect(token: string): void {
    this.socket = io('http://localhost:5000', {
      auth: { token }
    });
  }

  joinPoll(pollId: number): void {
    this.socket?.emit('joinPoll', pollId);
  }

  onVoteUpdate(callback: (data: any) => void): void {
    this.socket?.on('voteUpdate', callback);
  }

  disconnect(): void {
    this.socket?.disconnect();
  }
}