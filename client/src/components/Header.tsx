import { BackendType } from '@/types';
import { Button } from '@/components/ui/button';
import { PlayIcon, Code, CloudCog, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth';

interface HeaderProps {
  backend: BackendType;
  setBackend: (backend: BackendType) => void;
  onRunTest: () => void;
  isExecuting: boolean;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function Header({ backend, onRunTest, isExecuting, isLoggedIn, onLogout }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-2 bg-[#131A29] border-b border-[#1C2333]">
      <div className="flex items-center">
        <Code className="w-5 h-5 mr-2 text-[#0098FF]" />
        <h1 className="text-lg font-medium text-white">Development Testing Environment</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <CloudCog className="w-4 h-4 mr-2 text-[#0098FF]" />
          <span className="text-sm text-white">Cloudflare Worker</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={onRunTest}
            disabled={isExecuting}
            className="flex items-center bg-[#0098FF] hover:bg-[#0080DC] text-white px-3 py-1 h-8"
          >
            <PlayIcon className="h-4 w-4 mr-1" />
            Run Test
          </Button>
          
          {isLoggedIn && (
            <Button
              onClick={async () => {
                await signOut();
                onLogout();
              }}
              variant="ghost"
              className="text-white hover:bg-[#2D3343]"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
