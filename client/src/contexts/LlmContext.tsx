import { createContext, useState, useCallback, ReactNode } from 'react';

interface LlmContextType {
  currentLlmResponse: any | null;
  setCurrentLlmResponse: (response: any) => void;
  clearCurrentLlmResponse: () => void;
}

export const LlmContext = createContext<LlmContextType>({
  currentLlmResponse: null,
  setCurrentLlmResponse: () => {},
  clearCurrentLlmResponse: () => {}
});

interface LlmProviderProps {
  children: ReactNode;
}

export function LlmProvider({ children }: LlmProviderProps) {
  const [currentLlmResponse, setCurrentLlmResponseState] = useState<any | null>(null);

  const setCurrentLlmResponse = useCallback((response: any) => {
    setCurrentLlmResponseState(response);
  }, []);

  const clearCurrentLlmResponse = useCallback(() => {
    setCurrentLlmResponseState(null);
  }, []);

  return (
    <LlmContext.Provider
      value={{
        currentLlmResponse,
        setCurrentLlmResponse,
        clearCurrentLlmResponse
      }}
    >
      {children}
    </LlmContext.Provider>
  );
}
