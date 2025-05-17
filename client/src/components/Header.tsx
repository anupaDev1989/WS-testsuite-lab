import { BackendType } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayIcon, Code } from 'lucide-react';

interface HeaderProps {
  backend: BackendType;
  setBackend: (backend: BackendType) => void;
  onRunTest: () => void;
  isExecuting: boolean;
}

export default function Header({ backend, setBackend, onRunTest, isExecuting }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[#131A29] border-b border-[#1C2333]">
      <div className="flex items-center">
        <Code className="w-5 h-5 mr-2 text-[#0098FF]" />
        <h1 className="text-lg font-medium text-white">Development Testing Environment</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-400 mr-2">Backend:</span>
          <Select 
            value={backend} 
            onValueChange={(value) => setBackend(value as BackendType)}
          >
            <SelectTrigger className="h-8 w-40 bg-[#1C2333] border-[#1C2333] focus:ring-[#0098FF]">
              <SelectValue placeholder="Select backend" />
            </SelectTrigger>
            <SelectContent className="bg-[#1C2333] border-[#1C2333]">
              <SelectItem value="Express">Express</SelectItem>
              <SelectItem value="Cloudflare Worker">Cloudflare Worker</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={onRunTest}
          disabled={isExecuting}
          className="flex items-center bg-[#0098FF] hover:bg-[#0080DC] text-white px-3 py-1 h-8"
        >
          <PlayIcon className="h-4 w-4 mr-1" />
          Run Test
        </Button>
      </div>
    </header>
  );
}
