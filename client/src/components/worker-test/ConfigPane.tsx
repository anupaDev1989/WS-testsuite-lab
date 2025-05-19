import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Play } from 'lucide-react';
import { TestCase } from './TestSelectionPane';

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

  const handleRunTest = () => {
    try {
      const parsedHeaders = JSON.parse(headers);
      const parsedBody = selectedTest?.method !== 'GET' ? JSON.parse(body) : undefined;

      onRunTest({
        endpoint: selectedTest?.endpoint || '',
        method: selectedTest?.method || 'GET',
        headers: parsedHeaders,
        body: parsedBody,
      });
    } catch (error) {
      console.error('Invalid JSON in headers or body');
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
                  />
                </div>
                {selectedTest.method !== 'GET' && (
                  <div className="space-y-2">
                    <Label>Request Body</Label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="font-mono"
                      rows={6}
                    />
                  </div>
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
