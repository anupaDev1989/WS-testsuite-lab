import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageInput from './components/MessageInput';
import MessageLog from './components/MessageLog';
import InfoSection from './components/InfoSection'; // Replaced LLMResponse with InfoSection
import RawLogDisplay from './components/RawLogDisplay'; // Added import
import { Message } from './types';
import { workerService } from '@/lib/workerService'; // Assuming workerService is in this path

const WorkflowTestPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  // Removed currentLlmResponse state
  const [rawApiCall, setRawApiCall] = useState<string>('');
  const [rawApiResponse, setRawApiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setRawApiCall(''); // Clear previous logs
    setRawApiResponse('');

    const userMessage: Message = {
      id: uuidv4(),
      content,
      sender: 'user',
      timestamp: new Date(), // Corrected to Date object
      status: 'success', // Changed 'sent' to 'success' or undefined if preferred
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      const requestBody = { prompt: content };
      const apiEndpoint = '/api/llm/gemini';

      // Prepare raw request log (actual headers might differ based on workerService implementation)
      let requestLog = `POST ${apiEndpoint}\n`;
      // Note: Actual headers sent by workerService might not be easily accessible here
      // unless workerService is modified to return them or interceptors are used.
      // For now, we'll just log the body.
      requestLog += `Request Body:\n${JSON.stringify(requestBody, null, 2)}`;
      setRawApiCall(requestLog);

      // Make the API call
      const response = await workerService.post(apiEndpoint, requestBody); // Removed generic type arguments

      // Prepare raw response log
      let responseLog = `Status: ${response.status || 'N/A'}\n`;
      responseLog += `Headers:\n${JSON.stringify(response.headers || {}, null, 2)}\n`;
      // Assuming response.data exists and might contain the actual LLM response
      const responseData = response.data as any; // Cast to any to safely access properties
      responseLog += `Response Body:\n${JSON.stringify(responseData, null, 2)}`;
      setRawApiResponse(responseLog);

      let llmResponseContent = 'No response text found.';
      if (responseData && typeof responseData.response === 'string') {
        llmResponseContent = responseData.response;
      }

      const llmMessage: Message = {
        id: uuidv4(), // Assign a new ID for the LLM's message
        content: llmResponseContent,
        sender: 'llm',
        timestamp: new Date(), // Corrected to Date object
        status: 'success',
      };
      setMessages((prevMessages) => [...prevMessages, llmMessage]);

    } catch (error: any) {
      console.error('Error sending message to LLM:', error);
      const errorData = error.response?.data as any; // Cast to any for safe access
      const errorMessageContent = errorData?.error || error.message || 'An unknown error occurred';
      const systemMessage: Message = {
        id: uuidv4(),
        content: `Error: ${errorMessageContent}`,
        sender: 'system',
        timestamp: new Date(), // Corrected to Date object
        status: 'error',
      };
      setMessages((prevMessages) => [...prevMessages, systemMessage]);

      let errorResponseLog = `Error: ${errorMessageContent}\n`;
      if (error.response) { // Axios error structure
        errorResponseLog += `Status: ${error.response.status}\n`;
        errorResponseLog += `Headers:\n${JSON.stringify(error.response.headers, null, 2)}\n`;
        errorResponseLog += `Response Body:\n${JSON.stringify(error.response.data, null, 2)}\n`;
      } else {
        errorResponseLog += `Stack: ${error.stack || 'No stack available'}`;
      }
      setRawApiResponse(errorResponseLog);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gray-900 text-white">
      <h1 className="text-2xl font-semibold mb-4 text-center">Workflow Test</h1>
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Middle Pane: Message Log and Raw Log Display */}
        <div className="flex-1 flex flex-col p-2 bg-gray-800 rounded-lg shadow-inner min-w-[400px] max-w-3xl mx-auto space-y-2">
          <div className="flex-1 flex flex-col min-h-[50%]">
            <MessageLog messages={messages} />
          </div>
          <div className="flex-1 flex flex-col min-h-[30%] max-h-[45%]">
            <RawLogDisplay requestLog={rawApiCall} responseLog={rawApiResponse} />
          </div>
        </div>

        {/* Right Pane: Input and INFO Section */}
        <div className="w-1/2 flex flex-col bg-gray-800 p-3 rounded-lg shadow-lg space-y-3">
          <h2 className="text-xl font-medium mb-0 border-b border-gray-700 pb-2">Controls & Info</h2>
          <div className="flex-1 flex flex-col min-h-0">
            <InfoSection /> {/* Replaced LLMResponse with InfoSection */}
          </div>
          <MessageInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default WorkflowTestPage;
