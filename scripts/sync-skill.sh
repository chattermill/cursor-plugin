#!/usr/bin/env bash
# Copy the chattermill-best-practices skill into skills/ from a checkout of
# gitlab.com/chattermill/product/chattermill-mcp-skills (the skill's source of truth).
#
#   ./scripts/sync-skill.sh ../chattermill-mcp-skills
set -euo pipefail

src="${1:?usage: $0 <path-to-chattermill-mcp-skills checkout>}"
dest="$(cd "$(dirname "$0")/.." && pwd)/skills/chattermill-best-practices"

[[ -f "$src/skill/SKILL.md" ]] || { echo "no skill/SKILL.md under $src" >&2; exit 1; }

rm -rf "$dest"
mkdir -p "$dest"
cp -R "$src/skill/." "$dest/"

echo "Synced skill version $(cat "$src/VERSION") into $dest"
echo "Next: ./scripts/bump-version.sh <new-version>, then commit and push."
