import { Config, ConfigProvider, Context, Effect, Layer, Option } from "effect"
import { ConfigService } from "@/effect/config-service"

const bool = (name: string) => Config.boolean(name).pipe(Config.withDefault(false))
const positiveInteger = (name: string) =>
  Config.number(name).pipe(
    Config.map((value) => (Number.isInteger(value) && value > 0 ? value : undefined)),
    Config.orElse(() => Config.succeed(undefined)),
  )
const experimental = bool("NDC_EXPERIMENTAL")
const enabledByExperimental = (name: string) =>
  Config.all({ experimental, enabled: Config.boolean(name).pipe(Config.option) }).pipe(
    Config.map((flags) => Option.getOrElse(flags.enabled, () => flags.experimental)),
  )

export class Service extends ConfigService.Service<Service>()("@neuraldeepcode/RuntimeFlags", {
  autoShare: bool("NDC_AUTO_SHARE"),
  pure: bool("NDC_PURE"),
  disableDefaultPlugins: bool("NDC_DISABLE_DEFAULT_PLUGINS"),
  disableEmbeddedWebUi: bool("NDC_DISABLE_EMBEDDED_WEB_UI"),
  disableExternalSkills: bool("NDC_DISABLE_EXTERNAL_SKILLS"),
  disableLspDownload: bool("NDC_DISABLE_LSP_DOWNLOAD"),
  disableClaudeCodePrompt: Config.all({
    broad: bool("NDC_DISABLE_CLAUDE_CODE"),
    direct: bool("NDC_DISABLE_CLAUDE_CODE_PROMPT"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  disableClaudeCodeSkills: Config.all({
    broad: bool("NDC_DISABLE_CLAUDE_CODE"),
    direct: bool("NDC_DISABLE_CLAUDE_CODE_SKILLS"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  enableExa: Config.all({
    experimental,
    enabled: bool("NDC_ENABLE_EXA"),
    legacy: bool("NDC_EXPERIMENTAL_EXA"),
  }).pipe(Config.map((flags) => flags.experimental || flags.enabled || flags.legacy)),
  enableParallel: Config.all({
    enabled: bool("NDC_ENABLE_PARALLEL"),
    legacy: bool("NDC_EXPERIMENTAL_PARALLEL"),
  }).pipe(Config.map((flags) => flags.enabled || flags.legacy)),
  enableExperimentalModels: bool("NDC_ENABLE_EXPERIMENTAL_MODELS"),
  enableQuestionTool: bool("NDC_ENABLE_QUESTION_TOOL"),
  experimentalReferences: enabledByExperimental("NDC_EXPERIMENTAL_REFERENCES"),
  experimentalBackgroundSubagents: enabledByExperimental("NDC_EXPERIMENTAL_BACKGROUND_SUBAGENTS"),
  experimentalLspTy: bool("NDC_EXPERIMENTAL_LSP_TY"),
  experimentalLspTool: enabledByExperimental("NDC_EXPERIMENTAL_LSP_TOOL"),
  experimentalOxfmt: enabledByExperimental("NDC_EXPERIMENTAL_OXFMT"),
  experimentalPlanMode: enabledByExperimental("NDC_EXPERIMENTAL_PLAN_MODE"),
  experimentalEventSystem: enabledByExperimental("NDC_EXPERIMENTAL_EVENT_SYSTEM"),
  experimentalWorkspaces: enabledByExperimental("NDC_EXPERIMENTAL_WORKSPACES"),
  experimentalIconDiscovery: enabledByExperimental("NDC_EXPERIMENTAL_ICON_DISCOVERY"),
  outputTokenMax: positiveInteger("NDC_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  bashDefaultTimeoutMs: positiveInteger("NDC_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  experimentalNativeLlm: bool("NDC_EXPERIMENTAL_NATIVE_LLM"),
  experimentalWebSockets: bool("NDC_EXPERIMENTAL_WEBSOCKETS"),
  client: Config.string("NDC_CLIENT").pipe(Config.withDefault("cli")),
}) {}

export type Info = Context.Service.Shape<typeof Service>

const emptyConfigLayer = Service.defaultLayer.pipe(
  Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
  Layer.orDie,
)

export const layer = (overrides: Partial<Info> = {}) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const flags = yield* Service
      return Service.of({ ...flags, ...overrides })
    }),
  ).pipe(Layer.provide(emptyConfigLayer))

export const defaultLayer = Service.defaultLayer.pipe(Layer.orDie)

export const node = LayerNode.make(defaultLayer, [])

export * as RuntimeFlags from "./runtime-flags"
import { LayerNode } from "@neuraldeepcode/core/effect/layer-node"
