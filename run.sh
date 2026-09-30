#!/usr/bin/env bash
# Build and run OneBridge.
#
# Judges do not need this: the app is hosted at https://onebridge-botb-2026.vercel.app
#
# Usage:
#   ./run.sh          install, build, and start the full app locally (website + API)
#   ./run.sh build    install and build only (type-checks browser and server code)
#
# Running locally needs a Supabase database (see README, "10. Running it yourself")
# and the Vercel CLI, which runs the api/ functions exactly as they run in production.

set -euo pipefail
cd "$(dirname "$0")"

HOSTED_URL="https://onebridge-botb-2026.vercel.app"
echo "OneBridge. Hosted version, no setup needed: $HOSTED_URL"
echo

# 1. Node.js 20 or newer
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required. Install it from https://nodejs.org and run this again."
  exit 1
fi
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node.js 20 or newer is required (found $(node -v))."
  exit 1
fi

# 2. Install exactly the locked dependency versions
echo "Installing dependencies..."
npm ci --no-audit --no-fund

# 3. Type-check the browser and server code, then bundle the app
echo "Building..."
npm run build

if [ "${1:-}" = "build" ]; then
  echo
  echo "Build succeeded. Output is in dist/."
  exit 0
fi

# 4. Start the full app. vercel dev reads database credentials from .env or
#    .env.local, or from the linked Vercel project's development settings.
has_db_config() {
  for f in .env .env.local; do
    if [ -f "$f" ] && grep -qE '^SUPABASE_URL=.+' "$f" && grep -qE '^SUPABASE_SERVICE_ROLE_KEY=.+' "$f"; then
      return 0
    fi
  done
  [ -f .vercel/project.json ]
}

if ! has_db_config; then
  cat <<'EOF'

The build works, but starting the app needs a database first:
  1. Create a free Supabase project (https://supabase.com).
  2. In its SQL editor, run supabase/schema.sql, then supabase/seed.sql.
  3. cp .env.example .env, then fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
  4. Run ./run.sh again.
EOF
  exit 1
fi

echo
echo "Starting at http://localhost:3000 (the first run may ask you to log in to Vercel)..."
exec npx --yes vercel dev --listen 3000
