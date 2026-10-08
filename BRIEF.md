# Note Cards — frozen product brief

For a solo learner: turn your own pasted notes into a small editable deck, check each card against its source excerpt, study it and return to the saved deck. Local personal tool, not a hosted multi-account service.

Required path: paste 100–6000 characters of plain text -> request 3–6 AI draft cards -> inspect source excerpt and edit/delete cards -> explicitly save approved deck -> reveal answers and mark Again/Got it -> reload/restart and resume -> export and reimport versioned JSON. Source quotes must be exact substrings; a quote match is not proof the answer is correct. Show AI draft/review warning. Never silently substitute sample cards for live AI.

Use Node built-ins, plain HTML/CSS/JS, local Ollama via explicit OLLAMA_URL. Bind HTTP to loopback; data stored atomically in an explicit local directory, not shared services. No paid API, downloads, package upgrades, login, cloud, analytics, external uploads, images/audio/PDF parsing, multiplayer, spaced repetition claim or medical/legal study material. Local single-user boundary must be explicit. Reject untrusted cross-origin mutation requests; never render imported HTML.

Only existing public-parent model gemma4:26b-a4b-it-qat is eligible. Verify manifest digest before first request; one bounded generation at a time, no service/model configuration changes, no pull, no keep_alive changes. If resource/latency prevents use, preserve failure and stop that dependency; do not claim model success.

Original synthetic notes and manually reviewed sample deck may support deterministic tests, visibly labeled samples. They are not a substitute for actual AI acceptance. Model output varies.
