# Correction report — CORRECTION-02

This is a new implementation correction after the original build and independent raw-material review. It is not a replay, independent audit, completed film or release approval.

## Changes

TECH-01: card field edits and deletions now advance the generation version. Save submission also advances it before awaiting persistence, covering either completion order. Editing remains available during generation. A failed save retains the draft; pending generation cannot replace that approved snapshot. The injected harness respects disabled click/input/change controls and includes descendant `#cards button` selection.

NC10-TITLE-01: `overflow-wrap: anywhere` on import/study headings allows the full supported title to wrap. No truncation, clipping, global overflow hiding, scaling or limit/data changes. The controller's 390px and 1024px failures are input findings, not new measurements in this take.

EDU-01–03: added public reproduction instructions with separate empty-source and finished-checkpoint paths; clarified original Codex CLI use and historical evidence attribution. Preserved the original report and all other modified-file originals in an immutable-by-policy archive.

M1–M5: added a compact future edit plan for labeled source walkthroughs, readable inserts, the 153.327-second quiet interval, honest final-test limitations and Bash/PTY/automated-input disclosure. The recording itself is unchanged.

## Exact file inventory

Modified existing files:

- `public/app.js`
- `public/style.css`
- `test/ui.test.js`
- `README.md`
- `IMPLEMENTATION-REPORT.md`

Added documentation and evidence:

- `BUILD-FROM-PROMPT.md`
- `EVIDENCE-PROVENANCE.md`
- `EDITOR-NOTES.json`
- `CHANGELOG.md`
- `CORRECTION-REPORT.md`
- `evidence/correction-02-red.txt`
- `evidence/correction-02-green.txt`
- `evidence/correction-02-checks.txt`
- `evidence/first-take-archive/public/app.js`
- `evidence/first-take-archive/public/style.css`
- `evidence/first-take-archive/test/ui.test.js`
- `evidence/first-take-archive/README.md`
- `evidence/first-take-archive/IMPLEMENTATION-REPORT.md`

All file edits used apply_patch. No rebuild, dependency changes, downloads, commits, history deletion, agents, nested model sessions, credentials/auth changes, service/scheduling changes, publication or external messages. `prompts/BUILD-01.txt` was supplied by the controller and only read. Frozen inputs and seven original evidence files passed unchanged SHA-256 checks. Five archived originals matched their pre-edit contents; the original report hash also matched byte-for-byte.

## Actual commands and outcomes

| Command/check in this take | Result |
| --- | --- |
| `node --experimental-test-isolation=none --test test/ui.test.js` before production patch | Exit 1: 5 passed, 5 failed, 0 skipped. Four existing tests and approval-first regression passed; question/answer/quote edits, deletion and generation-first save regression failed. Preserved separately in red evidence. |
| `npm test` after patch | Exit 0: 19 passed, 0 failed, 0 skipped. All 13 existing tests plus six regressions passed. Full output in green evidence. |
| `node --check public/app.js` | Exit 0; no syntax output. |
| `node --version`; `npm --version` | v22.22.1; 10.9.4. |
| `codex exec --help` | Exit 0; help displayed. Read-only PATH-alias warning. No coding/model session invoked. Generic config syntax is documented; individual config effects were not runtime-tested. |
| `python3 -` integrity/JSON/Bash check; embedded `bash -n` on each guide Bash block | Exit 0: frozen/evidence hashes match, editor JSON parses, both Bash blocks parse. Commands were not executed. |
| `python3 -` archive comparison | First attempt failed from a script syntax error, followed by a JSON parse error in the orchestration. Corrected new attempt succeeded: all five archived contents match pre-edit reads. |
| `git diff --check` | Exit 0. Limited usefulness because original implementation files are untracked relative to the supplied Git baseline; not counted as source acceptance. |
| `rg -n 'sourceVersion\\+\\+\|import-title, #study-title\|pending regeneration' public/app.js public/style.css test/ui.test.js` | Located the three invalidation changes, title rule and regression cases. |

Read-only discovery used pwd, ls, rg, cat, git status and sha256sum. Initial non-hidden rg found no files (exit 1); the explicit hidden-file listing succeeded. A cat glob for empty .agents/.codex directories returned no matching files. These are not acceptance checks.

## Remaining gates

- Actual browser verification of the corrected exact source: supported unbroken 120-character title in import preview and saved study at 390px, 1024px and desktop; check document/container widths and complete title visibility/data round trip. Verify keyboard/accessibility and pending regeneration interactions in a real browser.
- Live pinned-model generation, actual socket binding, browser reload and process restart remain outside this take. Known socket restrictions were not retried.
- New exact-version independent source and teaching/reproduction reviews remain pending. Guide review here was author syntax/content checking only; no end-to-end Codex reproduction was run.
- Later walkthrough captures, readable inserts, time-skip edit, final media review and release approval remain pending.

Previous source acceptance is not converted into independent PASS. A missing browser, teaching or media result remains missing.
