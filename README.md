# NeuralDeepCode (`ndcode`)

**Terminal AI coding agent for the [NeuralDeep](https://neuraldeep.ru) hub.**

`ndcode` is a terminal coding agent (a rebranded, hub-integrated fork of
[opencode](https://github.com/sst/opencode), MIT). It talks to the self-hosted
NeuralDeep LLM hub — RU-hosted Qwen3 / gpt-oss models on your own GPUs — and adds
two native slash commands so you log in with your browser and see your tier and
budget right inside the TUI.

```
        ▄              ▄
█▀▀▄ █▀▀█ █▀▀▀ █▀▀█ █▀▀█ █▀▀█
█  █ █  █ █    █  █ █  █ █▀▀▀
▀  ▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀
```

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

## Quick start

```bash
# from source (Bun >= 1.3)
git clone https://github.com/vakovalskii/NeuralDeepCode && cd NeuralDeepCode
bun install
bun run dev            # launches the ndcode TUI

# inside the TUI:
/login                 # browser SSO → key stored, provider configured
/status                # tier / budget / models
/models                # pick neuraldeep/qwen3.6-35b-a3b or gpt-oss-120b
```

Config lives in `~/.config/ndcode/` (`ndcode.json`, `neuraldeep.key`). Environment
variables are prefixed `NDC_`; override hub endpoints with `NEURALDEEP_HUB` and
`NEURALDEEP_API_BASE`.

## What's different from opencode

- Rebranded to `ndcode` / **NeuralDeepCode** (command, config dir `~/.config/ndcode`, `NDC_` env, logo).
- Native **`/login`** + **`/status`** hub commands and a default `neuraldeep` provider.
- Stripped of opencode's SaaS/marketing/desktop packages.
- **Auto-update disabled** — `ndcode` is distributed via the NeuralDeep hub, never self-updates from upstream opencode.
- No telemetry by default; nothing is sent to opencode.ai.

## Credits / license

NeuralDeepCode is a fork of **[sst/opencode](https://github.com/sst/opencode)**,
licensed under the **MIT License**. The upstream copyright notice is retained in
[`LICENSE`](LICENSE), as the license requires. This fork is likewise MIT.

Upstream is tracked as the `upstream` git remote for pulling future improvements.
