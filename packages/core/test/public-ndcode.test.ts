import fs from "fs/promises"
import path from "path"
import { describe, expect } from "bun:test"
import { Effect, Schema } from "effect"
import { AbsolutePath, Location, Model, NeuralDeepCode, Session, Tool } from "@neuraldeepcode/core/public"
import { tmpdir } from "./fixture/tmpdir"
import { testEffect } from "./lib/effect"

const it = testEffect(NeuralDeepCode.layer)

describe("public native NeuralDeepCode API", () => {
  it.effect("exposes only the intentional Session capabilities", () =>
    Effect.gen(function* () {
      const ndcode = yield* NeuralDeepCode.Service

      expect(Object.keys(ndcode).sort()).toEqual(["sessions", "tools"])

      expect(Object.keys(ndcode.sessions).sort()).toEqual([
        "context",
        "create",
        "events",
        "get",
        "interrupt",
        "list",
        "message",
        "messages",
        "prompt",
        "switchModel",
      ])
      expect(Session.ID.create()).toStartWith("ses_")
      expect(Session.MessageID.create()).toStartWith("msg_")
      expect(yield* ndcode.sessions.list()).toBeArray()
      yield* ndcode.tools.register({
        public_tool: Tool.make({
          description: "Public tool",
          input: Schema.Struct({}),
          output: Schema.Struct({ ok: Schema.Boolean }),
          execute: () => Effect.succeed({ ok: true }),
        }),
      })
    }),
  )

  it.effect("switches to an available model and variant", () =>
    Effect.acquireRelease(
      Effect.promise(() => tmpdir()),
      (tmp) => Effect.promise(() => tmp[Symbol.asyncDispose]()),
    ).pipe(
      Effect.flatMap((tmp) =>
        Effect.gen(function* () {
          yield* writeProvider(tmp.path)
          const ndcode = yield* NeuralDeepCode.Service
          const sessionID = Session.ID.make("ses_public_switch_available")
          const model = ref({ variant: "fast" })
          yield* ndcode.sessions.create({
            id: sessionID,
            location: Location.Ref.make({ directory: AbsolutePath.make(tmp.path) }),
          })

          yield* ndcode.sessions.switchModel({ sessionID, model })

          expect((yield* ndcode.sessions.get(sessionID)).model).toEqual(model)
        }),
      ),
    ),
  )

  it.effect("rejects missing and Location-disabled models without changing the Session", () =>
    Effect.acquireRelease(
      Effect.promise(() => Promise.all([tmpdir(), tmpdir()])),
      (dirs) => Effect.promise(() => Promise.all(dirs.map((dir) => dir[Symbol.asyncDispose]())).then(() => undefined)),
    ).pipe(
      Effect.flatMap(([available, disabled]) =>
        Effect.gen(function* () {
          yield* writeProvider(available.path)
          yield* writeProvider(disabled.path, true)
          const ndcode = yield* NeuralDeepCode.Service
          const availableID = Session.ID.make("ses_public_switch_exact_available")
          const disabledID = Session.ID.make("ses_public_switch_exact_disabled")
          yield* ndcode.sessions.create({
            id: availableID,
            location: Location.Ref.make({ directory: AbsolutePath.make(available.path) }),
          })
          yield* ndcode.sessions.create({
            id: disabledID,
            location: Location.Ref.make({ directory: AbsolutePath.make(disabled.path) }),
          })

          yield* ndcode.sessions.switchModel({ sessionID: availableID, model: ref({ variant: "default" }) })
          const disabledError = yield* ndcode.sessions
            .switchModel({ sessionID: disabledID, model: ref() })
            .pipe(Effect.flip)
          const missingError = yield* ndcode.sessions
            .switchModel({ sessionID: disabledID, model: ref({ id: "missing" }) })
            .pipe(Effect.flip)

          expect(disabledError).toBeInstanceOf(Session.ModelUnavailableError)
          expect(missingError).toBeInstanceOf(Session.ModelUnavailableError)
          expect((yield* ndcode.sessions.get(availableID)).model).toEqual(ref({ variant: "default" }))
          expect((yield* ndcode.sessions.get(disabledID)).model).toBeUndefined()
        }),
      ),
    ),
  )

  it.effect("rejects an unavailable variant without changing the Session", () =>
    Effect.acquireRelease(
      Effect.promise(() => tmpdir()),
      (tmp) => Effect.promise(() => tmp[Symbol.asyncDispose]()),
    ).pipe(
      Effect.flatMap((tmp) =>
        Effect.gen(function* () {
          yield* writeProvider(tmp.path)
          const ndcode = yield* NeuralDeepCode.Service
          const sessionID = Session.ID.make("ses_public_switch_variant")
          const selected = ref({ variant: "fast" })
          yield* ndcode.sessions.create({
            id: sessionID,
            location: Location.Ref.make({ directory: AbsolutePath.make(tmp.path) }),
          })
          yield* ndcode.sessions.switchModel({ sessionID, model: selected })

          const error = yield* ndcode.sessions
            .switchModel({ sessionID, model: ref({ variant: "unknown" }) })
            .pipe(Effect.flip)

          expect(error).toBeInstanceOf(Session.VariantUnavailableError)
          expect((yield* ndcode.sessions.get(sessionID)).model).toEqual(selected)
        }),
      ),
    ),
  )

  it.effect("preserves the typed not-found error for a missing Session", () =>
    Effect.gen(function* () {
      const ndcode = yield* NeuralDeepCode.Service
      const sessionID = Session.ID.make("ses_public_switch_missing")
      const error = yield* ndcode.sessions
        .switchModel({
          sessionID,
          model: Schema.decodeUnknownSync(Model.Ref)({ id: "claude-sonnet-4-5", providerID: "anthropic" }),
        })
        .pipe(Effect.flip)

      expect(error).toBeInstanceOf(Session.NotFoundError)
      if (error instanceof Session.NotFoundError) expect(error.sessionID).toBe(sessionID)
    }),
  )
})

const ref = (input: { id?: string; variant?: string } = {}) =>
  Schema.decodeUnknownSync(Model.Ref)({
    id: input.id ?? "chat",
    providerID: "public-test",
    variant: input.variant,
  })

const writeProvider = (directory: string, disabled = false) =>
  Effect.promise(() =>
    fs.writeFile(
      path.join(directory, "ndcode.json"),
      JSON.stringify({
        providers: {
          "public-test": {
            name: "Public test",
            api: { type: "native", settings: {} },
            models: {
              chat: {
                disabled,
                variants: [{ id: "fast" }],
              },
            },
          },
        },
      }),
    ),
  )
