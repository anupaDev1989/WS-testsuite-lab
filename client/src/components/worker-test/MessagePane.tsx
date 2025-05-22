import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface Message {
  type: 'request' | 'response';
  timestamp: string;
  content: any;
}

interface MessagePaneProps {
  messages: Message[];
}

export function MessagePane({ messages }: MessagePaneProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Messages
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {[...messages].reverse().map((message, index) => (
            <Card key={index}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {message.type === 'request' ? (
                    <>
                      <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                      Request
                    </>
                  ) : (
                    <>
                      <ArrowDownCircle className="h-4 w-4 text-green-500" />
                      Response
                    </>
                  )}
                  <span className="text-muted-foreground ml-auto">{message.timestamp}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-3">
                <pre className="text-sm bg-muted p-2 rounded-md whitespace-pre-wrap break-all">
                  {JSON.stringify(message.content, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
