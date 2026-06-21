// NeuralDeep hub integration helpers for the `/login` and `/status` commands.
//
// Mirrors the hub CLI contract (docs/services/api/cli-integration-guide.md):
//   - login: localhost-callback browser SSO, like `gh auth login`
//       GET {HUB}/api/cli/auth/start?port&state&client=ndcode  →  127.0.0.1:<port>/cb?state&key
//   - status / whoami: Bearer-authenticated JSON from the hub
//
// Self-contained on purpose (node http/crypto + fetch + spawn) so the TUI
// command handlers can call it without touching opencode's provider internals.
import http from "node:http"
import crypto from "node:crypto"
import { spawn } from "node:child_process"
import type { AddressInfo } from "node:net"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"

export const HUB = process.env.NEURALDEEP_HUB ?? "https://hub.neuraldeep.ru"
export const API_BASE = process.env.NEURALDEEP_API_BASE ?? "https://api.neuraldeep.ru/v1"
export const PROVIDER_ID = "neuraldeep"
export const CLIENT_ID = "ndcode"
// Default model selected right after login so the user isn't left on
// "No provider selected" (which otherwise sends them back into /connect).
export const DEFAULT_MODEL = "qwen3.6-35b-a3b"

export type HubStatus = {
  user?: { email?: string; name?: string }
  key?: { name?: string; masked?: string }
  tier?: string
  limits?: { rpm?: number; parallel?: number }
  models?: { id: string; mode?: string; ctx?: number }[]
}

export type Whoami = { email?: string; name?: string; tier?: string }

function openBrowser(url: string) {
  const cmd =
    process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open"
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url]
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref()
  } catch {
    // best-effort: the start URL is also surfaced to the user
  }
}

export type LoginResult = { key: string }

/**
 * Run the browser SSO flow. Resolves with the minted hub key, or rejects on
 * timeout / state mismatch. `onUrl` receives the start URL so the caller can
 * show it in case the browser does not open automatically.
 */
export function login(opts: { onUrl?: (url: string) => void; timeoutMs?: number } = {}): Promise<LoginResult> {
  return new Promise<LoginResult>((resolve, reject) => {
    const state = crypto.randomBytes(16).toString("hex")
    let settled = false
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", "http://127.0.0.1")
      if (url.pathname !== "/cb") {
        res.writeHead(404).end()
        return
      }
      res.setHeader("content-type", "text/html; charset=utf-8")
      if (url.searchParams.get("state") !== state) {
        res.writeHead(400).end("<h3>ndcode: state mismatch</h3>")
        finish(new Error("state mismatch"))
        return
      }
      const key = (url.searchParams.get("key") ?? "").trim()
      if (!key) {
        res.writeHead(400).end("<h3>ndcode: empty key</h3>")
        finish(new Error("empty key from hub"))
        return
      }
      res.end(
        "<h3 style='font-family:system-ui;color:#00FF88'>✓ NeuralDeepCode подключён. Вернись в терминал.</h3>",
      )
      finish(undefined, { key })
    })

    const timer = setTimeout(() => finish(new Error("login timed out")), opts.timeoutMs ?? 180_000)

    function finish(err?: Error, result?: LoginResult) {
      if (settled) return
      settled = true
      clearTimeout(timer)
      server.close()
      if (err) reject(err)
      else resolve(result!)
    }

    server.on("error", (err) => finish(err))
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as AddressInfo).port
      const startUrl = `${HUB}/api/cli/auth/start?port=${port}&state=${encodeURIComponent(state)}&client=${CLIENT_ID}`
      opts.onUrl?.(startUrl)
      openBrowser(startUrl)
    })
  })
}

async function getJson<T>(path: string, key: string): Promise<T> {
  const res = await fetch(`${HUB}${path}`, {
    headers: { authorization: `Bearer ${key}`, accept: "application/json" },
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { detail?: string }
      if (body?.detail) detail = body.detail
    } catch {
      // non-JSON error body
    }
    throw new Error(detail)
  }
  return (await res.json()) as T
}

function keyFilePath(): string {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
  return path.join(base, "ndcode", "neuraldeep.key")
}

/** Persist the hub key to a 0600 file so `/status` can read it later. */
export async function saveKeyFile(key: string): Promise<void> {
  const file = keyFilePath()
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, key.trim() + "\n", { mode: 0o600 })
}

/** Read the saved hub key, or undefined if not logged in. */
export async function readKeyFile(): Promise<string | undefined> {
  try {
    const key = (await fs.readFile(keyFilePath(), "utf8")).trim()
    return key || undefined
  } catch {
    return undefined
  }
}

function configPath(): string {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
  return path.join(base, "ndcode", "ndcode.json")
}

/**
 * Ensure the global ndcode.json declares the `neuraldeep` provider so the
 * credential stored via auth.set is actually routed to api.neuraldeep.ru.
 * Idempotent: only adds the provider when it's missing, preserving the rest.
 * Returns true when the file was written.
 */
export async function ensureProviderConfig(): Promise<boolean> {
  const file = configPath()
  let config: Record<string, any> = {}
  try {
    config = JSON.parse(await fs.readFile(file, "utf8"))
  } catch {
    // missing or unparsable → start fresh
  }
  config.provider ??= {}
  if (config.provider[PROVIDER_ID]) return false
  config.provider[PROVIDER_ID] = {
    npm: "@ai-sdk/openai-compatible",
    name: "NeuralDeep",
    options: { baseURL: API_BASE },
    models: {
      "qwen3.6-35b-a3b": {
        name: "Qwen3.6 35B A3B",
        tool_call: true,
        limit: { context: 262144, output: 8192 },
      },
      "gpt-oss-120b": {
        name: "GPT-OSS 120B",
        reasoning: true,
        limit: { context: 131072, output: 8192 },
      },
    },
  }
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(config, null, 2) + "\n")
  return true
}

// Full sign-in sequence shared by the /login command and the provider picker:
// browser SSO → store key in the native credential store + key file → ensure the
// `neuraldeep` config provider exists → reload the server → return who we are.
export async function connect(opts: {
  sdkClient: any
  bootstrap: () => Promise<unknown>
  onUrl?: (url: string) => void
}): Promise<{ key: string; who?: Whoami }> {
  const { key } = await login({ onUrl: opts.onUrl })
  await opts.sdkClient.auth.set({ providerID: PROVIDER_ID, auth: { type: "api", key } })
  await saveKeyFile(key)
  await ensureProviderConfig()
  await opts.sdkClient.instance.dispose().catch(() => {})
  await opts.bootstrap().catch(() => {})
  const who = await whoami(key).catch(() => undefined)
  return { key, who }
}

export function status(key: string): Promise<HubStatus> {
  return getJson<HubStatus>("/api/cli/status", key)
}

export function whoami(key: string): Promise<Whoami> {
  return getJson<Whoami>("/api/cli/whoami", key)
}

/** Human-readable multi-line summary for the `/status` dialog. */
export function formatStatus(s: HubStatus): string {
  const lines: string[] = []
  const who = [s.user?.name, s.user?.email].filter(Boolean).join(" · ")
  if (who) lines.push(who)
  if (s.tier) lines.push(`Tier: ${s.tier}`)
  // Дневной $-бюджет НЕ показываем: это внутренний потолок себестоимости, а не
  // подписочная квота (сервер /api/cli/status его больше не отдаёт).
  if (s.limits) lines.push(`Limits: ${s.limits.rpm ?? "?"} rpm · ${s.limits.parallel ?? "?"} parallel`)
  if (s.models?.length) {
    lines.push("")
    lines.push("Models:")
    for (const m of s.models) {
      const ctx = m.ctx ? ` · ${Math.round(m.ctx / 1024)}k ctx` : ""
      lines.push(`  • ${m.id}${ctx}`)
    }
  }
  return lines.join("\n")
}
