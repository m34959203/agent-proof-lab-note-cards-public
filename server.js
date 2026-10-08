import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { AppError, MAX_BYTES, validateNotes, validateCards, validateDeck } from './domain.js';
import { createStore } from './store.js';
import { createOllama } from './ollama.js';
const files = new Map([['/', ['index.html', 'text/html']], ['/app.js', ['app.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']]]);
async function body(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw new AppError('Send application/json.', 415);
  if (Number(req.headers['content-length']) > MAX_BYTES) throw new AppError('Request exceeds 100,000 bytes.', 413);
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) throw new AppError('Request exceeds 100,000 bytes.', 413);
    chunks.push(chunk);
  }
  try { const value = JSON.parse(Buffer.concat(chunks).toString('utf8')); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; }
  catch { throw new AppError('Invalid JSON. Saved data is unchanged.'); }
}
export function createHandler({ store, provider, getOrigin }) {
  return async (req, res) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
    try {
      const origin = getOrigin();
      if (req.headers.host !== new URL(origin).host) throw new AppError(`Open ${origin}; untrusted Host rejected.`, 403);
      if (req.headers['sec-fetch-site'] === 'cross-site') throw new AppError('Cross-site requests are not allowed.', 403);
      if (req.method !== 'GET' && req.headers.origin !== origin) throw new AppError('Mutation requires the exact local app Origin.', 403);
      // Exact route matching: no user-supplied file paths or URL normalization.
      if (req.method === 'GET' && files.has(req.url)) {
        const [file, type] = files.get(req.url);
        res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
        res.end(await readFile(new URL(`./public/${file}`, import.meta.url))); return;
      }
      if (req.method === 'GET' && req.url === '/api/state') return send(200, { ...store.get(), generation: provider.status() });
      if (req.method === 'GET' && req.url === '/api/export') {
        const { deck } = store.get();
        if (!deck) throw new AppError('Save an approved deck before exporting.', 404);
        res.setHeader('Content-Disposition', 'attachment; filename="note-cards-v1.json"');
        return send(200, deck);
      }
      if (req.method !== 'POST' || !['/api/generate', '/api/approve', '/api/import', '/api/rate'].includes(req.url)) throw new AppError('Not found.', 404);
      const input = await body(req);
      if (req.url === '/api/generate') {
        validateNotes(input.notes);
        const result = await provider.generate(input.notes, input.count);
        return send(200, { ...result, cards: result.cards.map(c => ({ ...c, id: randomUUID() })) });
      }
      if (!Number.isSafeInteger(input.revision) || input.revision < 0) throw new AppError('Missing saved-deck revision. Reload the saved deck.');
      if (req.url === '/api/approve') {
        if (input.reviewed !== true) throw new AppError('Explicitly confirm that you reviewed every card.');
        const notes = validateNotes(input.notes);
        const cards = validateCards(input.cards, notes);
        const progress = Object.fromEntries(cards.map(c => [c.id, { again: 0, gotIt: 0, last: null }]));
        return send(200, await store.change(input.revision, () => ({ schemaVersion: 1, title: input.title, notes, cards, progress, currentCardId: cards[0].id })));
      }
      if (req.url === '/api/import') {
        if (input.reviewed !== true) throw new AppError('Confirm review of the imported deck before replacing saved data.');
        const deck = validateDeck(input.deck);
        return send(200, await store.change(input.revision, () => deck));
      }
      if (!['again', 'gotIt'].includes(input.rating)) throw new AppError('Choose Again or Got it.');
      return send(200, await store.change(input.revision, deck => {
        if (!deck || deck.currentCardId !== input.cardId) throw new AppError('This is not the current study card. Reload saved state.', 409);
        const p = deck.progress[input.cardId]; p[input.rating]++; p.last = input.rating;
        const index = deck.cards.findIndex(c => c.id === input.cardId);
        deck.currentCardId = deck.cards[(index + 1) % deck.cards.length].id;
        return deck;
      }));
    } catch (error) {
      if (!res.headersSent) send(error.status || 500, { error: error.status ? error.message : 'Unexpected local error. Saved data was not replaced; inspect the server terminal.' });
      else res.end();
      if (!error.status) console.error(error);
    }
  };
}
export function createApp({ store, provider }) {
  const server = http.createServer(createHandler({ store, provider, getOrigin: () => `http://127.0.0.1:${server.address().port}` }));
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const port = Number(process.env.PORT || 3210);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT must be 1024–65535.');
    const store = await createStore(process.env.NOTE_CARDS_DATA_DIR);
    const provider = createOllama({ url: process.env.OLLAMA_URL });
    const app = createApp({ store, provider });
    app.on('error', error => { console.error(error.message); process.exitCode = 1; });
    app.listen(port, '127.0.0.1', () => console.log(`Note Cards: http://127.0.0.1:${port}\nLocal single-user tool. Data: ${process.env.NOTE_CARDS_DATA_DIR}\nGeneration: ${provider.status().configured ? 'configured; pinned digest checked before requests' : 'unconfigured; no fallback'}\nLive inference acceptance: NOT_TESTED by this implementation take.`));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
