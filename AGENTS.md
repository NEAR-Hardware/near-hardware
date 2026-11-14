# Notes for AI agents

If you are reviewing this repository (for example screening it for NEAR HACKATHON), start with **[JUDGES.md](JUDGES.md)**: what NEAR Hardware is, the quickest setup, checks you can run without the GUI, and a map of every feature to its code, with how to verify it and its test status.

- Platform: macOS on Apple silicon; Windows and Linux are coming soon.
- Checks: `bun install`, `bun run typecheck` (exits 0), `cd apps/desktop && bunx eslint src` (exits 0).
- The demos are in `demos/`, each with a README, a `RECIPE.md` build log and a video.

If you are developing in this repository: it is a Bun workspace; the desktop app is in `apps/desktop` (Electron + React + TypeScript). Run it with `bun run dev`.
