// One-time SuperDirt install. Run this line in SuperCollider
// (cursor on the line, then Cmd+Enter / Ctrl+Enter or Shift+Enter).
// It downloads SuperDirt plus the Dirt-Samples library (around 200 MB), so give it a few minutes.
// When the post window says it's done, restart SuperCollider.

Quarks.checkForUpdates({ Quarks.install("SuperDirt", "v1.7.4"); thisProcess.recompile() })
