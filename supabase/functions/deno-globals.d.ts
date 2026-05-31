/**
 * Ambient types for Supabase Edge Functions when the Deno extension is not active.
 * At deploy/runtime, Deno provides the real globals.
 */
declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined
  }
}

declare function serve(
  handler: (request: Request) => Response | Promise<Response>,
): void
