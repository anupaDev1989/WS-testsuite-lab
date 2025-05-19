import { useState } from 'react';
import { TestSelectionPane, TestCase } from './TestSelectionPane';
import { MessagePane } from './MessagePane';
import { ConfigPane, TestConfig } from './ConfigPane';
import { workerService } from '@/lib/workerService';

const DEFAULT_TESTS: TestCase[] = [
  {
    id: 'health',
    name: 'Health Check',
    endpoint: '/health',
    method: 'GET',
    description: 'Check if the worker is running and responsive',
  },
  {
    id: 'users',
    name: 'Get Users',
    endpoint: '/api/users',
    method: 'GET',
    description: 'Retrieve list of users',
  },
  {
    id: 'test',
    name: 'Test Endpoint',
    endpoint: '/api/test',
    method: 'POST',
    description: 'General purpose test endpoint',
  },
];

export function WorkerTestDashboard() {
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRunTest = async (config: TestConfig) => {
    setIsLoading(true);
    const timestamp = new Date().toISOString();

    // Add request message
    const requestMessage = {
      type: 'request' as const,
      timestamp,
      content: {
        method: config.method,
        endpoint: config.endpoint,
        headers: config.headers,
        body: config.body,
      },
    };
    setMessages((prev) => [...prev, requestMessage]);

    try {
      // Make the request
      let response;
      switch (config.method) {
        case 'GET':
          response = await workerService.get(config.endpoint);
          break;
        case 'POST':
          response = await workerService.post(config.endpoint, config.body);
          break;
        case 'PUT':
          response = await workerService.put(config.endpoint, config.body);
          break;
        case 'DELETE':
          response = await workerService.delete(config.endpoint);
          break;
        default:
          throw new Error(`Unsupported method: ${config.method}`);
      }

      // Add response message
      const responseMessage = {
        type: 'response' as const,
        timestamp: new Date().toISOString(),
        content: response,
      };
      setMessages((prev) => [...prev, responseMessage]);
    } catch (error: any) {
      // Add error message
      const errorMessage = {
        type: 'response' as const,
        timestamp: new Date().toISOString(),
        content: {
          error: error.message || 'An error occurred',
        },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] grid grid-cols-[300px_1fr_300px] gap-0 divide-x">
      <TestSelectionPane
        tests={DEFAULT_TESTS}
        selectedTest={selectedTest}
        onSelectTest={setSelectedTest}
      />
      <MessagePane messages={messages} />
      <ConfigPane
        selectedTest={selectedTest}
        onRunTest={handleRunTest}
        isLoading={isLoading}
      />
    </div>
  );
}
