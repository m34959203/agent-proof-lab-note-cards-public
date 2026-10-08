# Note Cards — companion v1, documentation and fixture revision 1.2

For public reproduction instructions, see [Build from the supplied prompt](BUILD-FROM-PROMPT.md): create source from the original prompt or run this finished checkpoint. See [CORRECTION-02](CORRECTION-REPORT.md) and [evidence provenance](EVIDENCE-PROVENANCE.md) for new results and historical limits.

Paste your own notes, request 3–6 local AI drafts, check their source excerpts, edit/delete cards, explicitly approve one saved deck, reveal answers and mark Again/Got it, then export or reimport your notes and progress.

Current candidate scope is recorded in [the dated review addendum](CURRENT-REVIEW-SCOPE.md); historical PASS does not approve this revision.

This kit accompanies **Build a Local AI Flashcard App from Your Notes with Codex**. An independent AI reviewer reproduced the main finished-checkpoint journey on 2026-10-01: one real pinned-model generation, review/edit/delete, save/study, reload/restart, and export/import with byte-identical exports. Creating new application code from the adapted prompt recipe was **not independently run**. Read [review scope](REVIEW-SCOPE.md) before interpreting that result. This is a local personal tool, not production-ready software.

The original coding sandbox returned `EPERM` for loopback. Later producer recordings and the independent permitted-server run are separate observations, not a repair of that historical failure. See [verification and limits](VERIFICATION.md), [environment](ENVIRONMENT.md) and [actual prompts](PROMPTS.md). Public hosting and final release metadata are not approved by these product checks.

Revision 1.2 adds the historical import fixture and explicit no-model instructions. Application code, tests, frozen inputs, prompts and historical review evidence remain byte-identical to revision 1.1. The download basename remains `note-cards-companion-v1.tar.gz`, as named by the lesson. The revision label and CHECKSUMS.json distinguish this kit from the earlier candidate; do not assume archives with the same basename have the same bytes.

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

For the documented no-model walkthrough below, start without generation:

```bash
NOTE_CARDS_DATA_DIR="$PWD/.local-data" OLLAMA_URL='' npm start
```

Missing `NOTE_CARDS_DATA_DIR` is a startup error. Missing `OLLAMA_URL` disables generation with an explanation. It never loads sample cards as a fallback.

## No-model walkthrough: use the supplied historical deck

This route runs the finished source checkpoint and imports `fixtures/deck-export.json`. It does **not** create application code or reproduce AI generation. No Ollama service, model, account or credential is needed for this route. The app does not load this file automatically; you choose it and approve replacement.

1. From the extracted kit folder, run the Path B startup commands with `OLLAMA_URL=''`. Open `http://127.0.0.1:3210` on the same computer. A fresh data directory starts with no saved deck and generation unavailable. Keep only one server process using that directory.
2. In **Return with an exported deck**, choose `fixtures/deck-export.json` from this kit. Inspect the preview title, notes, three cards, exact quotes and existing study progress. Check **I reviewed the imported notes, cards and progress.**, then select **Import and replace saved deck**. This replaces the single saved deck.
3. The saved deck starts on “How long does the build round last?” Select **Reveal answer**, then **Got it**. The answer is “Twelve minutes.” The app advances to the materials question. Reload the page; the current question and counters persist. The starting sample already has one Again on its first card and one Got it on its second card; these are historical demonstration progress, not your own activity.
4. Select **Edit saved deck**. In Card 1's answer, remove only ` (From the workshop notes.)`, leaving `Six sheets of card, a ruler, and removable tape.` Changes clear review approval. The saved copy remains separate until you check **I checked every remaining question, answer and source excerpt.** and select **Save approved deck**. Saving the edited deck resets study counters. Reload to check that the edited answer persists (select **Reveal answer** if needed).
5. Select **Export JSON** and keep the downloaded file. Choose that downloaded file in the import area, review it, check the import confirmation and select **Import and replace saved deck**. Export again and compare the JSON contents: notes, cards, progress and current card should agree. Keep the supplied fixture and your downloaded export distinct; your browser may add a suffix to the download filename.
6. For the failure check, create a plain-text file named `invalid.json` containing only `{invalid`. Choose it in the import area. The app reports that the file is not valid JSON. Reload saved state and export again: the previously saved deck remains unchanged. Do not approve replacement from an invalid preview.
7. Stop the server with Ctrl+C. Repeat the same startup command and data directory to confirm the saved deck resumes. No new model call is part of any of these steps.

The supplied deck is the exact historical export imported in the film's later controlled walkthrough, with original synthetic workshop notes and three historically generated cards. Its answer ending and counters are intentionally preserved so the depicted edit is repeatable. The random card IDs are application identifiers, not personal identities. See [fixture origin](fixtures/DECK-ORIGIN.json) for the hash and retained scope. Importing these historical bytes is not evidence that generation works on a different machine or that model output is always correct.

## The complete journey

1. Enter a title and paste 100–6000 characters of plain-text notes. The app measures JavaScript string length (UTF-16 code units). Whitespace-only notes are rejected. Original fictional workshop notes are in `fixtures/workshop-notes.txt`; they are clearly marked SAMPLE and contain no personal data.
2. Choose 3–6 drafts and select **Generate AI draft**. The installed model digest is checked before each generation. A request may take up to 120 seconds total. The output must contain 3–6 valid cards; the requested count is a prompt preference within that range. Historical live results are described in VERIFICATION.md; test cards are synthetic fixtures.
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

Timeout, transport/HTTP error, oversized provider response or digest mismatch stops that adapter instance until the app is restarted. Preserve the failure before any later retry. Do not change the shared model/service to make this milestone pass. Malformed JSON/schema/quotes return an actionable error and no new drafts. Two historical calls succeeded on the producer server; minimum hardware, broad output quality and ordinary laptop performance remain unverified. An HTTP 400 for unsupported options is a failure, not success.

## Tests and next gates

```bash
npm test
npm run test:loopback
```

`npm test` uses Node's `node:test` with process isolation disabled and **no sockets**. It covers domain rules, the real request handler with injected request/response streams, filesystem persistence/recovery, the Ollama adapter with injected fetch responses, and UI event/state logic through a small injected DOM. Fixtures are manually authored synthetic cards in test code, not model results. The UI harness is not a browser, layout engine or accessibility audit.

`npm run test:loopback` uses a real bound server and actual local HTTP requests. It is deliberately separate. The original coding sandbox **failed with EPERM**; a later permitted server clean-copy check passed. See VERIFICATION.md for dated scopes. Do not interpret deterministic tests as socket or model acceptance. The files in `evidence/` and IMPLEMENTATION-REPORT.md describe their historical checkpoints.

Verification recipe for a new run (historical completed checks and open scopes are in VERIFICATION.md):

1. In a permitted clean local directory, repeat the runtime/install/test commands and `npm run test:loopback`. Start the app with the explicit environment variables. Record the listener address and browser URL.
2. Paste the original sample notes, request 3–6 cards and capture the `/api/generate` request, elapsed time, response or failure in browser Network tools. The success response includes model, digest and elapsedMs. The app does not store a hidden inference log. Do not capture a reasoning stream. Manually check every answer and exact quote. Stop the live-model gate if resource/latency prevents generation; preserve the failure and do not substitute test fixtures.
3. Edit an answer, delete a card, approve and save. Reveal/mark both ratings, reload, stop/restart and verify the exact counters/current card. Export and reimport; compare notes/cards/progress.
4. Test empty/99/100/6000/6001-character input, all-card deletion, repeated clicks, changing notes during generation, malformed/oversized import, inert script-looking text, stale tabs and write failure. Observe the user text and previous saved deck remain recoverable.
5. At 2560×1440, tablet and phone sizes, complete the journey with long text. Test keyboard-only labels, visible focus, answer reveal focus, readable errors and screen-reader status announcements. Capture any layout or accessibility defects.
6. A separate reviewer follows the exact recording and kit without author guidance. Missing steps are failures. Author checks cannot close NC11.

This kit contains source, frozen inputs, prompts, sanitized historical test evidence and instructions. It excludes Git history, private capture infrastructure, raw agent streams, credentials and private saved user data. The explicitly identified synthetic historical demonstration deck is supplied in fixtures/. CHECKSUMS.json identifies the exact files. The 16:09.4 finished-film candidate and the original v1 kit were used for independent finished-checkpoint reproduction. That bounded result is not full new-code reproduction, continuous audiovisual review, or publication approval; see REVIEW-SCOPE.md.
