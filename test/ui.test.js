// Minimal injected DOM exercises event/state logic, NOT a real browser or layout test.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const notes = 'Original synthetic notes. '.repeat(10);
const cards = [0, 1, 2].map(i => ({ id: `card-${i}`, question: `Question ${i}`, answer: `Answer ${i}`, quote: 'Original synthetic notes.' }));
const deck = { schemaVersion: 1, title: 'Injected UI fixture', notes, cards, currentCardId: 'card-0', progress: Object.fromEntries(cards.map(c => [c.id, { again: 0, gotIt: 0, last: null }])) };
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
async function ui(handle = async () => ({ deck: null, revision: 0, generation: { configured: true, model: 'INJECTED' } })) {
  const elements = new Map(), all = [];
  class Element {
    constructor(tag = 'div') { this.tag = tag; this.value = ''; this.checked = false; this.hidden = false; this.disabled = false; this.children = []; this.events = {}; this.textContent = ''; all.push(this); }
    addEventListener(name, cb) { (this.events[name] ||= []).push(cb); }
    async fire(name) { if (this.disabled && ['click', 'input', 'change'].includes(name)) return; await Promise.all((this.events[name] || []).map(cb => cb({}))); }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    querySelector(tag) { for (const c of this.children) { if (c.tag === tag) return c; const nested = c.querySelector(tag); if (nested) return nested; } return null; }
    focus() { this.focused = true; }
  }
  for (const match of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)) { const element = new Element(match[1]); element.id = match[2]; element.hidden = match[0].includes(' hidden'); elements.set(element.id, element); }
  const $ = id => elements.get(id); $('card-count').value = '3'; $('title').value = 'UI test';
  const requests = [];
  const descendants = element => element.children.flatMap(child => [child, ...descendants(child)]);
  function querySelectorAll(selector) {
    assert.equal(selector, 'input, textarea, select, #cards button');
    const cardElements = descendants($('cards'));
    return [...elements.values(), ...cardElements].filter(e => ['input', 'textarea', 'select'].includes(e.tag) || (e.tag === 'button' && cardElements.includes(e)));
  }
  vm.runInNewContext(source, { document: { getElementById: $, createElement: tag => new Element(tag), querySelectorAll }, window: { addEventListener() {} }, structuredClone, console,
    fetch: async (path, init) => { const input = init?.body ? JSON.parse(init.body) : undefined; requests.push({ path, input }); const result = await handle(path, input); return { ok: result?.ok !== false, status: result?.status || 200, json: async () => { if (result?.invalidJson) throw new SyntaxError(); return result; } }; }
  });
  await flush(); return { $, requests };
}
test('UI preserves invalid notes, rejects stale generation and suppresses duplicate generation clicks', async () => {
  const pending = deferred();
  const { $, requests } = await ui(async path => path === '/api/generate' ? pending.promise : { deck: null, revision: 0, generation: { configured: true, model: 'INJECTED' } });
  $('notes').value = 'too short'; await $('generate').fire('click'); assert.equal($('notes').value, 'too short'); assert.equal(requests.length, 1);
  $('notes').value = notes; await $('notes').fire('input');
  const first = $('generate').fire('click'); await $('generate').fire('click');
  $('notes').value = notes + 'Newer text'; await $('notes').fire('input');
  pending.resolve({ cards, model: 'INJECTED', elapsedMs: 1 }); await first;
  assert.equal(requests.filter(r => r.path === '/api/generate').length, 1);
  assert.equal($('review').hidden, true); assert.equal($('notes').value, notes + 'Newer text'); assert.match($('status').textContent, /outdated/);
});

async function pendingRegeneration() {
  const pending = deferred(), approval = deferred();
  let generations = 0;
  const state = await ui(async path => {
    if (path === '/api/state') return { deck: null, revision: 0, generation: { configured: true, model: 'INJECTED' } };
    if (path === '/api/approve') return approval.promise;
    if (++generations === 1) return { cards: structuredClone(cards), model: 'INJECTED', elapsedMs: 1 };
    return pending.promise;
  });
  state.$('notes').value = notes;
  await state.$('generate').fire('click');
  const running = state.$('generate').fire('click');
  return { ...state, running, pending, approval };
}
for (const key of ['question', 'answer', 'quote']) {
  test(`pending regeneration preserves a newer ${key} edit`, async () => {
    const { $, pending, running } = await pendingRegeneration();
    const field = $('cards').children[0].children.find(e => e.id === `card-0-${key}`);
    assert.equal(field.disabled, false);
    field.value = 'Newer reviewed text'; await field.fire('input');
    pending.resolve({ cards: structuredClone(cards), model: 'INJECTED', elapsedMs: 1 }); await running;
    assert.equal($('cards').children[0].children.find(e => e.id === field.id).value, 'Newer reviewed text');
    assert.match($('status').textContent, /outdated/);
  });
}
test('pending regeneration preserves a deletion', async () => {
  const { $, pending, running } = await pendingRegeneration();
  const remove = $('cards').children[0].querySelector('button');
  assert.equal(remove.disabled, false); await remove.fire('click');
  pending.resolve({ cards: structuredClone(cards), model: 'INJECTED', elapsedMs: 1 }); await running;
  assert.equal($('cards').children.length, 2);
  assert.equal($('cards').querySelector('textarea').id, 'card-1-question');
  assert.match($('status').textContent, /outdated/);
});
for (const order of ['generation-first', 'approval-first']) {
  test(`pending regeneration cannot resurrect an approved draft: ${order}`, async () => {
    const { $, requests, pending, running, approval } = await pendingRegeneration();
    $('approved').checked = true; await $('approved').fire('change');
    assert.equal($('save').disabled, false);
    const saving = $('save').fire('click');
    const field = $('cards').querySelector('textarea');
    const remove = $('cards').children[0].querySelector('button');
    assert.equal(field.disabled, true); assert.equal(remove.disabled, true);
    await remove.fire('click'); assert.equal($('cards').children.length, 3);
    await field.fire('input'); await $('approved').fire('change');
    const finishGeneration = async () => { pending.resolve({ cards: structuredClone(cards), model: 'INJECTED', elapsedMs: 1 }); await running; };
    const finishApproval = async () => { approval.resolve({ deck: structuredClone(deck), revision: 1 }); await saving; };
    if (order === 'generation-first') { await finishGeneration(); await finishApproval(); }
    else { await finishApproval(); await finishGeneration(); }
    assert.equal($('review').hidden, true);
    assert.equal(requests.filter(r => r.path === '/api/approve').length, 1);
  });
}
test('UI edit/delete requires reapproval; disk error preserves the editable draft', async () => {
  const { $, requests } = await ui(async path => path === '/api/state' ? { deck: null, revision: 0, generation: { configured: true, model: 'INJECTED' } } : path === '/api/generate' ? { cards: structuredClone(cards), model: 'INJECTED', elapsedMs: 1 } : { ok: false, error: 'Injected disk write failure' });
  $('notes').value = notes; await $('generate').fire('click');
  assert.equal($('save').disabled, true);
  $('approved').checked = true; await $('approved').fire('change');
  const question = $('cards').querySelector('textarea'); question.value = 'Edited question'; await question.fire('input'); assert.equal($('approved').checked, false);
  await $('cards').children[2].querySelector('button').fire('click'); assert.equal($('cards').children.length, 2);
  $('approved').checked = true; await $('approved').fire('change'); await $('save').fire('click');
  const saved = requests.find(r => r.path === '/api/approve'); assert.equal(saved.input.cards.length, 2); assert.equal(saved.input.cards[0].question, 'Edited question');
  assert.match($('status').textContent, /disk write failure/); assert.equal($('review').hidden, false); assert.equal($('save').disabled, false);
});
test('UI reveal and duplicate rating clicks target the correct saved card', async () => {
  const pending = deferred();
  const { $, requests } = await ui(async path => path === '/api/state' ? { deck, revision: 7, generation: { configured: true, model: 'INJECTED' } } : pending.promise);
  assert.equal($('answer-area').hidden, true); await $('reveal').fire('click'); assert.equal($('answer-area').hidden, false);
  const first = $('got-it').fire('click'); await $('got-it').fire('click');
  const next = structuredClone(deck); next.currentCardId = 'card-1'; next.progress['card-0'].gotIt++;
  pending.resolve({ deck: next, revision: 8 }); await first; await flush();
  const ratings = requests.filter(r => r.path === '/api/rate'); assert.equal(ratings.length, 1); assert.equal(ratings[0].input.cardId, 'card-0'); assert.equal(ratings[0].input.revision, 7);
  assert.equal($('question').textContent, 'Question 1'); assert.equal($('answer-area').hidden, true);
});
test('UI non-JSON response is actionable and preserves source text', async () => {
  const { $ } = await ui(async path => path === '/api/state' ? { deck: null, revision: 0, generation: { configured: true, model: 'INJECTED' } } : { invalidJson: true });
  $('notes').value = notes; await $('generate').fire('click'); assert.equal($('notes').value, notes); assert.match($('status').textContent, /not JSON/); assert.equal($('generate').disabled, false);
});
