# Practical 4: Building a RESTful API with Node.js and Express

**Student Details:**
- **Name:** Parth Oza
- **Student ID:** 24CS055
- **Email:** 24cs055@charusat.edu.in
- **Course:** ITUE301: Advance Web Development Framework
- **Institute:** CSPIT, Charotar University of Science and Technology (CHARUSAT)

---

## 📌 Objective
To design and implement a RESTful backend server with complete CRUD endpoints using the Express middleware pipeline, request logging, and centralized error handling.

---

## 🏗️ Architecture & Request-Response Pipeline
```
Client (Postman / Thunder Client / Browser)
   │
   ▼
[1. Request Logging Middleware] (Method, URL, Timestamp)
   │
   ▼
[2. Content-Type Validator Middleware] (Requires application/json on POST/PUT)
   │
   ▼
[3. Express Router & Route-Specific Middleware]
   ├── GET    /tasks              ──> getAllTasks (200 OK)
   ├── GET    /tasks/:id          ──> validateTaskId ──> getTaskById (200 OK / 404)
   ├── POST   /tasks              ──> createTask (201 Created / 400 Bad Request)
   ├── PUT    /tasks/:id          ──> validateTaskId ──> updateTask (200 OK / 404)
   └── DELETE /tasks/:id          ──> validateTaskId ──> deleteTask (200 OK / 404)
   │
   ▼
[4. Custom 404 Handler for Undefined Routes] (404 Not Found)
   │
   ▼
[5. Global Error Handling Middleware] (500 Internal Server Error)
```

---

## 🚀 REST API Endpoints

| HTTP Method | Route | Description | Status Codes |
|-------------|-------|-------------|--------------|
| `GET` | `/` | Root health check and API overview | `200 OK` |
| `GET` | `/tasks` | Retrieve all tasks (supports query filtering) | `200 OK` |
| `GET` | `/tasks/:id` | Retrieve a specific task by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/tasks` | Create a new task | `201 Created`, `400 Bad Request` |
| `PUT` | `/tasks/:id` | Update an existing task | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/tasks/:id` | Remove a task by ID | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `GET` | `/trigger-error` | Deliberately triggers global error handler | `500 Internal Server Error` |

---

## ⚙️ Middleware Features & Supplementary Problems

1. **Global Request Logger:**
   Logs every request: `[2026-10-11T18:25:00.000Z] GET /tasks`.
2. **Content-Type Validation Middleware (Supplementary Problem 1):**
   Rejects any `POST` or `PUT` request without `Content-Type: application/json` header with HTTP 400.
3. **Route-Specific ID Validation Middleware (Supplementary Problem 2):**
   Validates `:id` parameter to guarantee it is a positive integer before hitting controller logic.
4. **Custom 404 Handler (Supplementary Problem 3):**
   Catches unhandled paths (e.g. `GET /unknown`) and returns a structured JSON payload listing available endpoints.
5. **Centralized Global Error Handler:**
   Positioned as the last middleware with four parameters `(err, req, res, next)` to ensure safe error responses without leaking stack traces.

---

## 🛠️ Installation & Execution

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the API server:**
   ```bash
   npm start
   ```

3. **Run automated API test suite:**
   ```bash
   npm test
   ```
