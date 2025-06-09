import { useContext } from 'react';
import { LlmContext } from '@/contexts/LlmContext';

export function useLlmContext() {
  const context = useContext(LlmContext);
  
  if (!context) {
    throw new Error('useLlmContext must be used within an LlmProvider');
  }
  
  return context;
}
