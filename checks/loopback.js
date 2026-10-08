// Separate real socket check. Expected to fail in the recorded no-network sandbox.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createStore } from '../store.js';
import { createApp } from '../server.js';
import { createOllama } from '../ollama.js';
test('actual loopback listener serves browser entry point', async t => {
  const dir = await mkdtemp(join(process.cwd(), '.test-data-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const server = createApp({ store: await createStore(dir), provider: createOllama() });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  assert.equal(server.address().address, '127.0.0.1');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(origin);
  assert.equal(page.status, 200); assert.match(await page.text(), /Note Cards/);
  const state = await (await fetch(origin + '/api/state')).json(); assert.equal(state.deck, null);
  const blocked = await fetch(origin + '/api/import', { method: 'POST', headers: { Origin: 'https://invalid.example', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(blocked.status, 403);
});
