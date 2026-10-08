import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { createStore } from '../store.js';
import { createHandler } from '../server.js';
import { Readable } from 'node:stream';
import { createOllama, PIN } from '../ollama.js';
import { validateDeck, validateNotes, validateCards } from '../domain.js';
const notes = await readFile(new URL('../fixtures/workshop-notes.txt', import.meta.url), 'utf8');
// Manually authored, reviewed synthetic fixtures. These are NOT model output.
const cards = [
  { id: 'beam', question: 'What shape is each sheet folded into?', answer: 'A triangular beam.', quote: 'Teams fold each sheet lengthwise into a triangular beam before connecting the beams with tape.' },
  { id: 'sketch', question: 'How long is the sketch round?', answer: 'Five minutes.', quote: 'The sketch round lasts five minutes.' },
  { id: 'scraps', question: 'Where do the scraps go?', answer: 'Into the labelled reuse tray.', quote: 'All card scraps go into the labelled reuse tray for the next workshop.' }
];
const draftCards = cards.map(({ id, ...card }) => card);
const deck = () => ({ schemaVersion: 1, title: 'SAMPLE — synthetic workshop (manually authored)', notes, cards: structuredClone(cards), progress: Object.fromEntries(cards.map(c => [c.id, { again: 0, gotIt: 0, last: null }])), currentCardId: 'beam' });
async function temporary(t) {
  const dir = await mkdtemp(join(process.cwd(), '.test-data-'));
  t.after(() => rm(dir, { recursive: true, force: true })); return dir;
}
async function app(t, options = {}) {
  const dir = await temporary(t), store = await createStore(dir, options.write);
  const provider = options.provider || { status: () => ({ configured: true }), generate: async () => ({ cards: draftCards, model: 'INJECTED TEST PROVIDER', elapsedMs: 1 }) };
  const origin = 'http://127.0.0.1:3210';
  const handler = createHandler({ store, provider, getOrigin: () => origin });
  async function request(path, { method = 'GET', headers = {}, raw = '' } = {}) {
    const req = Readable.from(raw ? [Buffer.from(raw)] : []);
    req.method = method; req.url = path;
    req.headers = { host: '127.0.0.1:3210', ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])) };
    const responseHeaders = {};
    const res = { status: 200, headersSent: false,
      setHeader(k, v) { responseHeaders[k.toLowerCase()] = v; },
      writeHead(code, headers = {}) { this.status = code; this.headersSent = true; for (const [k, v] of Object.entries(headers)) this.setHeader(k, v); },
      end(data) { this.text = String(data || ''); }
    };
    await handler(req, res);
    return { status: res.status, text: res.text, headers: responseHeaders };
  }
  async function call(path, data, headers = {}) {
    const res = await request(path, data === undefined ? { headers } : { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, raw: JSON.stringify(data) });
    return { status: res.status, value: JSON.parse(res.text) };
  }
  return { call, request, origin, store, dir };
}
function fakeFetch(handler) { return async (url, init) => new Response(JSON.stringify(await handler(url.pathname, init)), { headers: { 'Content-Type': 'application/json' } }); }
const tags = () => ({ models: [{ name: PIN.name, digest: PIN.digest }] });
const generated = () => ({ done: true, response: JSON.stringify({ cards: draftCards }) });
test('input boundaries, exact quotes, empty decks and schema validation', () => {
  for (const n of ['', 'x'.repeat(99), ' '.repeat(100), 'x'.repeat(6001)]) assert.throws(() => validateNotes(n));
  for (const n of ['x'.repeat(100), 'x'.repeat(6000)]) assert.equal(validateNotes(n), n);
  assert.deepEqual(validateDeck(deck()), deck());
  assert.throws(() => validateCards([], notes));
  assert.throws(() => validateCards([cards[0]], notes, true));
  assert.throws(() => validateCards([{ ...cards[0], quote: 'Not in source' }], notes));
  assert.throws(() => validateCards([cards[0], cards[0]], notes));
  assert.throws(() => validateDeck({ ...deck(), schemaVersion: 2 }));
  assert.throws(() => validateDeck({ ...deck(), currentCardId: 'missing' }));
  const invalid = deck(); invalid.progress.beam.again = -1; assert.throws(() => validateDeck(invalid));
});
test('generate → edit/delete → explicit approval → study → restart → export/import', async t => {
  const a = await app(t);
  const generated = await a.call('/api/generate', { notes, count: 3 });
  assert.equal(generated.status, 200); assert.equal(generated.value.cards.length, 3);
  assert.equal(a.store.get().deck, null);
  const edited = generated.value.cards.slice(0, 2); edited[0].answer = 'Fold it into a triangular beam.';
  const approve = { revision: 0, title: 'Reviewed test deck', notes, cards: edited };
  assert.equal((await a.call('/api/approve', approve)).status, 400);
  let saved = await a.call('/api/approve', { ...approve, reviewed: true }); assert.equal(saved.status, 200);
  assert.equal(saved.value.deck.cards.length, 2); assert.equal(saved.value.deck.cards[0].answer, edited[0].answer);
  const id = saved.value.deck.currentCardId;
  const rate = { revision: 1, cardId: id, rating: 'gotIt' };
  const results = await Promise.all([a.call('/api/rate', rate), a.call('/api/rate', rate)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const restored = await createStore(a.dir); assert.equal(restored.get().deck.progress[id].gotIt, 1);
  assert.equal(restored.get().deck.currentCardId, edited[1].id);
  assert.equal((await a.call('/api/rate', { revision: 2, cardId: id, rating: 'again' })).status, 409);
  assert.equal((await a.call('/api/rate', { revision: 2, cardId: edited[1].id, rating: 'again' })).status, 200);
  const exported = await a.call('/api/export'); assert.equal(exported.status, 200);
  const b = await app(t); const imported = await b.call('/api/import', { revision: 0, reviewed: true, deck: exported.value });
  assert.equal(imported.status, 200); assert.deepEqual(imported.value.deck, exported.value);
  assert.deepEqual((await createStore(b.dir)).get().deck, exported.value);
});
test('invalid and oversized imports preserve saved data; stale approvals rejected', async t => {
  const a = await app(t);
  await a.call('/api/import', { revision: 0, reviewed: true, deck: deck() }); const before = a.store.get();
  for (const candidate of [{ ...deck(), schemaVersion: 2 }, { ...deck(), cards: [] }, { ...deck(), notes: 'short' }]) {
    assert.equal((await a.call('/api/import', { revision: 1, reviewed: true, deck: candidate })).status, 400);
    assert.deepEqual(a.store.get(), before);
  }
  assert.equal((await a.call('/api/import', { revision: 1, reviewed: true, deck: { ...deck(), title: 'x'.repeat(100001) } })).status, 413);
  assert.equal((await a.call('/api/import', { revision: 0, reviewed: true, deck: deck() })).status, 409);
  assert.deepEqual(a.store.get(), before);
});
test('failed atomic write leaves prior disk and in-memory state intact and retry works', async t => {
  const dir = await temporary(t); const initial = await createStore(dir); await initial.change(0, deck);
  let fail = true;
  const { atomicWrite } = await import('../store.js');
  const store = await createStore(dir, async (...args) => { if (fail) throw new Error('injected disk failure'); await atomicWrite(...args); });
  const before = store.get();
  await assert.rejects(store.change(1, d => ({ ...d, title: 'Changed' })), /Could not write/);
  assert.deepEqual(store.get(), before); assert.deepEqual((await createStore(dir)).get(), before);
  fail = false; await store.change(1, d => ({ ...d, title: 'Retry' })); assert.equal(store.get().deck.title, 'Retry');
});
test('security: cross-origin writes, Host, paths, content type, malformed JSON and inert text', async t => {
  const a = await app(t); const payload = { revision: 0, reviewed: true, deck: deck() };
  for (const headers of [{ Origin: 'https://evil.invalid' }, { Origin: '' }, { 'Sec-Fetch-Site': 'cross-site' }, { Host: 'evil.invalid' }]) assert.equal((await a.call('/api/import', payload, headers)).status, 403);
  for (const path of ['/..%2fmanifest.json', '/%2e%2e/server.js', '/manifest.json', '/server.js']) assert.equal((await a.request(path)).status, 404);
  assert.equal((await a.call('/api/import', payload, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await a.request('/api/import', { method: 'POST', headers: { Origin: a.origin, 'Content-Type': 'application/json' }, raw: '{' })).status, 400);
  const malicious = deck(); malicious.title = '<script>alert(1)</script>'; malicious.cards[0].answer = '<img src=x onerror=alert(1)>';
  assert.equal((await a.call('/api/import', { ...payload, deck: malicious })).status, 200);
  assert.equal((await a.call('/api/export')).value.cards[0].answer, malicious.cards[0].answer);
  const page = await a.request('/'); assert.match(page.headers['content-security-policy'], /default-src 'none'/);
  const js = await readFile(new URL('../public/app.js', import.meta.url), 'utf8'); assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML/);
});
test('adapter verifies digest, bounds request, and returns only validated injected cards', async () => {
  const calls = [];
  const provider = createOllama({ url: 'http://127.0.0.1:11434', fetchImpl: fakeFetch((path, init) => { calls.push({ path, init }); return path === '/api/tags' ? tags() : generated(); }) });
  const result = await provider.generate(notes, 3); assert.deepEqual(result.cards, draftCards);
  assert.deepEqual(calls.map(c => c.path), ['/api/tags', '/api/generate']);
  const request = JSON.parse(calls[1].init.body);
  assert.equal(request.model, PIN.name); assert.equal(request.options.num_predict, 1400); assert.equal(request.stream, false); assert.equal(request.think, false); assert.equal('keep_alive' in request, false);
  assert.equal(request.prompt.includes(notes), true);
});
test('adapter missing configuration and bad digest never generate; resource failure latches', async () => {
  await assert.rejects(createOllama().generate(notes, 3), /explicit OLLAMA_URL/);
  for (const url of ['https://127.0.0.1:11434', 'http://example.com', 'http://127.0.0.1:11434/api']) assert.throws(() => createOllama({ url }));
  let calls = 0;
  const provider = createOllama({ url: 'http://127.0.0.1:11434', fetchImpl: fakeFetch(() => { calls++; return { models: [{ name: PIN.name, digest: 'wrong' }] }; }) });
  await assert.rejects(provider.generate(notes, 3), /digest/); await assert.rejects(provider.generate(notes, 3), /Generation stopped/); assert.equal(calls, 1);
  const offline = createOllama({ url: 'http://127.0.0.1:11434', fetchImpl: async () => { throw new Error('injected connection refused'); } });
  await assert.rejects(offline.generate(notes, 3), /connection refused/); assert.ok(offline.status().stopped);
});
test('adapter rejects malformed, incomplete, non-JSON, oversized and unsupported quotes', async () => {
  for (const output of [{ done: false, response: '{}' }, { done: true, response: 'not JSON' }, { done: true, response: JSON.stringify({ cards: [{ ...draftCards[0], quote: 'invented' }, ...draftCards.slice(1)] }) }, { done: true, response: JSON.stringify({ cards: [] }) }]) {
    const provider = createOllama({ url: 'http://127.0.0.1:11434', fetchImpl: fakeFetch(path => path === '/api/tags' ? tags() : output) });
    await assert.rejects(provider.generate(notes, 3));
  }
  const malformed = createOllama({ url: 'http://127.0.0.1:11434', fetchImpl: async () => new Response('<html>offline</html>') });
  await assert.rejects(malformed.generate(notes, 3), /non-JSON/);
  const oversized = createOllama({ url: 'http://127.0.0.1:11434', fetchImpl: async () => new Response('x'.repeat(1_000_001)) });
  await assert.rejects(oversized.generate(notes, 3), /exceeded/);
});
test('adapter has one generation slot, bounded timeout, then stops dependency', async () => {
  const provider = createOllama({ url: 'http://127.0.0.1:11434', timeoutMs: 25, fetchImpl: (url, { signal }) => new Promise((resolve, reject) => { signal.addEventListener('abort', () => reject(new Error('injected abort')), { once: true }); }) });
  const pending = provider.generate(notes, 3);
  await assert.rejects(provider.generate(notes, 3), /already running/);
  await assert.rejects(pending, /budget exceeded/);
  assert.equal(provider.status().busy, false); assert.ok(provider.status().stopped);
  await assert.rejects(provider.generate(notes, 3), /Generation stopped/);
});
