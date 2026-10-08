# Evidence provenance — CORRECTION-02

This is a new correction take after the original implementation and independent raw-material review. It is neither a replay nor an independent audit. Recording observations below come from the controller's supplied review findings; this take did not independently inspect the original cast.

| Evidence class | What is established | Limit |
| --- | --- | --- |
| Directly visible original commands | Original cast contains the initial npm test ERR_TEST_FAILURE and an actual loopback EPERM failure. | These establish failures, not browser or model acceptance. |
| Author transcription / later files | The direct `node test/app.test.js` 6 passed / 3 failed diagnostic is described at cast 464.156s and in later transcript material; the npm start failure is also described/saved later. | Their original execution blocks were not found in the available stream. Do not claim they never ran; do not present later text as original stdout captured there. |
| Preserved first-take result files | Existing `evidence/*.txt` files retain their original bytes, including `npm-test-final.txt` with 13/13. | A saved result is not by itself proof that its execution block is visible in the cast. The 13/13 checkpoint is deterministic, with browser/live model NOT_TESTED. |
| Current new diagnostic runs | `correction-02-red.txt`: UI suite before production fix, exit 1, 5/10 pass. `correction-02-green.txt`: npm test after fix, exit 0, 19/19 pass. | Injected DOM/provider and in-process checks only; no browser, live AI or socket success inferred. |

The report's original bytes and pre-correction versions of every modified existing file are preserved under `evidence/first-take-archive/`. Treat that archive as immutable: later corrections must add new artifacts rather than revise it. The current report corrects attribution without rewriting the first take.

No original recording, stdout, timing or evidence file was edited or reconstructed. Future reproductions of the 6/3 diagnostic or startup failure must be labeled **new runs**, with their own command, result and environment. They cannot fill a missing historical execution block. Known socket restrictions were not retried here.

Current help/syntax/integrity checks are documented in `CORRECTION-REPORT.md` and `evidence/correction-02-checks.txt`. The future film plan in `EDITOR-NOTES.json` is not an executed montage or release approval.
