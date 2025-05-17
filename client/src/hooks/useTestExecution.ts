import { useState } from 'react';
import { Test, BackendType, TerminalLine, TestResult } from '@/types';
import { 
  mockGetUserResponse, 
  mockPostUserResponse, 
  mockPutUserResponse, 
  mockDeleteUserResponse 
} from '@/lib/mockData';

/**
 * Hook to manage test execution and terminal output
 */
export default function useTestExecution() {
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const addTerminalLine = (line: TerminalLine) => {
    setTerminalLines(prev => [...prev, line]);
  };

  const clearTerminal = () => {
    setTerminalLines([]);
  };

  const executeTest = async (test: Test, backend: BackendType): Promise<TestResult> => {
    setIsExecuting(true);

    // Add initial command line
    addTerminalLine({
      type: 'command',
      content: `Running HTTP ${test.method} test on ${backend} backend`,
      timestamp: new Date()
    });

    // Add test initialization info
    addTerminalLine({
      type: 'info',
      content: `Initiating ${test.method} request to ${test.url}`,
      timestamp: new Date()
    });

    // Build query string from parameters
    const queryParams = test.parameters.length > 0
      ? '?' + test.parameters.map(p => `${p.key}=${p.value}`).join('&')
      : '';
    
    const fullUrl = test.url + queryParams;

    // Add request details
    const requestLine = `${test.method} ${new URL(fullUrl).pathname}${queryParams} HTTP/1.1`;
    addTerminalLine({
      type: 'request',
      content: requestLine,
      timestamp: new Date()
    });

    // Add headers info
    addTerminalLine({
      type: 'request',
      content: `Host: ${new URL(fullUrl).host}
User-Agent: DevTestClient/1.0
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json`,
      timestamp: new Date()
    });

    // Simulate network delay
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    const duration = Date.now() - startTime;

    // Simulate response
    let responseStatus = 200;
    let responseBody: any;

    switch (test.method) {
      case 'GET':
        responseBody = mockGetUserResponse;
        break;
      case 'POST':
        responseBody = mockPostUserResponse;
        break;
      case 'PUT':
        responseBody = mockPutUserResponse;
        break;
      case 'DELETE':
        responseBody = mockDeleteUserResponse;
        break;
    }

    // Add response info
    addTerminalLine({
      type: 'info',
      content: `Response received (${responseStatus} OK) - ${duration}ms`,
      timestamp: new Date()
    });

    // Add response headers
    addTerminalLine({
      type: 'response',
      content: `HTTP/1.1 ${responseStatus} OK
Content-Type: application/json; charset=utf-8
Content-Length: ${JSON.stringify(responseBody).length}
Connection: keep-alive
Date: ${new Date().toUTCString()}
Server: ${backend}
Cache-Control: private, max-age=0, no-cache`,
      timestamp: new Date()
    });

    // Add response body
    addTerminalLine({
      type: 'response-body',
      content: JSON.stringify(responseBody, null, 2),
      timestamp: new Date()
    });

    // Add success/validation info
    const testOptions = test.testOptions.filter(option => option.enabled);
    const validationResults = testOptions.map(option => {
      return { option, passed: true };  // Simulate all tests passing
    });

    addTerminalLine({
      type: 'success',
      content: 'Test completed successfully. Response matches expected schema.',
      timestamp: new Date()
    });

    // Add test summary
    addTerminalLine({
      type: 'command',
      content: 'Test summary:',
      timestamp: new Date()
    });

    addTerminalLine({
      type: 'info',
      content: `Duration: ${duration}ms
Status: ✓ Passed
Server: ${backend}
Validation: Schema validation successful`,
      timestamp: new Date()
    });

    setIsExecuting(false);

    // Return test result
    return {
      status: 'success',
      duration,
      statusCode: responseStatus,
      response: responseBody,
      timestamp: new Date(),
      backend
    };
  };

  return {
    terminalLines,
    isExecuting,
    executeTest,
    clearTerminal
  };
}
