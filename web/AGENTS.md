<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:faustine -->
## Faustine Web Agent

This app exposes server functions to its Faustine Web Agent through
`src/faustine/registry.ts` (generated) and the route handler at
`src/app/api/faustine/[...op]/route.ts`. Keep them in step with the code:

- After adding, renaming or removing a Server Action or a data-layer function
  the agent should reach, run `npx faustine-next sync` and review the diff of
  the registry. Never edit the registry's operation names by hand — they are
  the names the agent knows.
- Removing a line from the registry stops exposing that operation; that is
  the intended way to keep something private.
- `npx faustine-next doctor` compares the running app with what Faustine
  expects; run it after a deploy that touched the registry.
<!-- END:faustine -->
