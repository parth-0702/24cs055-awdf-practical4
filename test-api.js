const app = require('./server');
const http = require('http');

let server;
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, options);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = await response.text();
  }
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data
  };
}

async function runTests() {
  console.log('===============================================================');
  console.log('  Practical 4: Express RESTful API Automated Verification Test ');
  console.log('  Student: Parth Oza (24CS055) | ITUE301                        ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  async function testCase(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] Test ${total}: ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] Test ${total}: ${name}`);
      console.error(`       Error: ${err.message}`);
    }
  }

  // 1. Health check
  await testCase('GET / - API root returns 200 OK', async () => {
    const res = await request('/');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data.endpoints) throw new Error('Endpoints overview missing');
  });

  // 2. GET /tasks
  await testCase('GET /tasks - Retrieve all tasks returns 200 OK with array', async () => {
    const res = await request('/tasks');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data.data)) throw new Error('Data is not an array');
    if (res.data.count < 1) throw new Error('Expected at least 1 seeded task');
  });

  // 3. POST /tasks without Content-Type (Supplementary Problem 1)
  await testCase('POST /tasks without Content-Type header rejected with 400 Bad Request', async () => {
    const res = await request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Invalid Content-Type Task' })
      // Notice: No headers provided!
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (res.data.error !== 'Bad Request') throw new Error(`Unexpected error message: ${JSON.stringify(res.data)}`);
  });

  // 4. POST /tasks with valid payload
  let createdTaskId;
  await testCase('POST /tasks with valid payload returns 201 Created and new task', async () => {
    const payload = {
      title: 'Automated Test Task',
      description: 'Created during test suite execution',
      status: 'pending'
    };
    const res = await request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (res.data.data.title !== payload.title) throw new Error('Title mismatch');
    createdTaskId = res.data.data.id;
  });

  // 5. POST /tasks with missing title
  await testCase('POST /tasks with missing title returns 400 Validation Error', async () => {
    const res = await request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'No title' })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (res.data.error !== 'Validation Error') throw new Error('Expected Validation Error');
  });

  // 6. GET /tasks/:id (valid ID)
  await testCase('GET /tasks/:id with valid existing ID returns 200 OK', async () => {
    const res = await request(`/tasks/${createdTaskId}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.data.id !== createdTaskId) throw new Error('Task ID mismatch');
  });

  // 7. GET /tasks/:id with non-numeric ID (Supplementary Problem 2)
  await testCase('GET /tasks/:id with invalid ID format ("abc") rejected with 400 Bad Request', async () => {
    const res = await request('/tasks/abc');
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (res.data.error !== 'Invalid Task ID') throw new Error('Expected Invalid Task ID');
  });

  // 8. GET /tasks/:id with non-existent numeric ID
  await testCase('GET /tasks/9999 with non-existent ID returns 404 Not Found', async () => {
    const res = await request('/tasks/9999');
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 9. PUT /tasks/:id
  await testCase('PUT /tasks/:id with valid updates returns 200 OK and updated task', async () => {
    const res = await request(`/tasks/${createdTaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', description: 'Updated successfully' })
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data.data.status !== 'completed') throw new Error('Status not updated');
  });

  // 10. DELETE /tasks/:id
  await testCase('DELETE /tasks/:id removes task and returns 200 OK', async () => {
    const res = await request(`/tasks/${createdTaskId}`, {
      method: 'DELETE'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);

    // Verify task is now deleted
    const verifyRes = await request(`/tasks/${createdTaskId}`);
    if (verifyRes.status !== 404) throw new Error('Deleted task still accessible');
  });

  // 11. Undefined route custom 404 handler (Supplementary Problem 3)
  await testCase('GET /api/undefined-route returns structured 404 JSON response', async () => {
    const res = await request('/api/undefined-route');
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    if (res.data.error !== 'Route Not Found') throw new Error('Expected Route Not Found');
    if (!Array.isArray(res.data.validRoutes)) throw new Error('Expected validRoutes list');
  });

  // 12. Deliberate unhandled error caught by Global Error Handler
  await testCase('GET /trigger-error triggers centralized 500 error handler', async () => {
    const res = await request('/trigger-error');
    if (res.status !== 500) throw new Error(`Expected 500, got ${res.status}`);
    if (res.data.error !== 'Error') throw new Error(`Unexpected error format: ${JSON.stringify(res.data)}`);
  });

  console.log('\n===============================================================');
  console.log(`  Test Results Summary: ${passed} / ${total} Tests Passed (${Math.round((passed/total)*100)}%)`);
  console.log('===============================================================\n');

  server.close();
}

server = app.listen(PORT, () => {
  runTests();
});
