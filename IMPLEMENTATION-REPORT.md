# Implementation report — Note Cards

Status: CORRECTION-02 author implementation update; **19 deterministic tests pass in a new run**. The historical checkpoint recorded 13 passing deterministic tests. Actual live inference, corrected browser acceptance, real restart acceptance and new exact-version independent review remain **NOT_TESTED** in this take. Historical socket failures remain failures; no retry was made here. See [provenance](EVIDENCE-PROVENANCE.md) and [correction report](CORRECTION-REPORT.md). The original report bytes are preserved in `evidence/first-take-archive/IMPLEMENTATION-REPORT.md`.

## Scope and actual changes

The initial product folder contained only `BRIEF.md`, `ACCEPTANCE.md` and `manifest.json`. These supplied inputs remain unchanged. Implementation ran in Codex CLI, sequentially in this product folder, without spawning additional/nested coding CLIs or agents. No application live-model calls, credential/auth changes, added dependencies, third-party source/media, service changes, publication, external messages or commits were performed.

- Added a zero-dependency private Node package and lockfile, plain HTML/CSS/JS UI, Node HTTP server, domain validation, atomic local deck store and bounded Ollama adapter.
- Implemented notes bounds, 3–6 draft requests, editable exact excerpts, delete, explicit review approval, one saved deck, answer reveal, Again/Got it, current-card/counter persistence, saved-deck editing, versioned JSON export and reviewed import.
- Draft approval resets progress; importing an export preserves progress. Deleting all draft cards leaves an unsavable empty draft and the previous saved deck intact.
- Added revision checks for all persisted mutations, one-generation concurrency, disabled duplicate UI operations, source-version protection against stale generation responses, and actionable error messages without sample fallback.
- Added loopback-only binding, strict Host/Origin checks, cross-site rejection, fixed asset routes, inert text rendering, CSP and size/schema validation. Storage uses exclusive temporary files, file sync, rename and memory update only after successful persistence.
- Added original fictional workshop notes and manually authored/checked test cards. Test outputs are labelled injected/synthetic, never represented as live inference. No sample deck is automatically loaded into the product.
- Added deterministic tests, a separately runnable actual-loopback check, README startup/journey/recovery instructions and the evidence files below.

The adapter checks the exact model name and manifest digest supplied in `manifest.json` via `/api/tags` before every generation. It requests non-streaming structured JSON with `think: false`, at most 1400 output tokens and a 120-second total deadline including digest verification. It has one concurrent generation slot, bounded response sizes, no `keep_alive`, no pulls and no retry. Transport/resource/digest failures stop generation until app restart. Schema/JSON/quote errors produce no new drafts. Actual Ollama compatibility and inference are not inferred from injected tests.

## Commands and observed results

The following table retains the first-take author's command/result record (Linux/Bash, Node v22.22.1 and npm 10.9.4). It is not a claim that every execution block was independently located in the cast. The controller confirmed directly visible initial npm-test and loopback failures; the direct-node and startup entries below are author transcription/later files. Current new runs are listed separately in CORRECTION-REPORT.md.

| Command | Actual result |
| --- | --- |
| `pwd`, `rg --files`, `cat BRIEF.md ACCEPTANCE.md manifest.json`, `git status --short` | Confirmed supplied three-file empty-code baseline; initial status clean. |
| `node --version`, `npm --version` | v22.22.1 / 10.9.4. |
| `node --check server.js`, `node --check public/app.js` | Initial syntax checks passed. |
| `npm ci --ignore-scripts --no-audit --no-fund` | Passed; up to date, no dependencies downloaded. |
| Initial `npm test` (`node --test`) | Failed: ERR_TEST_FAILURE at test-file level, no individual detail. Preserved in recording and transcribed `evidence/initial-failures.txt`. |
| `node test/app.test.js` | Author transcription: 6 passed, 3 failed, attributed to loopback EPERM; described at cast 464.156s/later files. Original execution block not found in available stream; not reconstructed here. |
| `npm test` after in-process request-handler injection | 9 passed, 0 failed. Output: `evidence/npm-test.txt`. |
| `npm run test:loopback` | 0 passed, 1 failed: `listen EPERM: operation not permitted 127.0.0.1`. Output: `evidence/loopback-test.txt`. |
| `npm test` with first UI harness | 9 passed, 4 failed. Harness incorrectly parsed the absent body of GET requests. `evidence/ui-harness-first-failure.txt`. |
| `npm test` after GET harness correction | 12 passed, 1 failed. Harness omitted heading elements; asynchronous rating completion also needed to be awaited. `evidence/ui-harness-second-failure.txt`. |
| `npm test` after harness fixes | **13 passed, 0 failed, 0 skipped**. `evidence/npm-test-final.txt`. |
| `NOTE_CARDS_DATA_DIR="$PWD/.local-data" OLLAMA_URL='' npm start` | Later author record reports exit 1 and `listen EPERM: operation not permitted 127.0.0.1:3210` in `evidence/start-attempt.txt`. Original execution block not found in available stream. This is not a current rerun or independently located original stdout. |

The test script now uses `node --experimental-test-isolation=none --test test/*.test.js`. In-process route tests call the exact production handler using injected streams and response objects; persistence tests use real temporary files inside this product folder. The adapter uses injected fetch responses. UI tests execute the actual browser script through a small DOM harness. These adaptations allow deterministic testing under the restriction; they do not establish real socket/browser success.

## Acceptance evidence and remaining gaps

| Acceptance | Evidence / current limit |
| --- | --- |
| NC01 | Runtime, zero-dependency install and deterministic suite passed. Actual server listen failed EPERM; browser use NOT_TESTED. |
| NC02 | Bounds validated; injected UI test preserves invalid source. Real-browser boundaries pending. |
| NC03 | Pinned adapter and injected output/schema/excerpt validation tested. **Actual generation and manual model-answer correctness NOT_TESTED**. |
| NC04 | Injected timeout, offline, digest mismatch, incomplete/non-JSON/schema/oversized model responses tested; no fallback. Live failure UX pending. |
| NC05 | New regressions cover pending regeneration followed by question/answer/quote edits, deletion and both save/generation completion orders. All pass after correction. Author injected harness only. |
| NC06 | Correct card marks/revisions/counters and reload from a fresh store instance tested. Actual page reload and process stop/restart in browser pending. |
| NC07 | Export/import round trip with notes/cards/progress tested; malformed/oversized imports preserve previous state. Browser download/file picker pending. |
| NC08 | Handler tests reject Host/Origin/path attacks; DOM text-only sinks and CSP present. Actual loopback runtime check failed EPERM; browser script inertness pending. |
| NC09 | Empty decks, duplicate mutation revisions/clicks, stale generation, non-JSON and injected disk write failure tested. Actual disk-full and browser recovery pending. |
| NC10 | Controller reports a supported unbroken 120-character title overflow at 390px (document 1716px, title 1681px) and 1024px. CORRECTION-02 adds wrapping to import/study titles. Corrected real viewport, keyboard and assistive-technology checks remain **NOT_TESTED** here. |
| NC11 | **Independent acceptance NOT_TESTED**. README specifies review kit and later steps. Author tests are not an independent review. |

## Limitations and next recorded checks

Only one saved deck and one process per local data directory are supported. Unsaved drafts are in browser memory; closing the tab can lose them. Exact quotes are not factual verification. No actual model output has been produced, bundled or claimed. Model support for request options, latency and resource availability must be measured locally later. HTTP/resource failures disable generation for that app lifetime. A lost response after successful persistence requires reloading saved state; revision checks prevent blind duplicate application.

Atomic rename protects against partial replacement during ordinary write failures, not hardware loss; users should export backups. Corrupt saved files stop startup and are preserved. This is a local single-user boundary, not authentication against local programs/users. No remote hosting, multiple writers, spaced repetition, medical/legal material or production readiness is offered. Windows is unverified.

The outer worker should follow README's exact commands in the permitted local environment, record actual loopback binding and the browser journey, capture one pinned model request/timing/response without reasoning stream, and manually check every answer. If resource/latency prevents use, preserve the failure and stop that dependency; do not replace it with test cards. Then verify edit/delete/approval, both ratings, browser reload, process restart, export/import, invalid inputs and recovery, 2560×1440/tablet/phone layouts and keyboard navigation. Supply the whole source/evidence kit plus the actual recording for a later independent reviewer.

Baseline and prior evidence are preserved; no commit was made. The controller now supplies the historical launch identity: Codex CLI 0.153.4 with observed model gpt-6-astra. This is controller-provided provenance, not a model invocation or account-availability check in this take. Previous source acceptance is not converted into an independent PASS.
