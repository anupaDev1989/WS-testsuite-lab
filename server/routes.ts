import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the development testing environment
  app.get('/api/test/ping', (req, res) => {
    res.json({ message: 'pong', server: 'Express', timestamp: new Date() });
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
       .slice(0, limit)
    });
  });

  // Create a new user
  app.post('/api/users', (req, res) => {
    res.status(201).json({
      id: 4,
      name: req.body.name || "New User",
      email: req.body.email || "newuser@example.com",
      active: true,
      createdAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
    });
  });

  // Delete a user
  app.delete('/api/users/:id', (req, res) => {
    res.json({
      success: true,
      message: "User deleted successfully"
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
      ]
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
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
