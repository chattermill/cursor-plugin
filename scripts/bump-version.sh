#!/usr/bin/env bash
# Set the same plugin version in every agent's manifest.
#
#   ./scripts/bump-version.sh 1.2.0
set -euo pipefail

version="${1:?usage: $0 <semver>}"
root="$(cd "$(dirname "$0")/.." && pwd)"

for f in plugin.json .claude-plugin/plugin.json .cursor-plugin/plugin.json gemini-extension.json; do
  python3 - "$root/$f" "$version" <<'PY'
import json, sys
path, version = sys.argv[1], sys.argv[2]
with open(path) as fh:
    data = json.load(fh)
data["version"] = version
with open(path, "w") as fh:
    json.dump(data, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
PY
  echo "$f -> $version"
done
