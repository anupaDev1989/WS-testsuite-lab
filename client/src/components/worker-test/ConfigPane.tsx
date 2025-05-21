import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Play } from 'lucide-react';
import { TestCase } from './TestSelectionPane';
import { getSupabaseJWT } from '@/lib/authUtils';

interface ConfigPaneProps {
  selectedTest: TestCase | null;
  onRunTest: (config: TestConfig) => void;
  isLoading?: boolean;
}

export interface TestConfig {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

export function ConfigPane({ selectedTest, onRunTest, isLoading }: ConfigPaneProps) {
  const [headers, setHeaders] = useState<string>('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState<string>('{\n  "message": "Hello from the test suite!"\n}');
  const [rateLimitTier, setRateLimitTier] = useState<'free' | 'paid'>('free');
  const [rateLimitInfo, setRateLimitInfo] = useState<{remaining?: number, limit?: number, retryAfter?: number}|null>(null);
  const [requestsMade, setRequestsMade] = useState(0);
  const [limitForTier, setLimitForTier] = useState(10); // default for free
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  // Update limitForTier when tier changes
  useEffect(() => {
    if (selectedTest && selectedTest.id === 'ip-rate-limit') {
      setLimitForTier(rateLimitTier === 'free' ? 4 : 10);
    }
  }, [rateLimitTier, selectedTest]);

  // Automatically clear rateLimitInfo and reset requestsMade after retryAfter
  useEffect(() => {
    if (rateLimitInfo && rateLimitInfo.retryAfter) {
      const timer = setTimeout(() => {
        setRateLimitInfo(null);
        setRequestsMade(0);
      }, rateLimitInfo.retryAfter * 1000);
      return () => clearTimeout(timer);
    }
  }, [rateLimitInfo]);

  // Reset counters when test or tier changes
  useEffect(() => {
    setRequestsMade(0);
    setRateLimitInfo(null);
    setRetryCountdown(null);
  }, [rateLimitTier, selectedTest]);

  // Handle retryAfter countdown
  useEffect(() => {
    if (rateLimitInfo && rateLimitInfo.retryAfter) {
      setRetryCountdown(rateLimitInfo.retryAfter);
      const interval = setInterval(() => {
        setRetryCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [rateLimitInfo]);

  // Reset headers and body when selectedTest changes
  useEffect(() => {
    if (selectedTest) {
      let defaultHeadersContent = { "Content-Type": "application/json" };
      if (selectedTest.id === 'protected-with-token') {
        setHeaders(JSON.stringify(defaultHeadersContent, null, 2));
      } else {
        setHeaders(JSON.stringify(defaultHeadersContent, null, 2));
      }

      // Logic for body state update
      if (selectedTest.method === 'GET') {
        setBody(''); // GET requests typically don't have a body input here
      } else {
        // Prioritize the defaultBody from the TestCase definition
        if (selectedTest.defaultBody) {
          setBody(selectedTest.defaultBody); // defaultBody is already a string
        } else {
          // Fallback if no specific defaultBody is provided for a non-GET request
          setBody(JSON.stringify({ message: "Default body content" }, null, 2)); 
        }
      }
    } else {
      // Clear if no test is selected
      setHeaders('{\n  "Content-Type": "application/json"\n}');
      setBody('{\n  "message": "Hello from the test suite!"\n}');
    }
  }, [selectedTest]);

  const handleRunTest = async () => {
    if (!selectedTest) return;

    // If rate limit test, add tier header
    let tierHeader: Record<string, string> = {};
    if (selectedTest.id === 'ip-rate-limit') {
      tierHeader = { 'x-rate-limit-tier': rateLimitTier };
    }

    try {
      let finalHeaders: Record<string, string>;
      let finalBody: any;

      if (selectedTest.id === 'protected-with-token') {
        const token = await getSupabaseJWT();
        if (!token) {
          alert('Failed to retrieve Supabase JWT. Make sure you are logged in.');
          console.error('ConfigPane: JWT token could not be retrieved for protected-with-token test.');
          return; // Abort test
        }
        finalHeaders = {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        };
        // For GET with auto-token, body is typically not from the textarea for this specific test logic
        finalBody = selectedTest.method !== 'GET' && body ? JSON.parse(body) : undefined; 
      } else {
        // For other tests, parse headers and body from textareas
        finalHeaders = { ...JSON.parse(headers || '{}'), ...tierHeader };
        finalBody = selectedTest.method !== 'GET' && body ? JSON.parse(body) : undefined;
      }
      
      console.log('ConfigPane - Final Headers to be sent:', JSON.stringify(finalHeaders));

      // Wrap onRunTest to capture rate limit info from response
      const customOnRunTest = async (config: TestConfig) => {
        const response = await onRunTest(config);
        // Try to extract rate limit info from response (assume response contains these fields if present)
        if (response && typeof response === 'object') {
          if (response.retryAfter !== undefined) {
            // 429 Too Many Requests
            setRateLimitInfo({ retryAfter: response.retryAfter, limit: limitForTier });
          } else {
            // Success
            setRateLimitInfo(null);
            setRequestsMade((prev) => prev + 1);
          }
        } else {
          setRateLimitInfo(null);
        }
        return response;
      };
      await customOnRunTest({
        endpoint: selectedTest.endpoint,
        method: selectedTest.method || 'GET',
        headers: finalHeaders,
        body: finalBody,
      });
    } catch (error: any) {
      // If error is an Axios 429, handle gracefully
      if (error && error.response && error.response.status === 429) {
        // Extract retryAfter from response if available
        let retryAfter = 60;
        if (error.response.data && typeof error.response.data.retryAfter === 'number') {
          retryAfter = error.response.data.retryAfter;
        }
        setRateLimitInfo({ retryAfter, limit: limitForTier });
        // Suppress console error log for expected 429
        return;
      }
      // Only log and alert for unexpected errors
      console.error('Invalid JSON in headers or body (for manual input tests):', error);
      alert('Error: Invalid JSON in Headers or Body input. Please check the syntax.');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Test Configuration
        </h2>
        {/* Rate limit tier selector */}
        {selectedTest && selectedTest.id === 'ip-rate-limit' && (
          <div className="mt-2">
            <label className="font-medium mr-2">Rate Limit Tier:</label>
            <select
              value={rateLimitTier}
              onChange={e => setRateLimitTier(e.target.value as 'free' | 'paid')}
              className="border rounded px-2 py-1"
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex-1 p-4 space-y-4">
        {selectedTest ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedTest.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Endpoint</Label>
                  <Input value={selectedTest.endpoint} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Input value={selectedTest.method} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Headers</Label>
                  <Textarea
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    className="font-mono" 
                    rows={4}
                    disabled={selectedTest?.id === 'protected-with-token'} // Disable for auto-token test
                  />
                  {selectedTest?.id === 'protected-with-token' && (
                    <p className="text-xs text-muted-foreground">
                      Authorization header will be automatically added using your Supabase session.
                    </p>
                  )}
                </div>
                {(selectedTest.method !== 'GET' || selectedTest.id === 'protected-with-token') && (
                  // Show body for non-GET, or always for protected-with-token if we decide it can send a body
                  // For now, keep it simple: only show if not GET, unless we change this rule.
                  // If 'protected-with-token' (which is GET) needs a body from textarea, adjust condition.
                  selectedTest.method !== 'GET' && (
                    <div className="space-y-2">
                      <Label>Request Body</Label>
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="font-mono"
                        rows={6}
                      />
                    </div>
                  )
                )}
              </CardContent>
              <CardFooter className="p-4 flex flex-col items-end gap-2">
                {/* Enhanced Rate Limit Test Stats */}
                {selectedTest && selectedTest.id === 'ip-rate-limit' && (
                  <div className="w-full text-right text-sm text-muted-foreground">
                    <div>
                      Requests made: <b>{requestsMade}</b> / {limitForTier}
                    </div>
                    <div>
                      Requests remaining: <b>{Math.max(0, limitForTier - requestsMade)}</b>
                    </div>
                    {rateLimitInfo && rateLimitInfo.retryAfter !== undefined && (
                      <div className="text-red-600">
                        Rate limit reached. Try again in <b>{retryCountdown ?? rateLimitInfo.retryAfter}s</b>.
                      </div>
                    )}
                  </div>
                )}
                <Button onClick={handleRunTest} disabled={isLoading || !selectedTest || (rateLimitInfo && rateLimitInfo.retryAfter !== undefined)}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </Button>
              </CardFooter>
            </Card>
          </>
        ) : (
          <div className="text-center text-muted-foreground">
            Select a test from the left panel to configure and run it.
          </div>
        )}
      </div>
    </div>
  );
}
