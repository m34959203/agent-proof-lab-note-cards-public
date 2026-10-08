# Environment and costs

Captured application runtime: Linux x86_64 / Bash 5.2.21, Node 22.22.1, npm 10.9.4. Runtime dependencies: none; lockfile included. Browser verification used Chromium through Playwright 1.61.1. Production capture was an actual Bash PTY shown in a browser with automated input, not Windows Terminal, native PowerShell or manual typing. Windows viewer commands have not been validated by the producer.

The original and correction coding takes used Codex CLI 0.153.4 and observed gpt-6-astra through an existing ChatGPT subscription. An installed authorized CLI/account is needed only to regenerate source, not to run the supplied checkpoint. Claude was unavailable due to the recorded authorization restriction and was not used. No comparison or tool winner is claimed.

Generation requires an already-running local Ollama service and exactly gemma4:26b-a4b-it-qat, digest `2dd70431afed94dd3688d790443768c1487ed086b57147ff083851116ae4c4e4`. Observed installed artifact size: 15,634,199,946 bytes. The adapter checks the digest, uses one request slot, a 120-second total timeout and at most 1400 output tokens. No model download, fallback provider or service configuration is included.

Read-only host observation during companion preparation: Intel Core i9-13900KF; Linux reports 131,687,468 kB total RAM. These identify the production host, not minimum requirements or available inference memory. A read-only NVIDIA query failed to communicate with the driver; GPU identity and actual inference offload were not established. No driver or service repair was attempted. Memory use during the historical calls was not measured. Do not promise this model runs on an ordinary laptop. If the model is unavailable, only the documented import/study path can run; that is not the full AI-generation promise.

The two observed adapter times (1246 ms and 1073 ms) are individual server measurements, not a benchmark or cold-start guarantee. Nondeterministic outputs need factual review.

No new service, subscription, model download or paid API was used for this project. Existing subscription and server operating costs were not separately metered; monetary cost is UNKNOWN, not zero. No credentials are bundled. Use only your own non-sensitive notes; the included fictional workshop text is original synthetic data.
