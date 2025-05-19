import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CloudCog } from 'lucide-react';

export interface TestCase {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  description: string;
}

interface TestSelectionPaneProps {
  tests: TestCase[];
  selectedTest: TestCase | null;
  onSelectTest: (test: TestCase) => void;
}

export function TestSelectionPane({ tests, selectedTest, onSelectTest }: TestSelectionPaneProps) {
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
