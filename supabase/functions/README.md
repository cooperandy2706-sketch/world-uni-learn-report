# Supabase Edge Functions (Deno)

| File | Purpose |
|------|---------|
| `deno.json` | Runtime imports + compiler options (used by Supabase CLI / Deno) |
| `tsconfig.json` | Standard TypeScript editor config + `deno-globals.d.ts` |
| `deno-globals.d.ts` | `Deno.env` / `serve` types when Deno extension is off |

## IDE setup (Cursor / VS Code)

1. Install the [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno).
2. Reload the window (`Cmd+Shift+P` → “Developer: Reload Window”).
3. Open files under this folder — `Deno.env`, `serve`, and `https://` imports should resolve.

**Without** the Deno extension, `https://…` imports may still show squiggles — that is normal; deploy uses Deno, not `tsc`. Install the Deno extension for full import resolution.

If `tsconfig.json` itself shows errors on `lib` values like `deno.window`, use this repo’s current `tsconfig.json` (standard `ESNext` libs) — do not add `deno.window` to `lib` unless the Deno extension is active.
