import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TerminalLine } from '@/types';
import { Terminal, Copy, RotateCw, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TerminalPanelProps {
  lines: TerminalLine[];
  onClear: () => void;
}

export default function TerminalPanel({ lines, onClear }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleCopy = () => {
    const textToCopy = lines.map(line => {
      if (typeof line.content === 'string') {
        return line.content;
      } else {
        return JSON.stringify(line.content, null, 2);
      }
    }).join('\n');
    
    navigator.clipboard.writeText(textToCopy)
      .catch(err => console.error('Error copying text: ', err));
  };

  const renderTerminalLine = (line: TerminalLine, index: number) => {
    switch (line.type) {
      case 'command':
        return (
          <div key={index} className="mb-3">
            <span className="terminal-prompt">dev-test &gt; </span>
            <span className="terminal-command">{line.content}</span>
          </div>
        );
      
      case 'info':
        return (
          <div key={index} className="mb-2">
            <span className="terminal-info">INFO: </span>
            <span>{line.content}</span>
          </div>
        );
        
      case 'request':
        // For request lines, handle structured data
        const requestData = typeof line.content === 'string' 
          ? line.content 
          : JSON.stringify(line.content, null, 2);
          
        return (
          <div key={index} className="mb-2">
            <div>{requestData}</div>
          </div>
        );
        
      case 'response':
        return (
          <div key={index} className="mb-2">
            <span>{line.content}</span>
          </div>
        );
        
      case 'response-body':
        // For JSON response body, format it nicely
        const isJsonString = typeof line.content === 'string' && line.content.trim().startsWith('{');
        const jsonContent = isJsonString ? JSON.parse(line.content) : line.content;
        const formattedJson = typeof jsonContent === 'object' 
          ? JSON.stringify(jsonContent, null, 2) 
          : line.content;
          
        return (
          <div key={index} className="mb-2">
            <span className="terminal-info">RESPONSE BODY:</span>
            <pre className="mt-1 ml-4 whitespace-pre-wrap">{formattedJson}</pre>
          </div>
        );
        
      case 'success':
        return (
          <div key={index} className="mb-2">
            <span className="terminal-success">SUCCESS: </span>
            <span>{line.content}</span>
          </div>
        );
        
      case 'error':
        return (
          <div key={index} className="mb-2">
            <span className="terminal-error">ERROR: </span>
            <span>{line.content}</span>
          </div>
        );
        
      case 'warning':
        return (
          <div key={index} className="mb-2">
            <span className="terminal-warning">WARNING: </span>
            <span>{line.content}</span>
          </div>
        );
        
      default:
        return (
          <div key={index} className="mb-2">{line.content}</div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1E1E1E]">
      <div className="flex items-center justify-between p-2 bg-[#131A29] border-b border-[#1C2333]">
        <div className="flex items-center">
          <Terminal className="h-4 w-4 mr-2 text-gray-400" />
          <span className="text-sm font-medium">Request/Response Terminal</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6 text-gray-400 hover:text-white hover:bg-[#1C2333]">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => window.location.reload()} className="h-6 w-6 text-gray-400 hover:text-white hover:bg-[#1C2333]">
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClear} className="h-6 w-6 text-gray-400 hover:text-white hover:bg-[#1C2333]">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1" ref={terminalRef}>
        <div className="p-4 font-mono text-sm terminal-text">
          {lines.length === 0 ? (
            <div className="text-gray-500 italic">
              Terminal output will appear here. Run a test to see results.
            </div>
          ) : (
            lines.map(renderTerminalLine)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
