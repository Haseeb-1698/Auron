import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

import { WS_URL, STORAGE_KEYS } from '@config/constants';
import { WebSocketMessage, WebSocketMessageType } from '../types';

/**
 * WebSocket Service
 * Manages real-time communication with the backend
 */
class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  /**
   * Initialize WebSocket connection
   */
  public connect(userId: string): void {
    if (this.socket?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    this.socket = io(WS_URL, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      toast.success('Connected to real-time updates');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect manually
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.handleConnectionError();
    });

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      toast.error('Real-time connection error');
    });

    // Custom events
    this.socket.on('message', (message: WebSocketMessage) => {
      this.handleMessage(message);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('Received WebSocket message:', message);

    // Emit custom event for message listeners
    window.dispatchEvent(
      new CustomEvent('ws:message', {
        detail: message,
      })
    );

    // Handle specific message types
    switch (message.type) {
      case WebSocketMessageType.LAB_STATUS_CHANGED:
        this.handleLabStatusChange(message.payload);
        break;
      case WebSocketMessageType.PROGRESS_UPDATED:
        this.handleProgressUpdate(message.payload);
        break;
      case WebSocketMessageType.HINT_UNLOCKED:
        toast.info('New hint unlocked!');
        break;
      case WebSocketMessageType.COLLABORATION_INVITE:
        this.handleCollaborationInvite(message.payload);
        break;
      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  /**
   * Handle lab status change
   */
  private handleLabStatusChange(payload: unknown): void {
    console.log('Lab status changed:', payload);
    // Redux store will handle this via listener
  }

  /**
   * Handle progress update
   */
  private handleProgressUpdate(payload: unknown): void {
    console.log('Progress updated:', payload);
    // Redux store will handle this via listener
  }

  /**
   * Handle collaboration invite
   */
  private handleCollaborationInvite(payload: unknown): void {
    const data = payload as { sessionName: string; inviterName: string };
    toast.info(`${data.inviterName} invited you to collaborate on ${data.sessionName}`);
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(): void {
    this.reconnectAttempts++;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Failed to connect to real-time updates. Please refresh the page.');
    }
  }

  /**
   * Reconnect to WebSocket
   */
  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        this.socket?.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }

  /**
   * Send message to server
   */
  public send(type: WebSocketMessageType, payload: unknown): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.socket.emit('message', message);
  }

  /**
   * Subscribe to specific message type
   */
  public on(event: string, handler: (data: unknown) => void): void {
    if (!this.socket) return;
    this.socket.on(event, handler);
  }

  /**
   * Unsubscribe from specific message type
   */
  public off(event: string, handler: (data: unknown) => void): void {
    if (!this.socket) return;
    this.socket.off(event, handler);
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('WebSocket disconnected');
    }
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get the socket instance
   */
  public getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
const wsService = new WebSocketService();

export const initializeWebSocket = (userId: string): (() => void) => {
  wsService.connect(userId);
  return () => wsService.disconnect();
};

export const sendMessage = (type: WebSocketMessageType, payload: unknown): void => {
  wsService.send(type, payload);
};

export const getSocket = (): Socket | null => {
  return wsService.getSocket();
};

export default wsService;
