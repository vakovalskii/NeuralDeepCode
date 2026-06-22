# NeuralDeep hub integration

How `ndcode` connects to the NeuralDeep hub. This is the client side of the
contract documented hub-side in `docs/services/api/cli-integration-guide.md`
(neuraldeep-llm-proxy repo).

## Endpoints

| const | value | use |
|---|---|---|
| `NEURALDEEP_API_BASE` | `https://api.neuraldeep.ru/v1` | OpenAI-compatible provider base URL |
| `NEURALDEEP_HUB` | `https://hub.neuraldeep.ru` | auth + status (`/api/cli/*`) |

Both are overridable via env vars of the same name (see `packages/tui/src/util/hub.ts`).

## `/login` (browser SSO)

`packages/tui/src/util/hub.ts → login()` + the `neuraldeep.login` command in
`packages/tui/src/routes/session/index.tsx`.

1. Spins up a localhost callback server on `127.0.0.1:<random-port>`.
2. Opens the browser at
   `GET {HUB}/api/cli/auth/start?port=<port>&state=<rand>&client=ndcode`.
3. Hub does Yandex SSO (if needed), mints/reuses a per-user key named `ndcode`,
   and redirects to `http://127.0.0.1:<port>/cb?state=<state>&key=<sk-…>`.
4. Client validates `state`, then:
   - stores the key in ndcode's native credential store via
     `sdk.client.auth.set({ providerID: "neuraldeep", auth: { type: "api", key } })`;
   - also writes it to `~/.config/ndcode/neuraldeep.key` (0600) for `/status`;
   - ensures `~/.config/ndcode/ndcode.json` declares the `neuraldeep` provider
     (`ensureProviderConfig()`), then reloads the instance.

## `/status`

`neuraldeep.status` command → `hub.ts → status()` → `GET {HUB}/api/cli/status`
with `Authorization: Bearer <key>` (read from `neuraldeep.key`). Rendered with
`DialogAlert` via `formatStatus()`: tier, daily budget, rate limits, models.

## Provider

The `neuraldeep` provider is a config provider (no core changes):

```jsonc
// ~/.config/ndcode/ndcode.json  (written by /login)
{
  "provider": {
    "neuraldeep": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "NeuralDeep",
      "options": { "baseURL": "https://api.neuraldeep.ru/v1" },
      "models": {
        "qwen3.6-35b-a3b": { "tool_call": true, "limit": { "context": 262144, "output": 8192 } },
        "gpt-oss-120b":    { "reasoning": true, "limit": { "context": 131072, "output": 8192 } }
      }
    }
  }
}
```

The API key comes from the credential store (set during `/login`); tier, limits,
budget and model access are enforced hub-side. `ndcode` only consumes them.
