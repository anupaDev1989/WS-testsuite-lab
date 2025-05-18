import { BackendType, TestResult } from '@/types';
import { format } from 'date-fns';

import { useState } from 'react';

interface StatusBarProps {
  backend: BackendType;
  testResult: TestResult | null;
}

export default function StatusBar({ backend, testResult }: StatusBarProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [workerInfo, setWorkerInfo] = useState<{ status: string, message: string } | null>(null);

  useEffect(() => {
    const checkWorkerStatus = async () => {
      try {
        const response = await fetch('https://testsuite-worker.des9891sl.workers.dev/health');
        const data = await response.json();
        setIsConnected(true);
        setWorkerInfo(data);
      } catch (error) {
        setIsConnected(false);
        setWorkerInfo(null);
      }
    };
    
    checkWorkerStatus();
    const interval = setInterval(checkWorkerStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#131A29] border-t border-[#1C2333] p-2 text-xs text-gray-400 flex items-center justify-between">
      <div className="flex items-center">
        <span className="flex items-center">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00C853]' : 'bg-[#F44336]'} mr-1`}></span>
          Cloudflare Worker: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div>
        {testResult ? (
          <>
            Last Test: {format(testResult.timestamp, 'MM-dd-yyyy HH:mm:ss')} | 
            Duration: {testResult.duration}ms | 
            Status: <span className={testResult.status === 'success' ? 'text-[#00C853]' : 'text-[#F44336]'}>
              {testResult.status === 'success' ? 'Success' : 'Error'}
            </span>
          </>
        ) : (
          'No tests run yet'
        )}
      </div>
    </div>
  );
}
