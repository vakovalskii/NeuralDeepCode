// The startup update check lives in the TUI (packages/tui/src/app.tsx): it queries
// this repo's latest GitHub release and offers to update. This worker-side hook is
// kept as a no-op so there is a single update prompt. Manual upgrades go through the
// `ndcode upgrade` command and the /global/upgrade route (Installation.upgrade).
export async function upgrade() {}
