'use strict';
const $ = id => document.getElementById(id);
let saved = null, revision = 0, draft = null, sourceVersion = 0, generating = false, writing = false, loading = false, ready = false, imported = null;
let generation = { configured: false, stopped: null };
function status(message) { $('status').textContent = message; }
async function api(path, value) {
  let response;
  try { response = await fetch(path, value === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }); }
  catch { throw new Error('Cannot reach Note Cards. Check that the local server is running. Your on-screen text is kept.'); }
  let result;
  try { result = await response.json(); } catch { throw new Error('Server response was not JSON. Your text is kept; check the server terminal.'); }
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
  return result;
}
function buttons() {
  document.querySelectorAll('input, textarea, select, #cards button').forEach(control => { control.disabled = writing; });
  $('generate').disabled = !ready || generating || writing || !generation.configured || Boolean(generation.stopped);
  $('generate').textContent = generating ? 'Generating… (up to 120 seconds)' : 'Generate AI draft';
  $('save').disabled = writing || loading || !draft?.cards.length || !$('approved').checked;
  $('import-save').disabled = writing || loading || !imported || !$('import-approved').checked;
  $('again').disabled = $('got-it').disabled = writing || loading;
  $('reload').disabled = writing || loading;
  $('edit').disabled = writing || !saved;
}
function discardDraft() { sourceVersion++; draft = null; $('review').hidden = true; $('approved').checked = false; buttons(); }
$('notes').addEventListener('input', () => { $('count').textContent = $('notes').value.length; discardDraft(); });
$('title').addEventListener('input', () => { $('approved').checked = false; buttons(); });
$('approved').addEventListener('change', buttons);
$('import-approved').addEventListener('change', buttons);
function renderReview() {
  $('cards').replaceChildren(); $('review').hidden = !draft; $('approved').checked = false;
  if (!draft) return;
  draft.cards.forEach((card, index) => {
    const article = document.createElement('article'); article.className = 'card';
    const heading = document.createElement('h3'); heading.textContent = `Card ${index + 1}`; article.append(heading);
    for (const [key, caption, max] of [['question', 'Question', 500], ['answer', 'Answer', 1500], ['quote', 'Exact source excerpt', 1500]]) {
      const label = document.createElement('label'); const input = document.createElement('textarea');
      input.id = `${card.id}-${key}`; label.htmlFor = input.id; label.textContent = caption;
      input.value = card[key]; input.maxLength = max; input.rows = key === 'question' ? 2 : 3;
      input.addEventListener('input', () => { sourceVersion++; card[key] = input.value; $('approved').checked = false; buttons(); });
      article.append(label, input);
    }
    const remove = document.createElement('button'); remove.className = 'secondary'; remove.textContent = `Delete card ${index + 1}`;
    remove.addEventListener('click', () => { sourceVersion++; draft.cards = draft.cards.filter(c => c.id !== card.id); renderReview(); const next = $('cards').querySelector('textarea'); (next || $('notes')).focus(); });
    article.append(remove); $('cards').append(article);
  });
  if (!draft.cards.length) { const p = document.createElement('p'); p.textContent = 'All draft cards deleted. Generate another draft; the saved deck is unchanged.'; $('cards').append(p); }
  buttons();
}
function renderStudy() {
  $('study').hidden = !saved; $('study-empty').hidden = Boolean(saved); $('export').hidden = !saved; $('answer-area').hidden = true; $('reveal').hidden = false;
  if (saved) {
    const index = saved.cards.findIndex(c => c.id === saved.currentCardId), card = saved.cards[index], p = saved.progress[card.id];
    $('study-title').textContent = saved.title; $('study-position').textContent = `Card ${index + 1} of ${saved.cards.length}`;
    $('question').textContent = card.question; $('answer').textContent = card.answer; $('quote').textContent = card.quote;
    $('progress').textContent = `This card: Again ${p.again} · Got it ${p.gotIt}. Total marks: ${Object.values(saved.progress).reduce((n, x) => n + x.again + x.gotIt, 0)}.`;
  }
  buttons();
}
function acceptState(result) { saved = result.deck; revision = result.revision; renderStudy(); }
async function reload() {
  if (loading || writing) return;
  loading = true; buttons();
  try {
    const result = await api('/api/state'); generation = result.generation; ready = true; acceptState(result);
    $('model-info').textContent = `${generation.model}. ${generation.stopped ? `Generation stopped: ${generation.stopped}` : generation.configured ? 'Local adapter configured. The pinned digest is checked before generation.' : 'Generation unavailable: start the server with explicit OLLAMA_URL. No sample cards will be substituted.'}`;
    status(saved ? 'Saved deck loaded. Study progress restored; any unsaved draft remains on screen.' : 'No saved deck yet. Paste notes to begin.');
  } catch (error) { status(error.message); } finally { loading = false; buttons(); }
}
$('reload').addEventListener('click', reload);
$('generate').addEventListener('click', async () => {
  if (generating || writing) return;
  const notes = $('notes').value;
  if (notes.length < 100 || notes.length > 6000 || !notes.trim()) { status('Paste 100–6000 characters of non-empty plain text. Your text is kept.'); $('notes').focus(); return; }
  const version = ++sourceVersion; generating = true; buttons(); status('Requesting local AI drafts. Existing saved data is unchanged.');
  try {
    const result = await api('/api/generate', { notes, count: Number($('card-count').value) });
    if (version !== sourceVersion || notes !== $('notes').value) { status('Discarded an outdated generation response because the source or draft changed.'); return; }
    draft = { notes, cards: result.cards }; renderReview();
    $('draft-info').textContent = `Draft from ${result.model}; ${(result.elapsedMs / 1000).toFixed(1)} seconds. Not saved.`;
    status('AI drafts ready for your factual review. Nothing saved yet.'); $('cards').querySelector('textarea')?.focus();
  } catch (error) { status(error.message); }
  finally { generating = false; buttons(); }
});
$('save').addEventListener('click', async () => {
  if (writing || loading || !draft || !$('approved').checked) return;
  // Approval owns this draft even if generation finishes before the save does.
  sourceVersion++;
  writing = true; buttons();
  const submittedDraft = draft;
  try {
    const result = await api('/api/approve', { revision, reviewed: true, title: $('title').value, notes: draft.notes, cards: draft.cards });
    acceptState(result);
    if (draft === submittedDraft) { discardDraft(); }
    status('Approved deck saved locally. Study progress starts at zero.'); $('reveal').focus();
  } catch (error) { status(error.message); } finally { writing = false; buttons(); }
});
$('edit').addEventListener('click', () => {
  if (!saved || writing) return;
  discardDraft(); $('notes').value = saved.notes; $('count').textContent = saved.notes.length; $('title').value = saved.title;
  draft = { notes: saved.notes, cards: structuredClone(saved.cards) }; renderReview(); $('draft-info').textContent = 'Editing a copy of the saved deck. Approval will replace it and reset progress.';
  $('cards').querySelector('textarea')?.focus();
});
$('reveal').addEventListener('click', () => { $('answer-area').hidden = false; $('reveal').hidden = true; $('again').focus(); });
async function rate(rating) {
  if (writing || loading || !saved || $('answer-area').hidden) return;
  writing = true; buttons();
  try { acceptState(await api('/api/rate', { revision, cardId: saved.currentCardId, rating })); status('Study mark saved. Next card ready.'); $('reveal').focus(); }
  catch (error) { status(error.message); } finally { writing = false; buttons(); }
}
$('again').addEventListener('click', () => rate('again'));
$('got-it').addEventListener('click', () => rate('gotIt'));
let importVersion = 0;
$('import-file').addEventListener('change', async () => {
  const version = ++importVersion; imported = null; $('import-preview').hidden = true; $('import-approved').checked = false; buttons();
  const file = $('import-file').files[0]; if (!file) return;
  try {
    if (file.size > 90_000) throw new Error('Import exceeds 90,000 bytes. Saved data is unchanged.');
    const value = JSON.parse(await file.text());
    if (version !== importVersion) return;
    if (!value || value.schemaVersion !== 1 || !Array.isArray(value.cards)) throw new Error('Choose a version 1 Note Cards export.');
    imported = value; $('import-title').textContent = 'Review import: ' + String(value.title || 'Untitled');
    $('import-text').textContent = JSON.stringify(value, null, 2); $('import-preview').hidden = false;
    status('Import preview only. The server validates all fields when you explicitly import.');
  } catch (error) { status(error instanceof SyntaxError ? 'File is not valid JSON. Saved data is unchanged.' : error.message); } finally { buttons(); }
});
$('import-save').addEventListener('click', async () => {
  if (writing || loading || !imported || !$('import-approved').checked) return;
  writing = true; buttons(); const candidate = imported;
  try {
    acceptState(await api('/api/import', { revision, reviewed: true, deck: candidate }));
    if (candidate === imported) { imported = null; $('import-preview').hidden = true; $('import-file').value = ''; }
    status('Imported deck and study progress saved. Your unsaved draft remains on screen.');
  } catch (error) { status(error.message); } finally { writing = false; buttons(); }
});
window.addEventListener('beforeunload', event => { if (draft || generating || writing) { event.preventDefault(); event.returnValue = ''; } });
reload();
