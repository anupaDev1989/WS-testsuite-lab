import { BackendType, TestResult } from '@/types';
import { format } from 'date-fns';

interface StatusBarProps {
  backend: BackendType;
  testResult: TestResult | null;
}

export default function StatusBar({ backend, testResult }: StatusBarProps) {
  return (
    <div className="bg-[#131A29] border-t border-[#1C2333] p-2 text-xs text-gray-400 flex items-center justify-between">
      <div className="flex items-center">
        <span className="flex items-center mr-4">
          <span className={`w-2 h-2 rounded-full ${backend === 'Express' ? 'bg-[#00C853]' : 'bg-gray-500'} mr-1`}></span>
          Express Server: {backend === 'Express' ? 'Active' : 'Inactive'}
        </span>
        <span className="flex items-center">
          <span className={`w-2 h-2 rounded-full ${backend === 'Cloudflare Worker' ? 'bg-[#00C853]' : 'bg-gray-500'} mr-1`}></span>
          Cloudflare Worker: {backend === 'Cloudflare Worker' ? 'Active' : 'Inactive'}
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
