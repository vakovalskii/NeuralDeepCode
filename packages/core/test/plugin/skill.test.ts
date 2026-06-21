import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { AgentV2 } from "@neuraldeepcode/core/agent"
import { FSUtil } from "@neuraldeepcode/core/fs-util"
import { SkillPlugin } from "@neuraldeepcode/core/plugin/skill"
import { SkillV2 } from "@neuraldeepcode/core/skill"
import { SkillDiscovery } from "@neuraldeepcode/core/skill/discovery"
import { testEffect } from "../lib/effect"

const it = testEffect(
  SkillV2.layer.pipe(
    Layer.provide(FSUtil.defaultLayer),
    Layer.provide(SkillDiscovery.defaultLayer),
    Layer.provideMerge(AgentV2.locationLayer),
  ),
)

describe("SkillPlugin.Plugin", () => {
  it.effect("registers the built-in customize-ndcode skill", () =>
    Effect.gen(function* () {
      const skill = yield* SkillV2.Service
      yield* SkillPlugin.Plugin.effect.pipe(Effect.provideService(SkillV2.Service, skill))

      expect(yield* skill.list()).toContainEqual(
        expect.objectContaining({
          name: "customize-ndcode",
          description: expect.stringContaining("ndcode's own configuration"),
        }),
      )
    }),
  )
})
