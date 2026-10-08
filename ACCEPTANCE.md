# Acceptance plan — not results

NC01 Clean folder: documented Node runtime; npm ci --ignore-scripts --no-audit --no-fund with a zero-dependency lockfile; npm test; start and use real browser.
NC02 Input bounds and empty notes errors preserve user text.
NC03 Actual pinned local model returns 3–6 schema-valid draft cards from original notes; exact source excerpt validation, editable review before approval. Record request, bounded timing, response and manual factual check without reasoning stream.
NC04 Malformed/model timeout/offline results are actionable; no hidden fallback or lost saved data.
NC05 Edit/delete then explicit approval persists only reviewed cards; changing source during generation cannot overwrite newer state.
NC06 Reveal and Again/Got it update the correct card; saved progress survives page reload and server restart.
NC07 Versioned JSON export/import round trip preserves notes/cards/progress. Reject invalid/oversized imports atomically.
NC08 Script-looking text is inert; path traversal and cross-origin writes rejected; loopback binding verified.
NC09 Empty deck, duplicate clicks, stale generation response, non-JSON response and disk write failure leave recoverable state.
NC10 Desktop 2560x1440/tablet/phone main path, keyboard labels/focus and long text; readable complete commands and output in capture.
NC11 Independent reviewer later follows exact video plus promised kit in clean directory; missing steps reported. Author tests do not satisfy independent acceptance.

No accounts are offered, so account separation is not applicable; network hosting is out of scope. Do not present this as production-ready.
