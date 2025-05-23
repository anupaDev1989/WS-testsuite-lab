import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from 'axios';
import { 
  workerStatusMiddleware, 
  workerTestMiddleware, 
  checkWorkerStatus, 
  executeWorkerTest 
} from "./cloudflare";

const DIRECT_WORKER_MODE = process.env.DIRECT_WORKER_MODE === 'true';
const WORKER_URL = 'https://testsuite-worker.des9891sl.workers.dev';

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the development testing environment
  app.get('/api/test/ping', (req, res) => {
    res.json({ message: 'pong', server: 'Cloudflare Worker', timestamp: new Date() });
  });

  // Worker status endpoint
  app.get('/api/cloudflare/status', async (req, res) => {
    if (DIRECT_WORKER_MODE) {
      try {
        const response = await axios.get(`${WORKER_URL}/health`);
        res.json({
          status: 'connected',
          message: 'Successfully connected to Worker (Direct Mode)',
          worker: response.data
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Failed to connect to Worker (Direct Mode)',
          error: error.message
        });
      }
    } else {
      return workerStatusMiddleware(req, res);
    }
  });

  // Worker test endpoint
  app.post('/api/cloudflare/test', (req, res) => {
    if (DIRECT_WORKER_MODE) {
      const { method, url, headers, body } = req.body;
      axios({
        method,
        url,
        headers,
        data: body
      })
      .then(response => {
        res.json({
          status: 'success',
          statusCode: response.status,
          duration: 0,
          response: response.data,
          headers: response.headers
        });
      })
      .catch(error => {
        res.status(500).json({
          status: 'error',
          message: error.message,
          response: error.response?.data
        });
      });
    } else {
      return workerTestMiddleware(req, res);
    }
  });
  
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
    const { email, password } = req.body;
    if (email && password) {
      res.cookie('connect.sid', `s:${Math.random().toString(36).substring(7)}.`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 24 * 60 * 60 * 1000 
      });
      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: "mock-user-id-123",
          email: email, 
          name: "Mock User"
        }
      });
    } else {
      res.status(400).json({ success: false, message: "Email and password are required" });
    }
  });

  // Mock endpoint to get user profile (simulates an authenticated route)
  app.get('/api/auth/profile', (req, res) => {
    if (req.headers.cookie && req.headers.cookie.includes('connect.sid')) {
      res.json({
        id: 'user-123-auth-mock', 
        email: 'authenticated.user@example.com', 
        emailVerified: true,
        displayName: 'Authenticated User',
        timezone: 'America/New_York',
        locale: 'en-US',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), 
        lastLoginAt: new Date().toISOString(),
        accountType: 'free',
      });
    } else {
      res.status(401).json({ success: false, message: "Unauthorized: No session cookie found." });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('connect.sid');
    res.json({ success: true, message: "Logged out successfully" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
