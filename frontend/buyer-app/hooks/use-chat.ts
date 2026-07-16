import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string | number;
  user: string;
  text: string;
}

export function useChat(roomId: string, initialMessages: ChatMessage[] = []) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    // Usually API URL is http://localhost:3000/api, we need http://localhost:3000
    const socketUrl = apiBaseUrl.replace('/api', '');

    const socket = io(socketUrl, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { roomId });
    });

    // Fetch initial chat history
    fetch(`${apiBaseUrl}/chat/history/${roomId}`)
      .then(res => res.json())
      .then(history => {
         if (Array.isArray(history) && history.length > 0) {
            setMessages(history);
         }
      })
      .catch(console.error);

    socket.on('chat_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const sendMessage = (text: string, username: string = 'You') => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat_message', {
        roomId,
        username,
        text
      });
    } else {
      // Fallback
      setMessages((prev) => [...prev, { id: Date.now().toString(), user: username, text }]);
    }
  };

  return { messages, sendMessage };
}
