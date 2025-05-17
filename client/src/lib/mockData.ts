import { TestCategory, RequestMethod } from '@/types';

export const testCategories: TestCategory[] = [
  {
    id: 'http',
    name: 'HTTP Tests',
    icon: 'http',
    tests: [
      {
        id: 'get_req',
        name: 'GET Request',
        method: 'GET' as RequestMethod,
        url: 'https://api.example.com/users',
        parameters: [
          { key: 'limit', value: '10' },
          { key: 'active', value: 'true' }
        ],
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Accept', value: 'application/json' }
        ],
        testOptions: [
          { id: 'validate_status', name: 'Validate Response Status', enabled: true },
          { id: 'validate_schema', name: 'Validate Response Schema', enabled: true },
          { id: 'measure_perf', name: 'Measure Performance', enabled: false }
        ]
      },
      {
        id: 'post_req',
        name: 'POST Request',
        method: 'POST' as RequestMethod,
        url: 'https://api.example.com/users',
        parameters: [],
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Accept', value: 'application/json' }
        ],
        testOptions: [
          { id: 'validate_status', name: 'Validate Response Status', enabled: true },
          { id: 'validate_schema', name: 'Validate Response Schema', enabled: true },
          { id: 'measure_perf', name: 'Measure Performance', enabled: false }
        ]
      },
      {
        id: 'put_req',
        name: 'PUT Request',
        method: 'PUT' as RequestMethod,
        url: 'https://api.example.com/users/1',
        parameters: [],
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Accept', value: 'application/json' }
        ],
        testOptions: [
          { id: 'validate_status', name: 'Validate Response Status', enabled: true },
          { id: 'validate_schema', name: 'Validate Response Schema', enabled: true },
          { id: 'measure_perf', name: 'Measure Performance', enabled: false }
        ]
      },
      {
        id: 'delete_req',
        name: 'DELETE Request',
        method: 'DELETE' as RequestMethod,
        url: 'https://api.example.com/users/1',
        parameters: [],
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Accept', value: 'application/json' }
        ],
        testOptions: [
          { id: 'validate_status', name: 'Validate Response Status', enabled: true },
          { id: 'validate_schema', name: 'Validate Response Schema', enabled: false },
          { id: 'measure_perf', name: 'Measure Performance', enabled: false }
        ]
      }
    ]
  },
  {
    id: 'db',
    name: 'Database Tests',
    icon: 'storage',
    tests: [
      {
        id: 'query_test',
        name: 'Query Test',
        method: 'GET' as RequestMethod,
        url: 'https://api.example.com/db/query',
        parameters: [
          { key: 'table', value: 'users' }
        ],
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Accept', value: 'application/json' }
        ],
        testOptions: [
          { id: 'validate_status', name: 'Validate Response Status', enabled: true },
          { id: 'validate_schema', name: 'Validate Response Schema', enabled: true },
          { id: 'measure_perf', name: 'Measure Performance', enabled: true }
        ]
      }
    ]
  },
  {
    id: 'auth',
    name: 'Authentication Tests',
    icon: 'security',
    tests: [
      {
        id: 'login_test',
        name: 'Login Test',
        method: 'POST' as RequestMethod,
        url: 'https://api.example.com/auth/login',
        parameters: [],
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Accept', value: 'application/json' }
        ],
        testOptions: [
          { id: 'validate_status', name: 'Validate Response Status', enabled: true },
          { id: 'validate_schema', name: 'Validate Response Schema', enabled: true },
          { id: 'measure_perf', name: 'Measure Performance', enabled: false }
        ]
      }
    ]
  },
  {
    id: 'file',
    name: 'File Operations',
    icon: 'description',
    tests: [
      {
        id: 'file_upload',
        name: 'File Upload',
        method: 'POST' as RequestMethod,
        url: 'https://api.example.com/files/upload',
        parameters: [],
        headers: [
          { key: 'Content-Type', value: 'multipart/form-data' },
          { key: 'Accept', value: 'application/json' }
        ],
        testOptions: [
          { id: 'validate_status', name: 'Validate Response Status', enabled: true },
          { id: 'validate_schema', name: 'Validate Response Schema', enabled: false },
          { id: 'measure_perf', name: 'Measure Performance', enabled: true }
        ]
      }
    ]
  },
  {
    id: 'ws',
    name: 'WebSocket Tests',
    icon: 'sync',
    tests: [
      {
        id: 'ws_connection',
        name: 'WebSocket Connection',
        method: 'GET' as RequestMethod,
        url: 'wss://api.example.com/ws',
        parameters: [],
        headers: [],
        testOptions: [
          { id: 'validate_connection', name: 'Validate Connection', enabled: true },
          { id: 'measure_perf', name: 'Measure Performance', enabled: true }
        ]
      }
    ]
  }
];