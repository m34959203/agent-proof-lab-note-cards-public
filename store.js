import { mkdir, readFile, open, rename, unlink } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppError, MAX_BYTES, validateDeck } from './domain.js';
export async function atomicWrite(path, value) {
  const temp = `${path}.${randomUUID()}.tmp`;
  let file;
  try {
    file = await open(temp, 'wx', 0o600);
    await file.writeFile(JSON.stringify(value, null, 2) + '\n');
    await file.sync();
    await file.close(); file = null;
    await rename(temp, path);
  } finally {
    if (file) await file.close();
    await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
}
export async function createStore(directory, write = atomicWrite) {
  if (!directory || !isAbsolute(directory)) throw new Error('NOTE_CARDS_DATA_DIR must be an explicit absolute local directory.');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, 'deck.json');
  let state = { revision: 0, deck: null };
  try {
    const raw = await readFile(path);
    if (raw.length > MAX_BYTES) throw new Error('Saved file is oversized.');
    const parsed = JSON.parse(raw);
    if (!Number.isSafeInteger(parsed.revision) || parsed.revision < 0) throw new Error('Invalid saved revision.');
    state = { revision: parsed.revision, deck: validateDeck(parsed.deck) };
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Saved deck could not be read; file preserved. ${error.message}`);
  }
  let queue = Promise.resolve();
  return {
    get: () => structuredClone(state),
    change(revision, transform) {
      const task = queue.then(async () => {
        if (revision !== state.revision) throw new AppError('Saved deck changed. Reload the saved deck before trying again; your draft is still on screen.', 409);
        const deck = validateDeck(transform(structuredClone(state.deck)));
        const next = { revision: state.revision + 1, deck };
        try { await write(path, next); }
        catch { throw new AppError('Could not write the local deck. Check directory permissions and free space, then retry. Previous saved data is preserved.', 503); }
        state = next;
        return structuredClone(state);
      });
      queue = task.catch(() => {});
      return task;
    }
  };
}
