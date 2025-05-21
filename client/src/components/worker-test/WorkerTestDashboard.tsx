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
    expectedResponse: '200 OK with { "status": "ok", ... }',
    defaultBody: null,
  },
  {
    id: 'users',
    name: 'Get Users',
    endpoint: '/api/users',
    method: 'GET',
    description: 'Retrieve list of users',
    expectedResponse: '200 OK with user list',
    defaultBody: null,
  },
  {
    id: 'test',
    name: 'Test Endpoint',
    endpoint: '/api/test',
    method: 'POST',
    description: 'General purpose test endpoint',
    expectedResponse: '200 OK with test data',
    defaultBody: JSON.stringify({ message: "Hello from dashboard" }, null, 2),
  },
  {
    id: 'protected-no-token',
    name: 'Protected Route (No Token)',
    endpoint: '/api/protected-data',
    method: 'GET',
    description: 'Test protected route without an auth token (expects 401)',
    expectedResponse: '401 Unauthorized',
    defaultBody: null,
  },
  {
    id: 'protected-with-token',
    name: 'Protected Route (With Token)',
    endpoint: '/api/protected-data',
    method: 'GET',
    description: 'Test protected route with an auth token (expects 200). Authorization header is auto-fetched if logged in.',
    expectedResponse: '200 OK with protected data',
    defaultBody: null,
  },
  {
    id: 'llm-gemini-chat',
    name: 'LLM Call (Gemini Flash)',
    endpoint: '/api/llm/gemini',
    method: 'POST',
    description: 'Sends a prompt to the Gemini LLM and expects a text response.',
    expectedResponse: '200 OK with LLM response object',
    defaultBody: JSON.stringify({ prompt: "What is the capital of France?" }, null, 2),
  },
  {
    id: 'ip-rate-limit',
    name: 'Rate Limit Test (Free/Paid)',
    endpoint: '/api/test',
    method: 'POST',
    description: 'Send multiple requests quickly to test the free or paid user rate limiting. Select a tier and observe remaining requests and reset time.',
    expectedResponse: '200 OK (until you hit the limit), then 429 Too Many Requests',
    defaultBody: JSON.stringify({ message: "Trigger rate limit" }, null, 2),
    rateLimitTier: 'free', // default tier
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
          response = await workerService.get(config.endpoint, config.body, config.headers);
          break;
        case 'POST':
          response = await workerService.post(config.endpoint, config.body, config.headers);
          break;
        case 'PUT':
          response = await workerService.put(config.endpoint, config.body, config.headers);
          break;
        case 'DELETE':
          response = await workerService.delete(config.endpoint, undefined, config.headers);
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
