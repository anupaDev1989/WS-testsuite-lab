import { useState, useEffect } from 'react';
import { workerService } from '@/lib/workerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CloudCog, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';

// Available worker endpoints
const WORKER_ENDPOINTS = [
  { value: '/health', label: 'Health Check', method: 'GET' },
  { value: '/api/users', label: 'Get Users', method: 'GET' },
  { value: '/api/test', label: 'Test Endpoint', method: 'POST' }
];

export function WorkerConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(WORKER_ENDPOINTS[0].value);
  const [selectedMethod, setSelectedMethod] = useState(WORKER_ENDPOINTS[0].method);
  const [requestBody, setRequestBody] = useState('{\n  "message": "Hello from the frontend!"\n}');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [useCustomEndpoint, setUseCustomEndpoint] = useState(false);

  // Check connection on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Update method when endpoint changes
  useEffect(() => {
    if (!useCustomEndpoint) {
      const endpoint = WORKER_ENDPOINTS.find(e => e.value === selectedEndpoint);
      if (endpoint) {
        setSelectedMethod(endpoint.method);
      }
    }
  }, [selectedEndpoint, useCustomEndpoint]);

  // Check connection to worker
  const checkConnection = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const health = await workerService.checkHealth();
      setConnectionStatus(health.status === 'connected' ? 'connected' : 'error');
      setResponseData(health);
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage('Failed to connect to worker');
      console.error('Connection check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send a request to the worker
  const sendRequest = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    const endpoint = useCustomEndpoint ? customEndpoint : selectedEndpoint;
    
    try {
      let parsedBody = {};
      if (requestBody && selectedMethod !== 'GET') {
        try {
          parsedBody = JSON.parse(requestBody);
        } catch (e) {
          setErrorMessage('Invalid JSON in request body');
          setIsLoading(false);
          return;
        }
      }
      
      let response;
      switch (selectedMethod) {
        case 'GET':
          response = await workerService.get(endpoint);
          break;
        case 'POST':
          response = await workerService.post(endpoint, parsedBody);
          break;
        case 'PUT':
          response = await workerService.put(endpoint, parsedBody);
          break;
        case 'DELETE':
          response = await workerService.delete(endpoint, parsedBody);
          break;
        default:
          response = await workerService.get(endpoint);
      }
      
      setResponseData(response);
    } catch (error: any) {
      setErrorMessage(error.message || 'Request failed');
      console.error('Request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CloudCog className="h-5 w-5 text-[#FF6B00]" />
              <CardTitle>Cloudflare Worker Connection</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-300'
              }`}></div>
              <span className="text-sm">
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'error' ? 'Error' : 'Checking...'}
              </span>
            </div>
          </div>
          <CardDescription>
            Test your connection to the Cloudflare Worker and send requests to different endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Connection Status */}
            {connectionStatus === 'connected' && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-500" />
                <AlertTitle>Connected</AlertTitle>
                <AlertDescription>
                  Successfully connected to the Cloudflare Worker at https://testsuite-worker.des9891sl.workers.dev
                </AlertDescription>
              </Alert>
            )}
            
            {connectionStatus === 'error' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertTitle>Connection Error</AlertTitle>
                <AlertDescription>
                  {errorMessage || 'Failed to connect to the Cloudflare Worker'}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Endpoint Selection */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="useCustomEndpoint" 
                  checked={useCustomEndpoint}
                  onChange={(e) => setUseCustomEndpoint(e.target.checked)}
                />
                <Label htmlFor="useCustomEndpoint">Use custom endpoint</Label>
              </div>
              
              {useCustomEndpoint ? (
                <div className="space-y-2">
                  <Label htmlFor="customEndpoint">Custom Endpoint</Label>
                  <Input 
                    id="customEndpoint"
                    placeholder="/your-custom-endpoint"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                  />
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <Label>Method</Label>
                      <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Worker Endpoint</Label>
                  <Select value={selectedEndpoint} onValueChange={setSelectedEndpoint}>
                    <SelectTrigger id="endpoint">
                      <SelectValue placeholder="Select endpoint" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKER_ENDPOINTS.map((endpoint) => (
                        <SelectItem key={endpoint.value} value={endpoint.value}>
                          {endpoint.label} ({endpoint.method})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Request Body */}
              {(selectedMethod === 'POST' || selectedMethod === 'PUT') && (
                <div className="space-y-2">
                  <Label htmlFor="requestBody">Request Body (JSON)</Label>
                  <Textarea 
                    id="requestBody"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="font-mono text-sm h-32"
                  />
                </div>
              )}
              
              {/* Send Button */}
              <div className="pt-2">
                <Button 
                  onClick={sendRequest} 
                  disabled={isLoading}
                  className="w-full bg-[#0098FF] hover:bg-[#0080DC]"
                >
                  {isLoading ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Response Display */}
      {responseData && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-[#0098FF]" />
              <CardTitle>Response</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-[#131A29] text-white p-4 rounded-md overflow-auto max-h-80 text-sm">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-gray-500">
              Worker response received at {new Date().toLocaleTimeString()}
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* Refresh Connection Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={checkConnection}
          disabled={isLoading}
          className="flex items-center space-x-1"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh Connection
        </Button>
      </div>
    </div>
  );
}