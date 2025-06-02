import React, { useState } from 'react';
import { Button } from '@/components/ui/button'; // Assuming Button component
import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea component
import { Send } from 'lucide-react'; // Assuming lucide-react for icons

interface MessageInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message);
      setMessage(''); // Clear input after sending
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message to the LLM..."
        className="flex-1 resize-none bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
        rows={3}
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <Button 
        type="submit" 
        disabled={isLoading || !message.trim()} 
        className="bg-blue-600 hover:bg-blue-700 text-white h-full px-4 py-2 aspect-square flex items-center justify-center"
        style={{height: 'auto', alignSelf: 'stretch'}}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
};

export default MessageInput;
