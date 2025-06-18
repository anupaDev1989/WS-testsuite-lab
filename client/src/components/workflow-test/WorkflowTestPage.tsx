import React, { useState } from 'react';
import MessageInput from './components/MessageInput';
import MessageLog from './components/MessageLog';
import InfoSection from './components/InfoSection';
import RawLogDisplay from './components/RawLogDisplay';
import { workerService } from '@/lib/workerService';
import { getSupabaseJWT } from '../../lib/authUtils';
import useProfileStore from '@/stores/profileStore';
import useChatStore from '@/stores/chatStore';

const WorkflowTestPage: React.FC = () => {
  // Replace local messages state with chatStore
  const { 
    messages, 
    isLoading, 
    addMessage, 
    addSystemMessage, 
    setLoading 
  } = useChatStore();
  
  const [rawApiCall, setRawApiCall] = useState<string>('');
  const [rawApiResponse, setRawApiResponse] = useState<string>('');
  const { saveTrip } = useProfileStore();

  const handleSaveTrip = async (tripContent: any) => {
    if (!tripContent) {
      console.error("Cannot save trip: No content provided");
      return;
    }

    const title = `Trip saved at ${new Date().toLocaleString()}`;
    
    try {
      await saveTrip({ 
        title, 
        content: tripContent,
        city: 'Unknown' // Default city, can be updated if available
      });
      alert('Trip saved successfully!');
    } catch (error) {
      console.error('Failed to save trip:', error);
      alert('Failed to save trip. Please try again.');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setRawApiCall(''); // Clear previous logs
    setRawApiResponse('');

    // Add user message using chatStore
    addMessage({
      content,
      sender: 'user',
      status: 'success',
    });
    
    setLoading(true);

    try {
      const requestBody = { prompt: content };
      const apiEndpoint = '/api/llm/gemini';

      console.log('[WorkflowTestPage] Attempting to get JWT via getSupabaseJWT()...');
      const accessToken = await getSupabaseJWT();
      console.log('[WorkflowTestPage] Retrieved accessToken:', accessToken ? `Token found (first 10: ${accessToken.substring(0,10)}...)` : 'No token');
      
      const headers: Record<string, string> = {}; // Initialize headers
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      } else {
        console.warn('[WorkflowTestPage] No valid JWT token found via getSupabaseJWT(). User may not be authenticated.');
      }

      // Prepare raw request log, now including headers
      console.log('[WorkflowTestPage] final headers object before request:', headers);
      let requestLog = `POST ${apiEndpoint}\n`;
      requestLog += `Headers: ${JSON.stringify(headers, null, 2)}\n`; 
      requestLog += `Request Body: ${JSON.stringify(requestBody, null, 2)}`;
      setRawApiCall(requestLog);

      // Make the API call with the JWT token in the headers
      const response = await workerService.post(apiEndpoint, requestBody, headers);

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

      // Add LLM message using chatStore
      addMessage({
        content: llmResponseContent,
        sender: 'llm',
        status: 'success',
      });

    } catch (error: any) {
      console.error('Error sending message to LLM:', error);
      const errorData = error.response?.data as any; // Cast to any for safe access
      const errorMessageContent = errorData?.error || error.message || 'An unknown error occurred';
      // Add system error message using chatStore
      addSystemMessage(
        `Error: ${errorMessageContent}`,
        'error'
      );

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
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gray-900 text-white">
      <h1 className="text-2xl font-semibold mb-4 text-center">Workflow Test</h1>
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Middle Pane: Message Log and Raw Log Display */}
        <div className="flex-1 flex flex-col p-2 bg-gray-800 rounded-lg shadow-inner min-w-[400px] max-w-3xl mx-auto space-y-2">
          <div className="flex-1 flex flex-col min-h-[50%]">
            <MessageLog 
              messages={messages} 
              onSaveTrip={handleSaveTrip}
            />
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
