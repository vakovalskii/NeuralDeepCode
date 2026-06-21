import { run as runTui, type TuiInput } from "@neuraldeepcode/tui"
import { Global } from "@neuraldeepcode/core/global"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(Global.defaultLayer))
}
