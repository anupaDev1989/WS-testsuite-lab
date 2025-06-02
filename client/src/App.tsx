import { Switch, Route, useLocation, Redirect, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import WorkerTestPage from "@/pages/WorkerTestPage";
import UpdatePasswordPage from "@/pages/UpdatePasswordPage";
import { ThemeProvider } from "next-themes";
import { CloudCog } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const isProtectedRoute = ['/', '/worker-test', '/update-password'].includes(location);
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
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
};

// Simple sign-in page for the router
function SignInPage() {
  const navigate = useLocation()[1];
  
  const handleSignIn = () => {
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/'); // Redirect to root which will handle the redirection to worker-test
  };
  
  return (
    <div className="flex items-center justify-center h-full bg-[#0E1525]">
      <div className="bg-[#1E293B] p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Welcome to Test Suite Lab</h1>
        <p className="text-gray-300 mb-6 text-center">
          Please sign in to access the Cloudflare Worker Test Console
        </p>
        <div className="flex justify-center">
          <Button 
            onClick={handleSignIn}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}

function App() {
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
