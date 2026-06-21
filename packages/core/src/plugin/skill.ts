/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { Effect } from "effect"
import { PluginV2 } from "../plugin"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeNeuralDeepCodeContent from "./skill/customize-ndcode.md" with { type: "text" }

export const CustomizeNeuralDeepCodeContent = customizeNeuralDeepCodeContent

export const Plugin = PluginV2.define({
  id: PluginV2.ID.make("skill"),
  effect: Effect.gen(function* () {
    const skill = yield* SkillV2.Service
    const transform = yield* skill.transform()

    yield* transform((editor) => {
      editor.source(
        new SkillV2.EmbeddedSource({
          type: "embedded",
          skill: new SkillV2.Info({
            name: "customize-ndcode",
            description:
              "Use ONLY when the user is editing or creating ndcode's own configuration: ndcode.json, ndcode.jsonc, files under .ndcode/, or files under ~/.config/ndcode/. Also use when creating or fixing ndcode agents, subagents, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring ndcode itself.",
            location: AbsolutePath.make("/builtin/customize-ndcode.md"),
            content: CustomizeNeuralDeepCodeContent,
          }),
        }),
      )
    })
  }),
})
