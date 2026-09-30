import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

// Server-only. Uses the service_role key, which bypasses Row Level Security
// entirely (see supabase/schema.sql). Import this ONLY from api/*.ts functions.
// Never import lib/db.ts from anything under src/ -- that code is bundled into
// the browser, and the service_role key must never reach it. (There's no
// VITE_ prefix on these env vars for exactly this reason: Vite only exposes
// VITE_-prefixed vars to client code, so this file simply cannot be made to
// work from the browser bundle even by accident.)

let cached: SupabaseClient | null = null

export function getServiceClient(): SupabaseClient {
  if (cached) return cached

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (Vercel project env vars, not committed).',
    )
  }

  cached = createClient(url, key, {
    auth: { persistSession: false },
    // @supabase/supabase-js's SupabaseClient constructs a RealtimeClient
    // unconditionally, even though we never use realtime here, and that
    // constructor throws on any Node version without native WebSocket
    // (Node < 22). Passing an explicit implementation makes this work
    // regardless of the Node version the function actually runs on --
    // don't rely on Vercel happening to run Node 22+.
    // ws's type doesn't structurally match supabase-js's
    // WebSocketLikeConstructor, but it satisfies it at runtime -- the
    // well-known workaround for this is an explicit `any` here.
    realtime: { transport: WebSocket as any },
  })
  return cached
}
