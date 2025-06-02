import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WorkerTestDashboard } from '@/components/worker-test/WorkerTestDashboard';

export default function DevTestingEnvironment() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check localStorage for persisted login state on mount
  useEffect(() => {
    const storedLoginStatus = localStorage.getItem('isLoggedIn');
    if (storedLoginStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0E1525]">
        <div className="bg-[#1E293B] p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Welcome to Test Suite Lab</h1>
          <p className="text-gray-300 mb-6 text-center">
            Please sign in to access the Cloudflare Worker Test Console
          </p>
          <div className="flex justify-center">
            <Button 
              onClick={() => {
                localStorage.setItem('isLoggedIn', 'true');
                setIsLoggedIn(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0E1525]">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Cloudflare Worker Test Console</h1>
            <p className="text-gray-400">
              Test your Cloudflare Worker endpoints and verify your connection to the deployed worker.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="text-white border-gray-600 hover:bg-gray-700"
            onClick={() => {
              localStorage.removeItem('isLoggedIn');
              setIsLoggedIn(false);
              navigate('/');
            }}
          >
            Sign Out
          </Button>
        </div>
        
        <WorkerTestDashboard />
      </div>
    </div>
  );
}
