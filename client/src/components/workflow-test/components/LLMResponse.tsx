import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming you have a ScrollArea component
import { Button } from '@/components/ui/button'; // Assuming Button component
import { Copy } from 'lucide-react'; // Assuming lucide-react for icons

interface LLMResponseProps {
  response: string;
  isLoading: boolean;
}

const LLMResponse: React.FC<LLMResponseProps> = ({ response, isLoading }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(response).catch(err => console.error('Failed to copy:', err));
  };

  return (
    <div className="flex-1 flex flex-col h-full relative bg-gray-750 rounded-md p-3">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-10 rounded-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <ScrollArea className="flex-1 h-full whitespace-pre-wrap text-sm">
        {response || (!isLoading && <span className='text-gray-400'>LLM response will appear here...</span>)}
      </ScrollArea>
      {response && !isLoading && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy} 
          className="mt-2 self-end bg-gray-700 hover:bg-gray-600 text-white"
        >
          <Copy className="h-4 w-4 mr-2" /> Copy Response
        </Button>
      )}
    </div>
  );
};

export default LLMResponse;
