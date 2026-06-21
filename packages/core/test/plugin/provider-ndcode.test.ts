import { describe, expect } from "bun:test"
import { DateTime, Effect, Layer, Option } from "effect"
import { Catalog } from "@neuraldeepcode/core/catalog"
import { Credential } from "@neuraldeepcode/core/credential"
import { EventV2 } from "@neuraldeepcode/core/event"
import { Integration } from "@neuraldeepcode/core/integration"
import { Location } from "@neuraldeepcode/core/location"
import { ModelV2 } from "@neuraldeepcode/core/model"
import { PluginV2 } from "@neuraldeepcode/core/plugin"
import { NeuralDeepCodePlugin } from "@neuraldeepcode/core/plugin/provider/ndcode"
import { ProviderV2 } from "@neuraldeepcode/core/provider"
import { AbsolutePath } from "@neuraldeepcode/core/schema"
import { location } from "../fixture/location"
import { it, model, provider, withEnv } from "./provider-helper"

const cost = (input: number, output = 0) => [{ input, output, cache: { read: 0, write: 0 } }]
const locationLayer = Layer.succeed(
  Location.Service,
  Location.Service.of(location({ directory: AbsolutePath.make("test") })),
)

const pluginWithIntegrations = (integrations: Integration.Interface) => ({
  ...NeuralDeepCodePlugin,
  effect: NeuralDeepCodePlugin.effect.pipe(Effect.provideService(Integration.Service, integrations)),
})

describe("NeuralDeepCodePlugin", () => {
  it.effect("uses a public key and disables paid models without credentials", () =>
    withEnv({ NDC_API_KEY: undefined }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(pluginWithIntegrations(yield* Integration.Service))
        const transform = yield* catalog.transform()
        yield* transform((catalog) => {
          const item = provider("ndcode")
          catalog.provider.update(item.id, () => {})
          const paid = model("ndcode", "paid", { cost: cost(1) })
          catalog.model.update(item.id, paid.id, (draft) => {
            draft.cost = [...paid.cost]
          })
        })
        expect((yield* catalog.provider.get(ProviderV2.ID.ndcode)).request.body.apiKey).toBe("public")
        expect((yield* catalog.model.get(ProviderV2.ID.ndcode, ModelV2.ID.make("paid"))).enabled).toBe(false)
      }),
    ),
  )

  it.effect("keeps free models without credentials", () =>
    withEnv({ NDC_API_KEY: undefined }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(pluginWithIntegrations(yield* Integration.Service))
        const transform = yield* catalog.transform()
        yield* transform((catalog) => {
          const item = provider("ndcode")
          catalog.provider.update(item.id, () => {})
          const free = model("ndcode", "free", { cost: cost(0) })
          catalog.model.update(item.id, free.id, (draft) => {
            draft.cost = [...free.cost]
          })
        })
        expect((yield* catalog.provider.get(ProviderV2.ID.ndcode)).request.body.apiKey).toBe("public")
        expect((yield* catalog.model.get(ProviderV2.ID.ndcode, ModelV2.ID.make("free"))).enabled).toBe(true)
      }),
    ),
  )

  it.effect("treats output-only cost as free without credentials", () =>
    withEnv({ NDC_API_KEY: undefined }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(pluginWithIntegrations(yield* Integration.Service))
        const transform = yield* catalog.transform()
        yield* transform((catalog) => {
          const item = provider("ndcode")
          catalog.provider.update(item.id, () => {})
          const outputOnly = model("ndcode", "output-only", { cost: cost(0, 1) })
          catalog.model.update(item.id, outputOnly.id, (draft) => {
            draft.cost = [...outputOnly.cost]
          })
        })
        expect((yield* catalog.provider.get(ProviderV2.ID.ndcode)).request.body.apiKey).toBe("public")
        expect((yield* catalog.model.get(ProviderV2.ID.ndcode, ModelV2.ID.make("output-only"))).enabled).toBe(true)
      }),
    ),
  )

  it.effect("uses NDC_API_KEY as credentials", () =>
    withEnv({ NDC_API_KEY: "secret" }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(pluginWithIntegrations(yield* Integration.Service))
        const transform = yield* catalog.transform()
        yield* transform((catalog) => {
          const item = provider("ndcode")
          catalog.provider.update(item.id, () => {})
          const paid = model("ndcode", "paid", { cost: cost(1) })
          catalog.model.update(item.id, paid.id, (draft) => {
            draft.cost = [...paid.cost]
          })
        })
        expect((yield* catalog.provider.get(ProviderV2.ID.ndcode)).request.body.apiKey).toBeUndefined()
        expect((yield* catalog.model.get(ProviderV2.ID.ndcode, ModelV2.ID.make("paid"))).enabled).toBe(true)
      }),
    ),
  )

  it.effect("uses configured provider env vars as credentials", () =>
    withEnv({ NDC_API_KEY: undefined, CUSTOM_NDC_API_KEY: "secret" }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        const integrations = yield* Integration.Service
        yield* plugin.add(pluginWithIntegrations(integrations))
        yield* integrations.update((editor) => {
          editor.method.update({
            integrationID: Integration.ID.make("ndcode"),
            method: { type: "env", names: ["CUSTOM_NDC_API_KEY"] },
          })
        })
        const transform = yield* catalog.transform()
        yield* transform((catalog) => {
          const item = provider("ndcode")
          catalog.provider.update(item.id, () => {})
          const paid = model("ndcode", "paid", { cost: cost(1) })
          catalog.model.update(item.id, paid.id, (draft) => {
            draft.cost = [...paid.cost]
          })
        })
        expect((yield* catalog.provider.get(ProviderV2.ID.ndcode)).request.body.apiKey).toBeUndefined()
        expect((yield* catalog.model.get(ProviderV2.ID.ndcode, ModelV2.ID.make("paid"))).enabled).toBe(true)
      }),
    ),
  )

  it.effect("uses configured apiKey as credentials", () =>
    withEnv({ NDC_API_KEY: undefined }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(pluginWithIntegrations(yield* Integration.Service))
        const transform = yield* catalog.transform()
        yield* transform((catalog) => {
          const item = provider("ndcode", {
            request: {
              headers: {},
              body: { apiKey: "configured" },
            },
          })
          catalog.provider.update(item.id, (draft) => {
            draft.request = item.request
          })
          const paid = model("ndcode", "paid", { cost: cost(1) })
          catalog.model.update(item.id, paid.id, (draft) => {
            draft.cost = [...paid.cost]
          })
        })
        expect((yield* catalog.provider.get(ProviderV2.ID.ndcode)).request.body.apiKey).toBe("configured")
        expect((yield* catalog.model.get(ProviderV2.ID.ndcode, ModelV2.ID.make("paid"))).enabled).toBe(true)
      }),
    ),
  )

  it.effect("ignores non-ndcode providers and models", () =>
    withEnv({ NDC_API_KEY: undefined }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(pluginWithIntegrations(yield* Integration.Service))
        const transform = yield* catalog.transform()
        yield* transform((catalog) => {
          const item = provider("openai")
          catalog.provider.update(item.id, () => {})
          const paid = model("openai", "paid", { cost: cost(1) })
          catalog.model.update(item.id, paid.id, (draft) => {
            draft.cost = [...paid.cost]
          })
        })
        expect((yield* catalog.provider.get(ProviderV2.ID.openai)).request.body.apiKey).toBeUndefined()
        expect((yield* catalog.model.get(ProviderV2.ID.openai, ModelV2.ID.make("paid"))).enabled).toBe(true)
      }),
    ),
  )

  it.effect("prefers gpt-5-nano as the ndcode small model", () =>
    Effect.gen(function* () {
      const catalog = yield* Catalog.Service
      const providerID = ProviderV2.ID.ndcode

      const transform = yield* catalog.transform()
      yield* transform((catalog) => {
        catalog.provider.update(providerID, () => {})
        catalog.model.update(providerID, ModelV2.ID.make("cheap-mini"), (model) => {
          model.capabilities.input = ["text"]
          model.capabilities.output = ["text"]
          model.cost = [...cost(1, 1)]
          model.time.released = DateTime.makeUnsafe(Date.now())
        })
        catalog.model.update(providerID, ModelV2.ID.make("gpt-5-nano"), (model) => {
          model.capabilities.input = ["text"]
          model.capabilities.output = ["text"]
          model.cost = [...cost(10, 10)]
          model.time.released = DateTime.makeUnsafe(Date.now())
        })
      })

      const selected = yield* catalog.model.small(providerID)

      expect(Option.getOrUndefined(selected)?.id).toBe(ModelV2.ID.make("gpt-5-nano"))
    }).pipe(
      Effect.provide(Catalog.locationLayer.pipe(Layer.provide(EventV2.defaultLayer), Layer.provide(locationLayer))),
    ),
  )
})
