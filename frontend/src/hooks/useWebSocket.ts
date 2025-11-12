import { useEffect, useCallback } from 'react';
import { getSocket, sendMessage } from '@services/websocket';
import { WebSocketMessage, WebSocketMessageType } from '../types';

/**
 * Custom Hook for WebSocket Communication
 * Provides easy access to WebSocket functionality
 */
export const useWebSocket = (): {
  send: (type: WebSocketMessageType, payload: unknown) => void;
  isConnected: boolean;
} => {
  const socket = getSocket();
  const isConnected = socket?.connected || false;

  const send = useCallback(
    (type: WebSocketMessageType, payload: unknown) => {
      sendMessage(type, payload);
    },
    []
  );

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      // Socket cleanup is handled in the service
    };
  }, []);

  return { send, isConnected };
};

/**
 * Hook to listen for specific WebSocket message types
 */
export const useWebSocketListener = (
  messageType: WebSocketMessageType,
  handler: (payload: unknown) => void
): void => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const messageHandler = (message: WebSocketMessage): void => {
      if (message.type === messageType) {
        handler(message.payload);
      }
    };

    socket.on('message', messageHandler);

    return () => {
      socket.off('message', messageHandler);
    };
  }, [messageType, handler]);
};
