import path from "path"
import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { Catalog } from "@neuraldeepcode/core/catalog"
import { Integration } from "@neuraldeepcode/core/integration"
import { Credential } from "@neuraldeepcode/core/credential"
import { Database } from "@neuraldeepcode/core/database/database"
import { EventV2 } from "@neuraldeepcode/core/event"
import { Flag } from "@neuraldeepcode/core/flag/flag"
import { Location } from "@neuraldeepcode/core/location"
import { ModelsDev } from "@neuraldeepcode/core/models-dev"
import { PluginV2 } from "@neuraldeepcode/core/plugin"
import { ModelsDevPlugin } from "@neuraldeepcode/core/plugin/models-dev"
import { Policy } from "@neuraldeepcode/core/policy"
import { AbsolutePath } from "@neuraldeepcode/core/schema"
import { location } from "../fixture/location"
import { testEffect } from "../lib/effect"

const events = EventV2.defaultLayer
const locationLayer = Layer.succeed(
  Location.Service,
  Location.Service.of(location({ directory: AbsolutePath.make(import.meta.dir) })),
)
const plugins = PluginV2.layer.pipe(Layer.provide(events))
const policy = Policy.layer.pipe(Layer.provide(locationLayer))
const connections = Credential.layer.pipe(
  Layer.fresh,
  Layer.provide(Database.layerFromPath(":memory:").pipe(Layer.fresh)),
  Layer.provide(events),
)
const integrations = Integration.locationLayer.pipe(Layer.provide(events), Layer.provide(connections))
const catalog = Catalog.layer.pipe(
  Layer.provide(Layer.mergeAll(events, locationLayer, plugins, policy, connections, integrations)),
)
const layer = Layer.mergeAll(
  catalog.pipe(Layer.provide(connections)),
  integrations,
  connections,
  events,
  locationLayer,
  plugins,
)
const it = testEffect(layer)

describe("ModelsDevPlugin", () => {
  it.effect("registers key methods for providers with environment variables", () =>
    Effect.acquireUseRelease(
      Effect.sync(() => {
        const previous = {
          path: Flag.NDC_MODELS_PATH,
          disabled: Flag.NDC_DISABLE_MODELS_FETCH,
        }
        Flag.NDC_MODELS_PATH = path.join(import.meta.dir, "fixtures", "models-dev.json")
        Flag.NDC_DISABLE_MODELS_FETCH = true
        return previous
      }),
      () =>
        Effect.gen(function* () {
          yield* ModelsDevPlugin.effect
          const integrations = yield* Integration.Service
          expect(yield* integrations.list()).toEqual([
            new Integration.Info({
              id: Integration.ID.make("acme"),
              name: "Acme",
              methods: [
                { type: "key" },
                {
                  type: "env",
                  names: ["ACME_API_KEY"],
                },
              ],
              connections: [],
            }),
          ])
        }).pipe(Effect.provide(ModelsDev.defaultLayer)),
      (previous) =>
        Effect.sync(() => {
          Flag.NDC_MODELS_PATH = previous.path
          Flag.NDC_DISABLE_MODELS_FETCH = previous.disabled
        }),
    ),
  )
})
