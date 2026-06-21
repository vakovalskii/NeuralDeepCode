import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@neuraldeepcode/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~ndcode/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~ndcode/WorkspaceRef", {
  defaultValue: () => undefined,
})
