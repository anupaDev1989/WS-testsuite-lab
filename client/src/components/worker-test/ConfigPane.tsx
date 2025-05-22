import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Play } from 'lucide-react';
import { TestCase } from './TestSelectionPane';
import { getSupabaseJWT } from '@/lib/authUtils';
import { AxiosResponse } from 'axios'; // Import AxiosResponse

interface ServerRateLimitInfo {
  limit: number;
  remaining: number;
  resetTimestamp: number; // Unix timestamp in milliseconds for when the window resets
  retryAfterSeconds?: number; // Seconds from a 429 response
}

interface ConfigPaneProps {
  selectedTest: TestCase | null;
  onRunTest: (config: TestConfig) => Promise<AxiosResponse<any>>; // Expecting AxiosResponse
  isLoading?: boolean;
}

export interface TestConfig {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body: any; // Body can be any, will be stringified if object
}

const DEFAULT_HEADERS = '{\n  "Content-Type": "application/json"\n}';
const DEFAULT_BODY = '{\n  "message": "Hello from the test suite!"\n}';

export function ConfigPane({ selectedTest, onRunTest, isLoading }: ConfigPaneProps) {
  const [headers, setHeaders] = useState<string>(DEFAULT_HEADERS);
  const [body, setBody] = useState<string>(DEFAULT_BODY);
  const [rateLimitTier, setRateLimitTier] = useState<'free' | 'paid'>('free');
  
  // State for server-derived rate limit info, persisted in localStorage
  const [serverRateLimitInfo, setServerRateLimitInfo] = useState<ServerRateLimitInfo | null>(null);
  // Client-side understanding of whether it's blocked, derived from serverRateLimitInfo
  const [isClientBlocked, setIsClientBlocked] = useState(false);
  // UI countdown timer
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  const getLocalStorageKey = useCallback(() => {
    if (!selectedTest) return null;
    return `rateLimitInfo_${selectedTest.id}_${selectedTest.method}_${rateLimitTier}`;
  }, [selectedTest, rateLimitTier]);

  // Load from localStorage on mount and when test/tier changes
  useEffect(() => {
    const key = getLocalStorageKey();
    if (!key) {
      setServerRateLimitInfo(null);
      setIsClientBlocked(false);
      setRetryCountdown(null);
      return;
    }

    const storedInfo = localStorage.getItem(key);
    if (storedInfo) {
      try {
        const parsedInfo: ServerRateLimitInfo = JSON.parse(storedInfo);
        if (parsedInfo.resetTimestamp && Date.now() < parsedInfo.resetTimestamp) {
          setServerRateLimitInfo(parsedInfo);
          setIsClientBlocked(true);
          // Recalculate retryAfterSeconds if still blocked
          const remainingBlockTimeMs = parsedInfo.resetTimestamp - Date.now();
          if (remainingBlockTimeMs > 0) {
            parsedInfo.retryAfterSeconds = Math.ceil(remainingBlockTimeMs / 1000);
          } else {
            // Should not happen if Date.now() < parsedInfo.resetTimestamp, but as a safeguard
            localStorage.removeItem(key); // Clear stale entry
            setServerRateLimitInfo(null);
            setIsClientBlocked(false);
            return;
          }
        } else {
          // Stored info is outdated (reset time has passed)
          localStorage.removeItem(key);
          setServerRateLimitInfo(null);
          setIsClientBlocked(false);
        }
      } catch (e) {
        console.error("Error parsing rate limit info from localStorage", e);
        localStorage.removeItem(key); // Clear corrupted entry
        setServerRateLimitInfo(null);
        setIsClientBlocked(false);
      }
    } else {
      setServerRateLimitInfo(null);
      setIsClientBlocked(false);
    }
    setRetryCountdown(null); // Reset countdown display on test/tier change
  }, [selectedTest, rateLimitTier, getLocalStorageKey]);

  // Update localStorage when serverRateLimitInfo changes
  useEffect(() => {
    const key = getLocalStorageKey();
    if (!key) return;

    if (serverRateLimitInfo) {
      localStorage.setItem(key, JSON.stringify(serverRateLimitInfo));
    } else {
      // If null, it means the block is cleared or no info yet
      // We only remove explicitly if reset time passed (done in the loading useEffect)
      // Or if it's a successful request that clears a previous block
    }
  }, [serverRateLimitInfo, getLocalStorageKey]);
  
  // Manage isClientBlocked and retryCountdown based on serverRateLimitInfo
  useEffect(() => {
    if (serverRateLimitInfo && serverRateLimitInfo.resetTimestamp > Date.now()) {
      setIsClientBlocked(true);
      const remainingMs = serverRateLimitInfo.resetTimestamp - Date.now();
      const seconds = Math.ceil(remainingMs / 1000);
      setRetryCountdown(seconds);

      const interval = setInterval(() => {
        setRetryCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setIsClientBlocked(false); // Countdown finished, unblock client
            // Also clear serverRateLimitInfo from state and localStorage as it's now passed
            const key = getLocalStorageKey();
            if(key) localStorage.removeItem(key);
            setServerRateLimitInfo(null); 
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsClientBlocked(false);
      setRetryCountdown(null);
      // If serverRateLimitInfo exists but resetTimestamp is in the past, clear it.
      if (serverRateLimitInfo && serverRateLimitInfo.resetTimestamp <= Date.now()) {
        const key = getLocalStorageKey();
        if(key) localStorage.removeItem(key);
        setServerRateLimitInfo(null);
      }
    }
  }, [serverRateLimitInfo, getLocalStorageKey]);

  // Reset headers and body when selectedTest changes
  useEffect(() => {
    if (selectedTest) {
      let defaultHeadersContent = { "Content-Type": "application/json" };
      // Special handling for auth token can remain if needed, or simplify
      setHeaders(JSON.stringify(defaultHeadersContent, null, 2));

      if (selectedTest.method === 'GET' && selectedTest.id !== 'protected-with-token') {
        setBody(''); 
      } else {
        setBody(selectedTest.defaultBody || DEFAULT_BODY);
      }
    } else {
      setHeaders(DEFAULT_HEADERS);
      setBody(DEFAULT_BODY);
    }
  }, [selectedTest]);

  const handleRunTest = async () => {
    if (!selectedTest || isClientBlocked) return;

    let authHeader: Record<string, string> = {};
    const token = await getSupabaseJWT();
    if (token) {
      authHeader = { Authorization: `Bearer ${token}` };
    }

    let tierHeader: Record<string, string> = {};
    if (selectedTest.id === 'ip-rate-limit') {
      tierHeader = { 'x-rate-limit-tier': rateLimitTier };
    }

    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers || '{}');
      } catch (e) {
        alert('Invalid JSON in Headers input.');
        return;
      }
      
      let parsedBody: any;
      if (selectedTest.method !== 'GET' && body) {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          alert('Invalid JSON in Request Body input.');
          return;
        }
      } else if (selectedTest.method === 'GET') {
        parsedBody = undefined; // Ensure no body for GET unless specifically handled
      }

      const finalHeaders: Record<string, string> = {
        ...parsedHeaders,
        ...tierHeader,
        ...authHeader
      };
      
      console.log('ConfigPane - Final Headers to be sent:', JSON.stringify(finalHeaders));
      console.log('ConfigPane - Final Body to be sent:', selectedTest.method !== 'GET' && body ? body : '(No Body)');

      const response: AxiosResponse<any> = await onRunTest({
        endpoint: selectedTest.endpoint,
        method: selectedTest.method || 'GET',
        headers: finalHeaders,
        body: parsedBody,
      });

      // Process response headers for rate limit information
      const limit = response.headers['x-ratelimit-limit'];
      const remaining = response.headers['x-ratelimit-remaining'];
      const reset = response.headers['x-ratelimit-reset']; // Unix time in seconds

      let newRateLimitInfo: ServerRateLimitInfo | null = null;

      if (response.status === 429) {
        const retryAfterHeader = response.headers['retry-after']; // Seconds
        const responseData = response.data;
        const retryAfterFromData = responseData?.retryAfter; // Seconds, from our worker's JSON body
        
        const actualRetryAfterSeconds = parseInt(retryAfterHeader || '0', 10) || retryAfterFromData || 60; 
        const now = Date.now();
        newRateLimitInfo = {
          limit: parseInt(limit || serverRateLimitInfo?.limit?.toString() || '0', 10),
          remaining: 0, // On 429, remaining is 0
          resetTimestamp: now + actualRetryAfterSeconds * 1000,
          retryAfterSeconds: actualRetryAfterSeconds,
        };
        console.warn('Rate limit hit (429):', responseData, 'Effective Retry-After:', actualRetryAfterSeconds);
      } else if (limit !== undefined && remaining !== undefined && reset !== undefined) {
        newRateLimitInfo = {
          limit: parseInt(limit, 10),
          remaining: parseInt(remaining, 10),
          resetTimestamp: parseInt(reset, 10) * 1000, // Convert Unix seconds to JS milliseconds
        };
        // If it was a successful request that previously was blocked, clear local storage explicitly
        const key = getLocalStorageKey();
        if(key && localStorage.getItem(key) && newRateLimitInfo.remaining > 0) {
            localStorage.removeItem(key);
        }
      } else if (response.status >= 200 && response.status < 300 && serverRateLimitInfo) {
        // Successful request, but no rate limit headers returned (e.g. non-rate-limited endpoint)
        // If there was a previous block for this key, and this success means it's cleared, remove it.
        // This case is tricky; ideally all relevant endpoints return headers.
        // For now, if it's a success and we had old info, we might clear it if reset time passed.
        // The useEffect for serverRateLimitInfo already handles clearing if resetTimestamp passed.
      }

      setServerRateLimitInfo(newRateLimitInfo);

    } catch (error: any) {
      // This catch is for errors not handled by workerService returning error.response (e.g. network errors)
      console.error('Error during onRunTest or response processing:', error);
      alert(`An unexpected error occurred: ${error.message}`);
      // Potentially clear local storage if error suggests state is invalid, or rely on timeout
      // For now, no explicit clear here, rely on existing expiry logic or manual clear by user.
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
                {selectedTest && selectedTest.id === 'ip-rate-limit' && serverRateLimitInfo && (
                  <div className="w-full text-right text-sm text-muted-foreground">
                    <div>
                      Requests made: <b>{serverRateLimitInfo.limit - serverRateLimitInfo.remaining}</b> / {serverRateLimitInfo.limit}
                    </div>
                    <div>
                      Requests remaining: <b>{serverRateLimitInfo.remaining}</b>
                    </div>
                    {isClientBlocked && retryCountdown !== null && (
                      <div className="text-red-600">
                        Rate limit active. Try again in <b>{retryCountdown}s</b>.
                      </div>
                    )}
                  </div>
                )}
                <Button onClick={handleRunTest} disabled={!!(isLoading || !selectedTest || isClientBlocked)}>
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
