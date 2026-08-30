import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('GET /api/health returns HTTP 200 and health status', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const response = await fetch(`http://localhost:${port}/api/health`);
    assert.strictEqual(response.status, 200);

    const data = await response.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, 'Shewwina API is running');
    assert.ok(data.data);
    assert.strictEqual(data.data.service, 'Shewwina Backend API');
  } finally {
    server.close();
  }
});
