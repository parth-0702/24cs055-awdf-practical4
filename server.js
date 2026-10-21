/**
 * Charotar University of Science and Technology (CHARUSAT)
 * CSPIT - Computer Science & Engineering
 * Course: Advanced Web Development Frameworks (ITUE301)
 * Practical 4: Building a RESTful API with Node.js and Express
 * Student: Parth Oza (24CS055)
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. Built-in JSON Body Parsing Middleware
// ==========================================
app.use(express.json());

// ==========================================
// 2. Global Request Logging Middleware
// Logs HTTP Method, Request URL, and Timestamp
// ==========================================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ==========================================
// 3. Supplementary Problem: Content-Type Validation Middleware
// Rejects POST / PUT requests missing 'application/json' Content-Type
// ==========================================
const requireJsonContent = (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.toLowerCase().includes('application/json')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Requests with payload (POST/PUT) must include "Content-Type: application/json" header.'
      });
    }
  }
  next();
};

app.use(requireJsonContent);

// ==========================================
// 4. In-Memory Task Storage (Temporary Array)
// ==========================================
let tasks = [
  {
    id: 1,
    title: 'Complete Practical 4 Lab',
    description: 'Implement Express RESTful API with full CRUD and middleware pipeline.',
    status: 'in-progress',
    createdAt: new Date('2026-10-11T10:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-10-11T10:00:00.000Z').toISOString()
  },
  {
    id: 2,
    title: 'Review IBM Coursera Module 1',
    description: 'Study REST API design, middleware lifecycle, and error handling.',
    status: 'completed',
    createdAt: new Date('2026-10-11T11:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-10-11T11:00:00.000Z').toISOString()
  },
  {
    id: 3,
    title: 'Prepare Postman Test Collection',
    description: 'Verify status codes: 200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Error.',
    status: 'pending',
    createdAt: new Date('2026-10-11T12:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-10-11T12:00:00.000Z').toISOString()
  }
];

let nextId = 4;

// ==========================================
// 5. Supplementary Problem: Route-Specific ID Validation Middleware
// Validates that :id is a positive integer before reaching controllers
// ==========================================
const validateTaskId = (req, res, next) => {
  const parsedId = Number(req.params.id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({
      error: 'Invalid Task ID',
      message: `The provided ID '${req.params.id}' is invalid. Task ID must be a positive integer.`
    });
  }
  req.validatedId = parsedId;
  next();
};

// ==========================================
// 6. RESTful CRUD Routes for Tasks
// ==========================================

// GET / - Root Health / Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Task Manager RESTful API (Practical 4)',
    author: 'Parth Oza (24CS055)',
    course: 'ITUE301: Advanced Web Development Frameworks',
    version: '1.0.0',
    endpoints: {
      getAllTasks: 'GET /tasks',
      getTaskById: 'GET /tasks/:id',
      createTask: 'POST /tasks',
      updateTask: 'PUT /tasks/:id',
      deleteTask: 'DELETE /tasks/:id'
    }
  });
});

// GET /tasks - Read all tasks (with optional query filter by status)
app.get('/tasks', (req, res) => {
  const { status, search } = req.query;
  let result = tasks;

  if (status) {
    result = result.filter(t => t.status.toLowerCase() === status.toLowerCase());
  }
  if (search) {
    result = result.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  res.status(200).json({
    success: true,
    count: result.length,
    data: result
  });
});

// GET /tasks/:id - Read single task by ID (uses validateTaskId middleware)
app.get('/tasks/:id', validateTaskId, (req, res) => {
  const task = tasks.find(t => t.id === req.validatedId);
  if (!task) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Task with ID ${req.validatedId} not found.`
    });
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// POST /tasks - Create a new task (Returns 201 Created)
app.post('/tasks', (req, res) => {
  const { title, description, status } = req.body;

  // Validation: Title is required
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Task title is required and cannot be empty.'
    });
  }

  const validStatuses = ['pending', 'in-progress', 'completed'];
  const taskStatus = status && validStatuses.includes(status.toLowerCase())
    ? status.toLowerCase()
    : 'pending';

  const now = new Date().toISOString();
  const newTask = {
    id: nextId++,
    title: title.trim(),
    description: description ? description.trim() : '',
    status: taskStatus,
    createdAt: now,
    updatedAt: now
  };

  tasks.push(newTask);

  res.status(201).json({
    success: true,
    message: 'Task created successfully.',
    data: newTask
  });
});

// PUT /tasks/:id - Update an existing task (uses validateTaskId middleware)
app.put('/tasks/:id', validateTaskId, (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.validatedId);
  if (taskIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Task with ID ${req.validatedId} does not exist.`
    });
  }

  const { title, description, status } = req.body;

  // Partial or full update
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Title must be a non-empty string.'
      });
    }
    tasks[taskIndex].title = title.trim();
  }

  if (description !== undefined) {
    tasks[taskIndex].description = typeof description === 'string' ? description.trim() : '';
  }

  if (status !== undefined) {
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Status must be one of: ${validStatuses.join(', ')}.`
      });
    }
    tasks[taskIndex].status = status.toLowerCase();
  }

  tasks[taskIndex].updatedAt = new Date().toISOString();

  res.status(200).json({
    success: true,
    message: `Task with ID ${req.validatedId} updated successfully.`,
    data: tasks[taskIndex]
  });
});

// DELETE /tasks/:id - Delete a task by ID (uses validateTaskId middleware)
app.delete('/tasks/:id', validateTaskId, (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.validatedId);
  if (taskIndex === -1) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Task with ID ${req.validatedId} not found.`
    });
  }

  const [deletedTask] = tasks.splice(taskIndex, 1);

  res.status(200).json({
    success: true,
    message: `Task with ID ${req.validatedId} deleted successfully.`,
    data: deletedTask
  });
});

// ==========================================
// 7. Faculty Demonstration Route: Deliberate Error Trigger
// Demonstrates global error handler catching unhandled exceptions
// ==========================================
app.get('/trigger-error', (req, res, next) => {
  const err = new Error('Demonstration: Deliberately triggered internal server error.');
  err.status = 500;
  next(err);
});

// ==========================================
// 8. Supplementary Problem: Custom 404 Handler for Undefined Routes
// Catches any requests that did not match registered routes
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. This endpoint does not exist.`,
    validRoutes: [
      'GET    /tasks',
      'GET    /tasks/:id',
      'POST   /tasks',
      'PUT    /tasks/:id',
      'DELETE /tasks/:id',
      'GET    /trigger-error'
    ]
  });
});

// ==========================================
// 9. Global Centralized Error Handling Middleware
// Defined LAST in the middleware pipeline with (err, req, res, next)
// ==========================================
app.use((err, req, res, next) => {
  console.error('[Global Error Handler] Caught Exception:\n', err.stack || err.message);

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong on the server.'
  });
});

// ==========================================
// 10. Start HTTP Server
// ==========================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Task Manager REST API Server is running on port ${PORT}`);
    console.log(`Base URL: http://localhost:${PORT}`);
    console.log(`Logging Middleware: Active`);
    console.log(`Global Error Handler: Active`);
    console.log(`====================================================`);
  });
}

module.exports = app;
