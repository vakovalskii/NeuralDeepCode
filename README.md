# NeuralDeepCode (`ndcode`)

**Terminal AI coding agent for the [NeuralDeep](https://neuraldeep.ru) hub.**

`ndcode` is a terminal coding agent that talks to the self-hosted NeuralDeep LLM
hub — RU-hosted Qwen3 / gpt-oss models on your own GPUs. Log in with your browser,
see your tier and budget right inside the TUI, and start coding — no other
accounts, no provider juggling.

<p align="center">
  <img src="https://raw.githubusercontent.com/vakovalskii/NeuralDeepCode/main/docs/assets/ndcode-home.png" alt="ndcode" width="860">
</p>

## The idea

Most terminal coding agents are tuned for Claude / GPT. `ndcode` takes a mature
open-source agent loop ([opencode](https://github.com/sst/opencode), MIT) and
**adapts it for working with Qwen models** served by the NeuralDeep hub —
Qwen3-Coder / Qwen3 (`qwen3.6-35b-a3b`) and `gpt-oss-120b`. The goal is a coding
agent that feels native to *these* models: model-specific system prompts and
tool-calling tuned for Qwen, the hub as the default (and only) provider, browser
SSO login, and budget/limits visible in the TUI — instead of a generic client
pointed at someone else's cloud.

## Benchmark

A small agentic coding suite ([`bench/`](bench)) — each task runs the agent
headless in a clean repo and is scored by its own tests passing. On the hub's
default model:

| model | suite | pass-rate |
|---|---|---|
| `qwen3.6-35b-a3b` | bench/ (6 tasks: implement + bug-fix, Python/JS) | **6 / 6** |

Run it yourself (needs a working `ndcode` + `/login`, plus `python3` and `node`):

```bash
bench/run.sh                                 # default qwen3.6-35b-a3b
MODEL=neuraldeep/gpt-oss-120b bench/run.sh   # compare another hub model
```

> Note the hub's `max_parallel_requests` limit (tier-dependent) — the runner clears
> stray runs and spaces tasks so a correct rate-limit back-off isn't counted as a
> failure.

## Hub integration

| command | what it does |
|---|---|
| **`/login`** | Browser SSO (localhost-callback, like `gh auth login`). Opens `hub.neuraldeep.ru`, mints your per-user key, stores it, and auto-configures the `neuraldeep` provider. |
| **`/status`** | Shows your tier, daily budget (spent / limit / remaining), rate limits, and available models — straight from the hub. |

Once logged in, the `neuraldeep` provider (pointing at `https://api.neuraldeep.ru/v1`)
is ready with the hub's coding models:

- **`qwen3.6-35b-a3b`** — MoE, native tool-calling, 256k ctx
- **`gpt-oss-120b`** — reasoning, 131k ctx

Tier, rate limits, daily budget and model access are enforced by the hub gateway —
`ndcode` just consumes and displays them. See the hub contract:
[cli-integration-guide](https://hub.neuraldeep.ru) (`docs/services/api/cli-integration-guide.md`).

<p align="center">
  <img src="https://raw.githubusercontent.com/vakovalskii/NeuralDeepCode/main/docs/assets/ndcode-status.png" alt="ndcode /status output" width="640">
</p>

## Install

**One command (macOS / Linux):**

```bash
curl -fsSL https://raw.githubusercontent.com/vakovalskii/NeuralDeepCode/main/install.sh | sh
```

That's it — it downloads a single prebuilt binary to `~/.local/bin/ndcode`. No Bun,
no Node, no build step needed to run it. On macOS it auto-signs the binary so it
just runs.

**Then, three steps:**

```bash
# 1. make sure ~/.local/bin is on your PATH (the installer prints this if not):
export PATH="$HOME/.local/bin:$PATH"          # add to ~/.zshrc or ~/.bashrc

# 2. launch and log in:
ndcode                                         # opens the TUI
#   → on the home screen pick "NeuralDeep" (it's first), or just type /login
#   → a browser opens, you sign in, the key + provider are configured for you

# 3. check you're good and start coding:
/status                                        # tier / daily budget / models
```

After `/login` the model is selected automatically (`qwen3.6-35b-a3b`) — type your
first task and go.

**Updates roll automatically from this repo's releases.** On launch `ndcode` checks
the latest release and, if there's a newer build, offers to update in place — just
confirm. You can also update any time from the terminal:

```bash
ndcode upgrade            # pull the latest release and reinstall in place
```

Or re-run the installer (always fetches the newest release):

```bash
curl -fsSL https://raw.githubusercontent.com/vakovalskii/NeuralDeepCode/main/install.sh | sh
```

<details>
<summary>Troubleshooting</summary>

- **`zsh: command not found: ndcode`** — `~/.local/bin` isn't on your PATH. Run the
  `export PATH=…` line above and reopen the terminal.
- **macOS `killed: 9`** — a hand-copied binary lost its signature. Re-sign it:
  `codesign --force --sign - ~/.local/bin/ndcode && xattr -c ~/.local/bin/ndcode`
  (the installer does this automatically).
- **Windows** — download the binary from
  [Releases](https://github.com/vakovalskii/NeuralDeepCode/releases) manually.
</details>

## Run from source (for development)

```bash
git clone https://github.com/vakovalskii/NeuralDeepCode && cd NeuralDeepCode
bun install            # Bun >= 1.3.14
bun run dev            # launches the ndcode TUI

# build a standalone binary for your platform:
bun run --cwd packages/ndcode script/build.ts --single --skip-embed-web-ui
# → packages/ndcode/dist/ndcode-<os>-<arch>/bin/ndcode
```

Config lives in `~/.config/ndcode/` (`ndcode.json`, `neuraldeep.key`). Environment
variables are prefixed `NDC_`; override hub endpoints with `NEURALDEEP_HUB` and
`NEURALDEEP_API_BASE`.

## Headless / non-interactive

`ndcode` runs without the TUI — for scripts, CI, pipes, and editor/agent
integrations. Authenticate once interactively (`ndcode` → `/login`); the stored
hub credential is reused by all headless commands.

**One-shot run** — send a prompt, print the result, exit:

```bash
ndcode run "explain what this repo does"
ndcode run --model neuraldeep/qwen3.6-35b-a3b "add a healthcheck endpoint"

# machine-readable stream of events (for tooling / CI):
ndcode run --format json "list the TODOs in this codebase"

# pipe a prompt in:
echo "summarize the diff" | ndcode run

# continue / resume a session:
ndcode run --continue "now write tests for it"
ndcode run --session <id> "..."
```

Useful `run` flags: `--model provider/model`, `--agent <name>`, `--format default|json`,
`--file <path>` (attach files), `--continue` / `--session <id>`, `--share`,
`--attach <url>` (drive a running server).

**Headless server** — long-running HTTP API (drive it from editors, the SDK, or
`ndcode attach`):

```bash
ndcode serve --port 4096 --hostname 127.0.0.1
# from another shell / machine:
ndcode attach http://127.0.0.1:4096
ndcode run --attach http://127.0.0.1:4096 "..."   # auth: --password / NDC_SERVER_PASSWORD
```

**ACP server** — Agent Client Protocol over stdio, for IDE/editor integrations:

```bash
ndcode acp
```

All headless modes use the same `neuraldeep` provider and hub budget/limits as the TUI.

## What's inside

- `ndcode` / **NeuralDeepCode** — command, config dir `~/.config/ndcode`, `NDC_` env, green neon theme.
- Native **`/login`** + **`/status`** hub commands; **NeuralDeep is the default provider** and the first thing you connect.
- Focused on the hub — no SaaS upsells, no provider juggling, no desktop/marketing baggage.
- **Self-updating** — checks this repo's releases on launch and updates in place (`ndcode upgrade`).
- No telemetry by default.

## Contributors

- **Valerii Kovalskii** ([@vakovalskii](https://github.com/vakovalskii)) — maintainer, NeuralDeep hub integration (`/login`, `/status`, `neuraldeep` provider).

Contributions welcome — open an issue or PR.

## License

NeuralDeepCode is licensed under the **MIT License** (see [`LICENSE`](LICENSE)). It
builds on prior MIT-licensed work whose copyright notice is retained in
[`LICENSE`](LICENSE), as that license requires.

Upstream is tracked as the `upstream` git remote for pulling future improvements.
