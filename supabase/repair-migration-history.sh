#!/usr/bin/env bash
# Sync remote migration history after squashing to 20250519000000_initial_schema.sql.
# Does NOT re-run SQL on remote — only updates supabase_migrations.schema_migrations.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Reverting old incremental migration records..."
supabase migration repair --status reverted 20250520000000
supabase migration repair --status reverted 20250520100000
supabase migration repair --status reverted 20250521100000

echo "Marking baseline migration as applied..."
supabase migration repair --status applied 20250519000000

echo "Done. Verify with: supabase migration list"
