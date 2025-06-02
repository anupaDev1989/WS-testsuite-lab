import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming ScrollArea component

interface RawLogDisplayProps {
  requestLog: string;
  responseLog: string;
}

const RawLogDisplay: React.FC<RawLogDisplayProps> = ({ requestLog, responseLog }) => {
  const formatJson = (logString: string) => {
    try {
      // Attempt to parse and re-stringify if it's a JSON string representing an object/array
      // This is a simple check; more robust parsing might be needed if logs are complex
      if ((logString.startsWith('{') && logString.endsWith('}')) || (logString.startsWith('[') && logString.endsWith(']'))) {
        const parsed = JSON.parse(logString);
        return JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      // Not a valid JSON string, or some other error, return as is
    }
    return logString; // Return original if not clearly a JSON object/array string or if parsing fails
  };

  return (
    <div className="flex-1 flex flex-col text-xs font-mono bg-black text-green-400 rounded-md p-2 overflow-hidden h-full">
      <ScrollArea className="flex-1 h-full">
        <div className="p-1">
          <h3 className="text-sm text-yellow-400 mb-1 border-b border-gray-700 pb-1">▼ Frontend API Call:</h3>
          <pre className="whitespace-pre-wrap break-all p-1 bg-opacity-20 bg-gray-700 rounded max-h-40 overflow-y-auto">{requestLog ? formatJson(requestLog) : 'No request data yet...'}</pre>
          
          <h3 className="text-sm text-yellow-400 mt-2 mb-1 border-b border-gray-700 pb-1">▼ Worker Response:</h3>
          <pre className="whitespace-pre-wrap break-all p-1 bg-opacity-20 bg-gray-700 rounded max-h-40 overflow-y-auto">{responseLog ? formatJson(responseLog) : 'No response data yet...'}</pre>
        </div>
      </ScrollArea>
    </div>
  );
};

export default RawLogDisplay;
