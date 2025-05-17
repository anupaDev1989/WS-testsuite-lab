import { BackendType, TestResult } from '@/types';
import { format } from 'date-fns';

interface StatusBarProps {
  backend: BackendType;
  testResult: TestResult | null;
}

export default function StatusBar({ backend, testResult }: StatusBarProps) {
  // Simulate connection status for Cloudflare Worker
  const isConnected = true; // In a real app, this would be a state that checks actual connection status

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
