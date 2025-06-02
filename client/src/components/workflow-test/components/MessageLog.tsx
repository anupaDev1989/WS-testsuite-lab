import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface MessageLogProps {
  messages: Message[];
}

const MessageLog: React.FC<MessageLogProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSenderClass = (sender: Message['sender']) => {
    switch (sender) {
      case 'user':
        return 'bg-blue-600 text-white self-end';
      case 'llm':
        return 'bg-green-600 text-white self-start';
      case 'system':
        return 'bg-red-600 text-white self-center text-sm italic';
      default:
        return 'bg-gray-700 text-gray-200 self-start';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-3 bg-gray-750 rounded-md scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-3 rounded-lg max-w-[80%] break-words shadow ${getSenderClass(msg.sender)}`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {new Date(msg.timestamp).toLocaleTimeString()} {msg.status && msg.status !== 'success' ? `(${msg.status})` : ''}
          </p>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageLog;
