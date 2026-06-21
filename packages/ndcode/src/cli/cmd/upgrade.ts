import type { Argv } from "yargs"
import { UI } from "../ui"
import * as prompts from "@clack/prompts"

// NeuralDeepCode: this fork is distributed and updated via the NeuralDeep hub
// installer, not upstream opencode npm/GitHub releases. Self-upgrade is disabled
// so it never replaces the `ndcode` binary with stock opencode.
export const UpgradeCommand = {
  command: "upgrade [target]",
  describe: "upgrade ndcode (managed by the NeuralDeep hub — disabled here)",
  builder: (yargs: Argv) => {
    return yargs
      .positional("target", {
        describe: "ignored — ndcode is managed by the NeuralDeep hub installer",
        type: "string",
      })
      .option("method", {
        alias: "m",
        describe: "ignored — ndcode is managed by the NeuralDeep hub installer",
        type: "string",
      })
  },
  handler: async () => {
    UI.empty()
    UI.println(UI.logo("  "))
    UI.empty()
    prompts.intro("Upgrade")
    prompts.log.warn("ndcode is managed by the NeuralDeep hub — self-upgrade is disabled.")
    prompts.log.info("Re-run the hub installer to update to a newer ndcode build.")
    prompts.outro("Done")
  },
}
