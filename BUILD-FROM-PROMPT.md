# Build from the supplied prompt

This public guide replaces reliance on the private `note-cards-build` helper. It was checked during CORRECTION-02 against the installed `codex exec --help`; the example was not executed against a model. This is an author documentation check, not independent teaching acceptance.

Original environment: Linux/Bash, Codex CLI **0.153.4**, observed coding model **gpt-6-astra**, Node **22.22.1**, npm **10.9.4**. That model may not be available to every account. A different model or later CLI may behave differently, and even the same setup does not promise identical generated code.

An installed Codex CLI and an existing ChatGPT sign-in are prerequisites for the generation path. This guide does not initiate login, inspect auth, or provision credentials. Codex itself needs access to its model provider; “no tool network” describes the generated commands' sandbox, not an offline coding model.

## Path A: create an implementation from an empty source folder

Use the supplied checkpoint as a context kit. Choose a new, nonexistent output directory. Copy only the three frozen documents; keep the exact controller-supplied original prompt outside the output directory. Do not copy finished source or evidence into the empty baseline.

The following Bash commands are **ADAPTED viewer instructions**, not a verbatim historical launch:

```bash
(
set -e
# Replace these two absolute paths before running.
kit='/absolute/path/to/supplied-note-cards-checkpoint'
build_dir='/absolute/path/to/new-note-cards-build'
mkdir -- "$build_dir"
cp -- "$kit/BRIEF.md" "$kit/ACCEPTANCE.md" "$kit/manifest.json" "$build_dir/"
cd -- "$build_dir"
ls -la
# Enter a coding model available to your account; original observed model: gpt-6-astra.
read -r -p 'Available coding model: ' coding_model
test -n "$coding_model"
codex exec --ignore-user-config \
  --ephemeral --sandbox workspace-write --skip-git-repo-check \
  -c 'approval_policy="never"' \
  -c 'forced_login_method="chatgpt"' \
  -c 'sandbox_workspace_write.network_access=false' \
  -c 'features.multi_agent=false' \
  -c 'hide_agent_reasoning=true' \
  -c 'show_raw_agent_reasoning=false' \
  --model "$coding_model" - < "$kit/prompts/BUILD-01.txt"
)
```

Run the block as a whole. Its fail-fast subshell stops before copying files or invoking Codex if the destination exists or a setup step fails; it does not close your interactive shell. `--ignore-user-config` prevents personal configuration from silently changing this recipe, and the sign-in method is explicitly ChatGPT. The stdin file is the exact original supplied prompt, including its embedded context, not a rewritten prompt. The separate frozen files supply the baseline on disk. The prompt's statement that recording is already running describes the original take; start your own capture first if reproducing that condition.

The recorded launch used existing ChatGPT sign-in, ephemeral workspace-write, no tool network, approval never, no additional agents and hidden reasoning. Its runtime-only log/sqlite locations are represented as `<REDACTED_RUNTIME_LOG_PATH>` and `<REDACTED_RUNTIME_SQLITE_PATH>`; these are not viewer paths or required setup. The adapted command omits those recording-specific paths and the private helper, accepts an account-available model explicitly, and permits a folder without Git. It does not reproduce the controller's recording/PTY wrapper or automated input. Preserve your own failures and label all new output as a new run.

The local help confirmed `exec`, stdin `-`, `--model`, `--ephemeral`, `--sandbox workspace-write`, `--skip-git-repo-check` and generic `-c key=value` syntax. Help alone does not verify the runtime effect of every configuration key or account model access. No nested coding session was run to test this guide.

## Path B: run the supplied finished source checkpoint

This path requires Node/npm already installed and does not invoke Codex or regenerate source. From the supplied product folder, run:

```bash
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm test
NOTE_CARDS_DATA_DIR="$PWD/.local-data" OLLAMA_URL='' npm start
```

The checkpoint has zero package dependencies. The install command uses the supplied lockfile. The final command needs an environment that allows loopback sockets; open `http://127.0.0.1:3210`. With an empty Ollama URL, generation is unavailable; saved-deck study and reviewed import remain available. Stop with Ctrl+C.

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

For actual generation, use the README's explicit Ollama URL only when the eligible pinned model and local service already exist. This guide does not install models or start shared services. Browser, live-model and restart checks must be recorded separately; injected tests do not establish them. The restricted original sandbox returned EPERM for loopback. No socket retry was made in CORRECTION-02.

Official references checked by the controller: [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode) and [Developer commands: CLI](https://learn.chatgpt.com/docs/developer-commands?surface=cli). These pages were not fetched again in this network-restricted correction.
