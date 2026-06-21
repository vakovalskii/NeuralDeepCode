import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["NDC_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["NDC_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("NDC_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  NDC_AUTO_HEAP_SNAPSHOT: truthy("NDC_AUTO_HEAP_SNAPSHOT"),
  NDC_GIT_BASH_PATH: process.env["NDC_GIT_BASH_PATH"],
  NDC_CONFIG: process.env["NDC_CONFIG"],
  NDC_CONFIG_CONTENT: process.env["NDC_CONFIG_CONTENT"],
  NDC_DISABLE_AUTOUPDATE: truthy("NDC_DISABLE_AUTOUPDATE"),
  NDC_ALWAYS_NOTIFY_UPDATE: truthy("NDC_ALWAYS_NOTIFY_UPDATE"),
  NDC_DISABLE_PRUNE: truthy("NDC_DISABLE_PRUNE"),
  NDC_DISABLE_TERMINAL_TITLE: truthy("NDC_DISABLE_TERMINAL_TITLE"),
  NDC_SHOW_TTFD: truthy("NDC_SHOW_TTFD"),
  NDC_DISABLE_AUTOCOMPACT: truthy("NDC_DISABLE_AUTOCOMPACT"),
  NDC_DISABLE_MODELS_FETCH: truthy("NDC_DISABLE_MODELS_FETCH"),
  NDC_DISABLE_MOUSE: truthy("NDC_DISABLE_MOUSE"),
  NDC_FAKE_VCS: process.env["NDC_FAKE_VCS"],
  NDC_SERVER_PASSWORD: process.env["NDC_SERVER_PASSWORD"],
  NDC_SERVER_USERNAME: process.env["NDC_SERVER_USERNAME"],
  NDC_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("NDC_DISABLE_FFF"),

  // Experimental
  NDC_EXPERIMENTAL_FILEWATCHER: Config.boolean("NDC_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  NDC_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("NDC_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  NDC_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("NDC_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  NDC_MODELS_URL: process.env["NDC_MODELS_URL"],
  NDC_MODELS_PATH: process.env["NDC_MODELS_PATH"],
  NDC_DB: process.env["NDC_DB"],

  NDC_WORKSPACE_ID: process.env["NDC_WORKSPACE_ID"],
  NDC_EXPERIMENTAL_WORKSPACES: enabledByExperimental("NDC_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get NDC_DISABLE_PROJECT_CONFIG() {
    return truthy("NDC_DISABLE_PROJECT_CONFIG")
  },
  get NDC_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("NDC_EXPERIMENTAL_REFERENCES")
  },
  get NDC_TUI_CONFIG() {
    return process.env["NDC_TUI_CONFIG"]
  },
  get NDC_CONFIG_DIR() {
    return process.env["NDC_CONFIG_DIR"]
  },
  get NDC_PURE() {
    return truthy("NDC_PURE")
  },
  get NDC_PERMISSION() {
    return process.env["NDC_PERMISSION"]
  },
  get NDC_PLUGIN_META_FILE() {
    return process.env["NDC_PLUGIN_META_FILE"]
  },
  get NDC_CLIENT() {
    return process.env["NDC_CLIENT"] ?? "cli"
  },
}
