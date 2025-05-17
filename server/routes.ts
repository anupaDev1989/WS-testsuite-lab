import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  workerStatusMiddleware, 
  workerTestMiddleware, 
  checkWorkerStatus, 
  executeWorkerTest 
} from "./cloudflare";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the development testing environment
  app.get('/api/test/ping', (req, res) => {
    res.json({ message: 'pong', server: 'Cloudflare Worker', timestamp: new Date() });
  });

  // Cloudflare Worker API endpoints
  app.get('/api/cloudflare/status', workerStatusMiddleware);
  app.post('/api/cloudflare/test', workerTestMiddleware);
  
  // List Cloudflare Workers
  app.get('/api/cloudflare/workers', async (req, res) => {
    try {
      const status = await checkWorkerStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: 'Error listing workers',
        error: error.message 
      });
    }
  });

  // Execute test against a specific worker
  app.post('/api/cloudflare/execute', async (req, res) => {
    const { method, url, headers, body } = req.body;
    
    if (!method || !url) {
      return res.status(400).json({
        status: 'error',
        message: 'Method and URL are required'
      });
    }
    
    try {
      const result = await executeWorkerTest(method, url, headers, body);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Error executing worker test',
        error: error.message
      });
    }
  });

  // Endpoint to get mock user data
  app.get('/api/users', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const activeFilter = req.query.active === 'true';
    
    res.json({
      users: [
        {
          id: 1,
          name: "John Smith",
          email: "john@example.com",
          active: true
        },
        {
          id: 2,
          name: "Sarah Jones",
          email: "sarah@example.com",
          active: true
        },
        {
          id: 3,
          name: "Mike Johnson",
          email: "mike@example.com",
          active: false
        }
      ].filter(user => !activeFilter || user.active)
       .slice(0, limit),
      worker: 'Cloudflare Worker',
      cf_ray: `${Math.random().toString(36).substring(2, 15)}`,
      worker_id: `worker-${Math.floor(Math.random() * 1000)}`
    });
  });

  // Create a new user
  app.post('/api/users', (req, res) => {
    res.status(201).json({
      id: 4,
      name: req.body.name || "New User",
      email: req.body.email || "newuser@example.com",
      active: true,
      createdAt: new Date().toISOString(),
      worker: 'Cloudflare Worker',
      cf_ray: `${Math.random().toString(36).substring(2, 15)}`,
      worker_id: `worker-${Math.floor(Math.random() * 1000)}`
    });
  });

  // Update a user
  app.put('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    res.json({
      id: userId,
      name: req.body.name || "Updated User",
      email: req.body.email || "updated@example.com",
      active: true,
      updatedAt: new Date().toISOString(),
      worker: 'Cloudflare Worker',
      cf_ray: `${Math.random().toString(36).substring(2, 15)}`,
      worker_id: `worker-${Math.floor(Math.random() * 1000)}`
    });
  });

  // Delete a user
  app.delete('/api/users/:id', (req, res) => {
    res.json({
      success: true,
      message: "User deleted successfully",
      worker: 'Cloudflare Worker',
      cf_ray: `${Math.random().toString(36).substring(2, 15)}`,
      worker_id: `worker-${Math.floor(Math.random() * 1000)}`
    });
  });

  // Mock database query endpoint
  app.get('/api/db/query', (req, res) => {
    const table = req.query.table || 'unknown';
    res.json({
      table,
      rows: 3,
      data: [
        { id: 1, name: "Row 1" },
        { id: 2, name: "Row 2" },
        { id: 3, name: "Row 3" }
      ],
      worker: 'Cloudflare Worker',
      cf_ray: `${Math.random().toString(36).substring(2, 15)}`,
      worker_id: `worker-${Math.floor(Math.random() * 1000)}`
    });
  });

  // Mock authentication endpoint
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') {
      res.json({
        success: true,
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        user: {
          id: 1,
          username: 'admin',
          role: 'administrator'
        },
        worker: 'Cloudflare Worker',
        cf_ray: `${Math.random().toString(36).substring(2, 15)}`,
        worker_id: `worker-${Math.floor(Math.random() * 1000)}`
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
        worker: 'Cloudflare Worker',
        cf_ray: `${Math.random().toString(36).substring(2, 15)}`,
        worker_id: `worker-${Math.floor(Math.random() * 1000)}`
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
