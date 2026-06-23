import type { Argv } from "yargs"
import * as prompts from "@clack/prompts"
import semver from "semver"
import { UI } from "../ui"
import { Installation } from "@/installation"
import { InstallationVersion } from "@neuraldeepcode/core/installation/version"

// NeuralDeepCode: ndcode is a single binary installed via this repo's install.sh
// and updated from this repo's GitHub releases (vakovalskii/NeuralDeepCode).
export const UpgradeCommand = {
  command: "upgrade [target]",
  describe: "upgrade ndcode to the latest release",
  builder: (yargs: Argv) => {
    return yargs
      .positional("target", {
        describe: "version to install (default: latest release)",
        type: "string",
      })
      .option("method", {
        alias: "m",
        describe: "override the detected install method (curl, npm, brew, …)",
        type: "string",
      })
  },
  handler: async (args: { target?: string; method?: string }) => {
    UI.empty()
    UI.println(UI.logo("  "))
    UI.empty()
    prompts.intro("Upgrade")

    const method = (args.method as Installation.Method) || (await Installation.method())
    const target = (args.target?.replace(/^v/, "") || (await Installation.latest(method))).trim()

    if (semver.valid(InstallationVersion) && semver.valid(target) && !semver.gt(target, InstallationVersion)) {
      prompts.log.info(`Already up to date (v${InstallationVersion}).`)
      prompts.outro("Done")
      return
    }

    const spinner = prompts.spinner()
    spinner.start(`Updating ${InstallationVersion} → v${target} (${method})`)
    try {
      await Installation.upgrade(method, target)
      spinner.stop(`Updated to v${target}`)
      prompts.outro("Done — restart ndcode to use the new version.")
    } catch (err: any) {
      spinner.stop("Upgrade failed")
      prompts.log.error(err?.message || String(err))
      prompts.log.info(
        "Reinstall: curl -fsSL https://raw.githubusercontent.com/vakovalskii/NeuralDeepCode/main/install.sh | sh",
      )
      prompts.outro("Failed")
    }
  },
}
