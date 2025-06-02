export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'llm' | 'system';
  timestamp: Date;
  status?: 'sending' | 'success' | 'error'; // Optional for now
  metadata?: Record<string, any>;
}
