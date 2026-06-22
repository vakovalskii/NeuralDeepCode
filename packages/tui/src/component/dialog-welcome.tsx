import { DialogSelect } from "../ui/dialog-select"
import { useDialog } from "../ui/dialog"
import { DialogThemeList } from "./dialog-theme-list"
import { DialogModel } from "./dialog-model"
import { DialogStatus } from "./dialog-status"

// Shown right after a successful NeuralDeep login as a tiny onboarding menu so
// the user can jump straight into theme / model / settings instead of being
// dropped back onto a bare prompt.
export function DialogWelcome(props: { email?: string; tier?: string }) {
  const dialog = useDialog()
  const title = props.email
    ? `Welcome, ${props.email}${props.tier ? ` (${props.tier})` : ""}`
    : "Welcome to NeuralDeep"
  return (
    <DialogSelect
      title={title}
      options={[
        {
          title: "Theme",
          value: "theme",
          description: "/themes",
          onSelect: () => dialog.replace(() => <DialogThemeList />),
        },
        {
          title: "Model",
          value: "model",
          description: "/models",
          onSelect: () => dialog.replace(() => <DialogModel />),
        },
        {
          title: "Settings",
          value: "settings",
          description: "tier / budget / config",
          onSelect: () => dialog.replace(() => <DialogStatus />),
        },
        {
          title: "Start coding",
          value: "start",
          description: "close this menu",
          onSelect: () => dialog.clear(),
        },
      ]}
    />
  )
}
