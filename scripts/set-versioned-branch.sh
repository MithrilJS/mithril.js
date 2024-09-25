#!/usr/bin/env bash
set -euo pipefail

base="$1"

if [[ -z "$base" ]]; then
    echo '::error::Base branch is missing. Invoke as `bash scripts/set-versioned-branch.sh BASE' >&2
    exit 1
fi

major=$(node -pe 'require("./package.json").version.replace(/\..*$/,"")')
# Can't do a force push due to branch protection rules.
git checkout "${base}"
git checkout -B "${base}-v${major}"
git push origin "${base}-v${major}"
