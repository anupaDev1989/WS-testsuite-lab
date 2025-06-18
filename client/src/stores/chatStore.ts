// client/src/stores/chatStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Message } from '../components/workflow-test/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  addSystemMessage: (content: string, status?: 'sending' | 'success' | 'error') => void;
  setLoading: (isLoading: boolean) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
}

const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      error: null,
      
      addMessage: (messageData) => set((state) => ({
        messages: [
          ...state.messages,
          {
            id: uuidv4(),
            timestamp: new Date(),
            ...messageData
          }
        ]
      })),
      
      addSystemMessage: (content, status: 'sending' | 'success' | 'error' = 'error') => set((state) => ({
        messages: [
          ...state.messages,
          {
            id: uuidv4(),
            content,
            sender: 'system',
            timestamp: new Date(),
            status: status
          }
        ]
      })),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      clearMessages: () => set({ messages: [] }),
      
      setError: (error) => set({ error })
    }),
    {
      name: 'chat-session-storage',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage to clear on tab close
      partialize: (state) => ({ messages: state.messages }), // Only persist messages
    }
  )
);

export default useChatStore;
