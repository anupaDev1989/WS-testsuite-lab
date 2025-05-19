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

  // Reset headers and body when selectedTest changes
  useEffect(() => {
    if (selectedTest) {
      let defaultHeadersContent = { "Content-Type": "application/json" };
      if (selectedTest.id === 'protected-with-token') {
        // For the auto-token test, we can indicate headers will be auto-fetched
        // Or pre-fill it once fetched, but for now, let's just set a generic one.
        // The actual token will be fetched on run.
        setHeaders(JSON.stringify(defaultHeadersContent, null, 2));
        // Optionally, provide a message in the UI or disable the textarea.
      } else {
        setHeaders(JSON.stringify(defaultHeadersContent, null, 2));
      }

      let defaultBodyContent = { message: "Hello from the test suite!" };
      if (selectedTest.method === 'GET') {
        setBody('');
      } else {
        setBody(JSON.stringify(defaultBodyContent, null, 2));
      }
    } else {
      setHeaders('{\n  "Content-Type": "application/json"\n}');
      setBody('{\n  "message": "Hello from the test suite!"\n}');
    }
  }, [selectedTest]);

  const handleRunTest = async () => {
    if (!selectedTest) return;

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
        finalHeaders = JSON.parse(headers || '{}');
        finalBody = selectedTest.method !== 'GET' && body ? JSON.parse(body) : undefined;
      }
      
      console.log('ConfigPane - Final Headers to be sent:', JSON.stringify(finalHeaders));

      onRunTest({
        endpoint: selectedTest.endpoint,
        method: selectedTest.method || 'GET',
        headers: finalHeaders,
        body: finalBody,
      });
    } catch (error) {
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
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleRunTest}
                  disabled={isLoading}
                >
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
