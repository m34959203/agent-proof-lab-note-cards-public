export const MAX_BYTES = 100_000;
export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const fail = message => { throw new AppError(message); };
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const keys = (x, allowed) => object(x) && Object.keys(x).every(k => allowed.includes(k));
const str = (x, min, max) => typeof x === 'string' && x.trim().length >= min && x.length <= max;
export function validateNotes(notes) {
  if (!str(notes, 1, 6000) || notes.length < 100) fail('Paste 100–6000 characters of non-empty plain-text notes. Your text has been kept.');
  return notes;
}
export function validateCards(cards, notes, draft = false) {
  if (!Array.isArray(cards) || cards.length < (draft ? 3 : 1) || cards.length > 6) fail(draft ? 'Model must return 3–6 cards. No drafts were accepted.' : 'Keep 1–6 reviewed cards; an empty deck cannot be saved.');
  const ids = new Set();
  return cards.map(card => {
    if (!keys(card, draft ? ['question', 'answer', 'quote'] : ['id', 'question', 'answer', 'quote'])) fail('Invalid card fields.');
    if (!str(card.question, 1, 500) || !str(card.answer, 1, 1500) || !str(card.quote, 1, 1500)) fail('Each card needs a question (≤500), answer (≤1500) and exact source excerpt (≤1500 characters).');
    if (!notes.includes(card.quote)) fail('A source excerpt is not an exact substring of the notes. Correct it before saving.');
    if (!draft && (!str(card.id, 1, 80) || !/^[\w-]+$/.test(card.id) || ids.has(card.id))) fail('Invalid or duplicate card ID.');
    ids.add(card.id);
    return draft ? { question: card.question, answer: card.answer, quote: card.quote } : { id: card.id, question: card.question, answer: card.answer, quote: card.quote };
  });
}
export function validateDeck(input) {
  if (!keys(input, ['schemaVersion', 'title', 'notes', 'cards', 'progress', 'currentCardId']) || input.schemaVersion !== 1) fail('Use a Note Cards JSON export with schemaVersion 1.');
  if (!str(input.title, 1, 120)) fail('Deck title must contain 1–120 characters.');
  const notes = validateNotes(input.notes);
  const cards = validateCards(input.cards, notes);
  const ids = cards.map(c => c.id);
  if (!ids.includes(input.currentCardId)) fail('Invalid current study card.');
  if (!object(input.progress) || Object.keys(input.progress).length !== ids.length || !Object.keys(input.progress).every(id => ids.includes(id))) fail('Progress must match the deck cards.');
  const progress = {};
  for (const id of ids) {
    const p = input.progress[id];
    if (!keys(p, ['again', 'gotIt', 'last']) || !Number.isSafeInteger(p.again) || p.again < 0 || p.again > 1_000_000 || !Number.isSafeInteger(p.gotIt) || p.gotIt < 0 || p.gotIt > 1_000_000 || ![null, 'again', 'gotIt'].includes(p.last)) fail('Invalid study progress.');
    Object.defineProperty(progress, id, { value: { again: p.again, gotIt: p.gotIt, last: p.last }, enumerable: true });
  }
  const deck = { schemaVersion: 1, title: input.title, notes, cards, progress, currentCardId: input.currentCardId };
  if (Buffer.byteLength(JSON.stringify(deck), 'utf8') > 90_000) fail('Deck exceeds the 90,000-byte export/import limit. Shorten notes or cards.');
  return deck;
}
