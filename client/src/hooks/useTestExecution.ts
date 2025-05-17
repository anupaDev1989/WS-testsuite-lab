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
  const [workerStatus, setWorkerStatus] = useState<'connected' | 'disconnected' | 'error'>('connected');

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
      content: `Running HTTP ${test.method} test via Cloudflare Worker`,
      timestamp: new Date()
    });

    // Add test initialization info
    addTerminalLine({
      type: 'info',
      content: `Initiating ${test.method} request to ${test.url} via worker endpoint`,
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
CF-Worker-Key: ws_12345678
Content-Type: application/json`,
      timestamp: new Date()
    });

    // Start timing
    const startTime = Date.now();
    
    try {
      // Simulate actual worker request/response
      // In a real implementation, we would make an actual fetch call to the worker
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

      // Simulate response
      let responseStatus = 200;
      let responseBody: any;

      const simulateWorkerProcessing = () => {
        switch (test.method) {
          case 'GET':
            responseBody = {
              ...mockGetUserResponse,
              processingData: {
                worker_id: `wrangler-${Math.floor(Math.random() * 1000)}`,
                processed_at: new Date().toISOString(),
                cf_ray: `${Math.random().toString(36).substring(2, 10)}`,
                worker_env: 'development'
              }
            };
            break;
          case 'POST':
            responseBody = {
              ...mockPostUserResponse,
              processingData: {
                worker_id: `wrangler-${Math.floor(Math.random() * 1000)}`,
                processed_at: new Date().toISOString(),
                cf_ray: `${Math.random().toString(36).substring(2, 10)}`,
                worker_env: 'development'
              }
            };
            break;
          case 'PUT':
            responseBody = {
              ...mockPutUserResponse,
              processingData: {
                worker_id: `wrangler-${Math.floor(Math.random() * 1000)}`,
                processed_at: new Date().toISOString(),
                cf_ray: `${Math.random().toString(36).substring(2, 10)}`,
                worker_env: 'development'
              }
            };
            break;
          case 'DELETE':
            responseBody = {
              ...mockDeleteUserResponse,
              processingData: {
                worker_id: `wrangler-${Math.floor(Math.random() * 1000)}`,
                processed_at: new Date().toISOString(),
                cf_ray: `${Math.random().toString(36).substring(2, 10)}`,
                worker_env: 'development'
              }
            };
            break;
        }
        return { status: responseStatus, body: responseBody };
      };

      const workerResponse = simulateWorkerProcessing();
      const duration = Date.now() - startTime;

      // Add response info
      addTerminalLine({
        type: 'info',
        content: `Worker response received (${workerResponse.status} OK) - ${duration}ms`,
        timestamp: new Date()
      });

      // Add response headers
      addTerminalLine({
        type: 'response',
        content: `HTTP/1.1 ${workerResponse.status} OK
Content-Type: application/json; charset=utf-8
Content-Length: ${JSON.stringify(workerResponse.body).length}
Connection: keep-alive
Date: ${new Date().toUTCString()}
CF-Worker: workers.dev
CF-Ray: ${workerResponse.body.processingData.cf_ray}
Cache-Control: private, max-age=0, no-cache`,
        timestamp: new Date()
      });

      // Add response body
      addTerminalLine({
        type: 'response-body',
        content: JSON.stringify(workerResponse.body, null, 2),
        timestamp: new Date()
      });

      // Add worker execution details
      addTerminalLine({
        type: 'info',
        content: `Worker Execution Details:
Worker ID: ${workerResponse.body.processingData.worker_id}
Execution Time: ${duration}ms
Environment: ${workerResponse.body.processingData.worker_env}
CF-Ray: ${workerResponse.body.processingData.cf_ray}`,
        timestamp: new Date()
      });

      // Add test validation info
      const testOptions = test.testOptions.filter(option => option.enabled);
      
      if (testOptions.length > 0) {
        addTerminalLine({
          type: 'command',
          content: 'Running test validations:',
          timestamp: new Date()
        });

        testOptions.forEach(option => {
          addTerminalLine({
            type: 'success',
            content: `✅ ${option.name} passed`,
            timestamp: new Date()
          });
        });
      }

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
Worker: Cloudflare Workers
CF-Ray: ${workerResponse.body.processingData.cf_ray}
Worker CPU Time: ${Math.floor(duration * 0.75)}ms
Worker Memory Usage: ${Math.floor(Math.random() * 20) + 10}MB`,
        timestamp: new Date()
      });

      setIsExecuting(false);

      // Return test result
      return {
        status: 'success',
        duration,
        statusCode: workerResponse.status,
        response: workerResponse.body,
        timestamp: new Date(),
        backend
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error
      addTerminalLine({
        type: 'error',
        content: `Worker execution failed: ${error.message || 'Unknown error'}`,
        timestamp: new Date()
      });

      setIsExecuting(false);
      
      return {
        status: 'error',
        duration,
        error: error.message || 'Worker execution failed',
        timestamp: new Date(),
        backend
      };
    }
  };

  return {
    terminalLines,
    isExecuting,
    executeTest,
    clearTerminal,
    workerStatus
  };
}
