// src/components/ExampleComponent.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { apiClient, ApiError, RateLimitError } from '../lib/apiClient';
import { useUuidStore } from '../stores/uuidStore';

interface ApiResponse {
  message?: string;
  data?: any;
  // Add other expected fields from your API response
}

export function ExampleComponent() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { getClientId, initialize } = useUuidStore();

  // Initialize client ID on component mount if not already done by the store itself
  useEffect(() => {
    initialize(); 
  }, [initialize]);

  const fetchData = useCallback(async (endpoint: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    console.log(`Fetching data from ${endpoint} with client ID: ${getClientId()}`);
    try {
      const result = await apiClient.get<ApiResponse>(endpoint);
      setData(result);
      console.log('Data fetched successfully:', result);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err instanceof RateLimitError) {
        setError(`Rate limited. Please try again in ${err.retryAfter} seconds. (Status: ${err.status})`);
      } else if (err instanceof ApiError) {
        setError(`API Error: ${err.message} (Status: ${err.status})`);
      } else if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [getClientId]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Client ID & API Test</h1>
      <p><strong>Client ID:</strong> {getClientId()}</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => fetchData('/api/protected')} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px', fontSize: '16px' }}
        >
          {loading ? 'Loading...' : 'Fetch Protected Data (Worker)'}
        </button>
        <button 
          onClick={() => fetchData('/api/llm/gemini')} // Assuming this is a GET for testing, or adapt
          disabled={loading}
          style={{ padding: '10px', fontSize: '16px' }}
        >
          {loading ? 'Loading...' : 'Fetch LLM Data'}
        </button>
      </div>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {error}</p>}
      {data && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', background: '#f9f9f9' }}>
          <h2>API Response:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
