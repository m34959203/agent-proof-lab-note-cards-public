# Note Cards — first local milestone

For public reproduction instructions, see [Build from the supplied prompt](BUILD-FROM-PROMPT.md): create source from the original prompt or run this finished checkpoint. See [CORRECTION-02](CORRECTION-REPORT.md) and [evidence provenance](EVIDENCE-PROVENANCE.md) for new results and historical limits.

Paste your own notes, request 3–6 local AI drafts, check their source excerpts, edit/delete cards, explicitly approve one saved deck, reveal answers and mark Again/Got it, then export or reimport your notes and progress.

**Live inference: NOT_TESTED. Real browser acceptance: NOT_TESTED. Independent acceptance: NOT_TESTED.** This recorded implementation environment denies even loopback sockets (`EPERM`). Deterministic tests inject a provider; none of their cards are evidence of model success. This is a local personal milestone, not production-ready software.

## Runtime and startup

Tested interpreter: Node **v22.22.1**, npm **10.9.4**, Linux/Bash. No dependencies, build step, downloads or credentials. Windows commands are not verified.

From this product folder:

```bash
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm test
```

In an environment permitting loopback sockets, start with an explicit absolute data directory and the **already running** local Ollama service:

```bash
NOTE_CARDS_DATA_DIR="$PWD/.local-data" \
OLLAMA_URL="http://127.0.0.1:11434" \
npm start
```

Open **http://127.0.0.1:3210** in a browser on that computer. Use that address exactly, not `localhost`. Optional `PORT` accepts 1024–65535. Stop with Ctrl+C; repeat the same command and data directory to resume. Run only one Note Cards process per data directory. No service setup, model pull or configuration change is performed by the app.

For saved-deck study/import without generation:

```bash
NOTE_CARDS_DATA_DIR="$PWD/.local-data" OLLAMA_URL='' npm start
```

Missing `NOTE_CARDS_DATA_DIR` is a startup error. Missing `OLLAMA_URL` disables generation with an explanation. It never loads sample cards as a fallback.

## The complete journey

1. Enter a title and paste 100–6000 characters of plain-text notes. The app measures JavaScript string length (UTF-16 code units). Whitespace-only notes are rejected. Original fictional workshop notes are in `fixtures/workshop-notes.txt`; they are clearly marked SAMPLE and contain no personal data.
2. Choose 3–6 drafts and select **Generate AI draft**. The installed model digest is checked before each generation. A request may take up to 120 seconds total. The output must contain 3–6 valid cards; the requested count is a prompt preference within that range. No live output is bundled.
3. Review each question, answer and exact source excerpt against the notes. An exact substring match proves only that the excerpt exists, not that an answer is correct. Edit fields or delete cards. Keep 1–6 cards. Changes clear the approval checkbox. Card edits/deletions invalidate pending generation while keeping editing available. Saving also invalidates pending generation. Changing notes invalidates the draft and any response still in flight.
4. Check the review confirmation and select **Save approved deck**. This explicitly replaces the single saved deck and resets study progress. Drafts are not persisted automatically. Text remains on screen after validation or write errors; a tab close can lose unsaved notes/drafts.
5. Select **Reveal answer**, then **Again** or **Got it**. The mark is persisted before advancing. Cards cycle in order; counters do not implement spaced repetition. Reload the page or restart the app with the same directory to resume at the saved current card. **Edit saved deck** makes a review copy; the saved deck remains intact until approval.
6. **Export JSON** downloads schema version 1 with title, notes, card IDs, questions, answers, quotes, per-card counters/last mark and current card. Choose that file in the import area, inspect the complete text preview, confirm review and explicitly replace the saved deck. Import preserves exported progress.

Keep the browser tab open until a save completes. On a conflict, select **Reload saved deck** to obtain the current revision, then decide whether to save your still-visible draft over it. If the server saves a request but its response is lost, reload saved state before retrying. Duplicate or stale mutation revisions cannot silently apply twice.

## Local boundaries and storage

- HTTP binds only `127.0.0.1`. Host must match the bound app address; mutations require that exact Origin. Cross-site fetch metadata is rejected. There is no CORS allowance. This is not an authentication boundary against other local programs/users.
- Anyone using this local app can access its single saved deck. Use your own non-sensitive notes. Do not use medical/legal study material. There are no accounts, analytics, external uploads, hosted sharing or remote API clients.
- Only a literal loopback HTTP origin is accepted for `OLLAMA_URL` (`127.0.0.1` or IPv6 `::1`). Redirects are rejected. No external calls are needed. Notes are sent to that configured local Ollama process when generation is requested.
- `deck.json` is written through a same-directory, exclusive temporary file, flushed, then atomically renamed. Memory updates only after the write succeeds. New directories/files request modes 0700/0600; existing directory permissions are not changed. Crash leftovers are not treated as saved decks. Corrupt saved data stops startup and is preserved for recovery.
- Atomic replacement is not a backup or a promise of recovery after hardware failure. Export copies yourself. Keep the data directory on a local filesystem and do not share it between server processes.
- JSON request limit: 100,000 bytes. Export/import deck limit: 90,000 UTF-8 bytes. Title ≤120 characters, question ≤500, answer/excerpt ≤1500; unique card IDs, exact excerpts and valid counters are checked. Invalid imports cannot partially replace a deck. Unknown deck/card/progress fields are rejected.
- Text is assigned through DOM `textContent`/form values, never HTML. Static assets use fixed routes; no user-supplied file path is resolved. A restrictive content security policy blocks inline script and remote content.

## Local model contract and failures

The only eligible model is `gemma4:26b-a4b-it-qat`, pinned by the supplied `manifest.json` to:

```text
2dd70431afed94dd3688d790443768c1487ed086b57147ff083851116ae4c4e4
```

The adapter reads `/api/tags` and matches that model's full manifest digest before `/api/generate`. One generation at a time, total timeout 120 seconds, at most 1400 output tokens, non-streaming JSON, `think: false`. Neither reasoning streams nor a `keep_alive` override are requested. Tag response limit is 1 MB; generation response limit is 100 KB. There is no pull, fallback model, paid API, service change or automatic retry.

Timeout, transport/HTTP error, oversized provider response or digest mismatch stops that adapter instance until the app is restarted. Preserve the failure before any later retry. Do not change the shared model/service to make this milestone pass. Malformed JSON/schema/quotes return an actionable error and no new drafts. Ollama compatibility, latency, resource use and factual output quality remain unverified; an HTTP 400 for unsupported options is a failure, not success.

## Tests and next gates

```bash
npm test
npm run test:loopback
```

`npm test` uses Node's `node:test` with process isolation disabled and **no sockets**. It covers domain rules, the real request handler with injected request/response streams, filesystem persistence/recovery, the Ollama adapter with injected fetch responses, and UI event/state logic through a small injected DOM. Fixtures are manually authored synthetic cards in test code, not model results. The UI harness is not a browser, layout engine or accessibility audit.

`npm run test:loopback` uses a real bound server and actual local HTTP requests. It is deliberately separate and currently **fails with EPERM** in this sandbox. Do not interpret the passing deterministic suite as passing it. See `evidence/` and `IMPLEMENTATION-REPORT.md` for preserved results.

Later recorded checks, with no installs or shared-service changes:

1. In a permitted clean local directory, repeat the runtime/install/test commands and `npm run test:loopback`. Start the app with the explicit environment variables. Record the listener address and browser URL.
2. Paste the original sample notes, request 3–6 cards and capture the `/api/generate` request, elapsed time, response or failure in browser Network tools. The success response includes model, digest and elapsedMs. The app does not store a hidden inference log. Do not capture a reasoning stream. Manually check every answer and exact quote. Stop the live-model gate if resource/latency prevents generation; preserve the failure and do not substitute test fixtures.
3. Edit an answer, delete a card, approve and save. Reveal/mark both ratings, reload, stop/restart and verify the exact counters/current card. Export and reimport; compare notes/cards/progress.
4. Test empty/99/100/6000/6001-character input, all-card deletion, repeated clicks, changing notes during generation, malformed/oversized import, inert script-looking text, stale tabs and write failure. Observe the user text and previous saved deck remain recoverable.
5. At 2560×1440, tablet and phone sizes, complete the journey with long text. Test keyboard-only labels, visible focus, answer reveal focus, readable errors and screen-reader status announcements. Capture any layout or accessibility defects.
6. A separate reviewer follows the exact recording and kit without author guidance. Missing steps are failures. Author checks cannot close NC11.

The review kit is this whole product folder excluding `.git`, `.local-data`, temporary test directories and any `node_modules`: the frozen inputs, source files, public assets, fixtures, tests/checks, package/lockfile, README, report and evidence. The surrounding recording and independently captured live-model results must be supplied by the outer worker; this code does not manufacture them.
