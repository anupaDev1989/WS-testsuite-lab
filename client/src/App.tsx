import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import DevTestingEnvironment from "@/pages/DevTestingEnvironment";
import WorkerTestPage from "@/pages/WorkerTestPage";
import { ThemeProvider } from "next-themes";
import { CloudCog, LayoutDashboard } from "lucide-react";

function NavBar() {
  const [location] = useLocation();

  return (
    <nav className="bg-[#131A29] border-b border-[#1C2333] p-2">
      <div className="container mx-auto flex items-center">
        <div className="flex space-x-4">
          <Link href="/">
            <div className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              location === '/' 
                ? 'bg-[#1C2333] text-white' 
                : 'text-gray-300 hover:bg-[#1C2333] hover:text-white'
            }`}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Testing Dashboard
            </div>
          </Link>
          <Link href="/worker-test">
            <div className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              location === '/worker-test' 
                ? 'bg-[#1C2333] text-white' 
                : 'text-gray-300 hover:bg-[#1C2333] hover:text-white'
            }`}>
              <CloudCog className="w-4 h-4 mr-2" />
              Cloudflare Worker Test
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={DevTestingEnvironment} />
          <Route path="/worker-test" component={WorkerTestPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
