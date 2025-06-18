export type BackendType = 'Cloudflare Worker';

export interface UserProfile {
  email: string;
  city: string | null;
}

export interface Trip {
  id: string;
  title: string;
  city: string | null;
  created_at: string;
  // This will hold the full JSON response for the trip
  response: Record<string, any>; 
}

// A summarized version for list views
export interface TripSummary {
    id: string;
    title: string;
    city: string | null;
    created_at: string;
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type Environment = 'Development' | 'Testing' | 'Production';

export interface TestCategory {
  id: string;
  name: string;
  icon: string;
  tests: Test[];
}

export interface Test {
  id: string;
  name: string;
  method: RequestMethod;
  url: string;
  parameters: Parameter[];
  headers: Header[];
  testOptions: TestOption[];
}

export interface Parameter {
  key: string;
  value: string;
}

export interface Header {
  key: string;
  value: string;
}

export interface TestOption {
  id: string;
  name: string;
  enabled: boolean;
}

export interface TerminalLine {
  type: 'info' | 'command' | 'request' | 'response' | 'success' | 'error' | 'warning' | 'response-body';
  content: string;
  timestamp?: Date;
}

export interface TestResult {
  status: 'success' | 'error' | 'pending';
  duration?: number;
  statusCode?: number;
  response?: any;
  error?: string;
  timestamp: Date;
  backend: BackendType;
}
