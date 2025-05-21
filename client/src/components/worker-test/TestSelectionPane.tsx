import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CloudCog } from 'lucide-react';

export interface TestCase {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  description: string;
  expectedResponse: string;
  defaultBody: string | null;
  rateLimitTier?: 'free' | 'paid'; // For rate limit test cases only
}

interface TestSelectionPaneProps {
  tests: TestCase[];
  selectedTest: TestCase | null;
  onSelectTest: (test: TestCase) => void;
}

const testCases: TestCase[] = [
  {
    id: 'llm-gemini-chat',
    name: 'LLM Call (Gemini Flash)',
    endpoint: '/api/llm/gemini',
    method: 'POST',
    description: 'Sends a prompt to the Gemini LLM and expects a text response.',
    expectedResponse: '200 OK with LLM response object',
    defaultBody: JSON.stringify({ prompt: "What is the capital of France?" }, null, 2),
  },
  // Add more test cases here
];

export function TestSelectionPane({ tests = testCases, selectedTest, onSelectTest }: TestSelectionPaneProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CloudCog className="h-5 w-5" />
          Test Selection
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {tests.map((test) => (
            <Button
              key={test.id}
              variant={selectedTest?.id === test.id ? "secondary" : "ghost"}
              className="w-full justify-start text-left"
              onClick={() => onSelectTest(test)}
            >
              <div>
                <div className="font-medium">{test.name}</div>
                <div className="text-sm text-muted-foreground">{test.method} {test.endpoint}</div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
