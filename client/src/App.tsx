import { Switch, Route, useLocation, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import WorkerTestPage from "@/pages/WorkerTestPage";
import WorkflowTestPageWrapper from "@/pages/WorkflowTestPageWrapper"; // Added import
import UpdatePasswordPage from "@/pages/UpdatePasswordPage";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from 'react';
import useUuidStore from './stores/uuidStore';
import { CloudCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/LoginForm"; // Import LoginForm

function NavBar() {
  const [location] = useLocation();
  const navigate = useLocation()[1];

  const handleSignOut = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/');
  };

  return (
    <nav className="bg-[#131A29] border-b border-[#1C2333] p-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white">
              <CloudCog className="w-4 h-4 mr-2" />
              Cloudflare Worker Test Console
            </div>
          </Link>
          <Link href="/workflow-test">
            <div className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${location === '/workflow-test' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              Workflow Test
            </div>
          </Link>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="text-white border-gray-600 hover:bg-gray-700"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </nav>
  );
}

const Router = () => {
  const [location] = useLocation();
  
  // Check authentication for protected routes
  const isProtectedRoute = ['/', '/worker-test', '/update-password', '/workflow-test'].includes(location); // Added /workflow-test
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  
  // Redirect to signin if trying to access protected routes without authentication
  if (isProtectedRoute && !isAuthenticated) {
    return <Redirect to="/signin" />;
  }

  // Redirect root to worker-test if authenticated
  if (location === '/' && isAuthenticated) {
    return <Redirect to="/worker-test" />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#0E1525]">
      {location !== '/signin' && <NavBar />}
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={WorkerTestPage} />
          <Route path="/worker-test" component={WorkerTestPage} />
          <Route path="/update-password" component={UpdatePasswordPage} />
          <Route path="/signin" component={SignInPage} />
          <Route path="/workflow-test" component={WorkflowTestPageWrapper} /> {/* Added route */}
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
};

// SignInPage now uses the actual LoginForm component
function SignInPage() {
  const navigate = useLocation()[1];
  
  const handleLoginSuccess = () => {
    // localStorage.setItem('isLoggedIn', 'true'); // LoginForm already does this
    // The router will still use 'isLoggedIn' from localStorage for route protection.
    // Optionally, pre-cache the JWT here if desired, though WorkflowTestPage will also fetch it.
    // import { getSupabaseJWT } from '@/lib/authUtils'; // Would need to import this if used
    // getSupabaseJWT(); 
    navigate('/'); // Redirect to root, which should then redirect to /worker-test if authenticated
  };
  
  return (
    <div className="flex items-center justify-center h-full bg-[#0E1525]">
      <LoginForm onLoginSuccess={handleLoginSuccess} />
    </div>
  );
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await useUuidStore.getState().initializeUuid();
        setIsInitialized(true);
      } catch (e: any) {
        console.error('Failed to initialize app:', e);
        setError(e.message || 'Failed to initialize application');
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0E1525] text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Initialization Error</h1>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0E1525]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
