<!-- markdownlint-disable -->

# Hardening Report: TheStack-ai--pulser/v1.0.0

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `2`

Action **TheStack-ai--pulser/v1.0.0** was hardened automatically. 7 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

action.yml contains multiple ${{ inputs.* }} expressions directly interpolated inside run: shell command strings (sub-rule a). Specifically: (1) `npm install -g pulser-cli@${{ inputs.version }}` — inputs.version is injected directly into a shell command, allowing command injection via a crafted version string. (2) `REPORT=$(pulser "${{ inputs.path }}" ...)` and `pulser "${{ inputs.path }}" ...` — inputs.path is injected directly into shell commands twice. (3) `if [ "${{ inputs.strict }}" = "true" ]` — inputs.strict is injected directly into a shell conditional. All three inputs are attacker-controllable and must be passed via env: variables and then double-quoted in the shell, never interpolated directly as ${{ }} expressions inside run: blocks.

Locations:

- `action.yml:40`
- `action.yml:44`
- `action.yml:63`
- `action.yml:66`

### unpinned-uses (severity: high)

Multiple uses: references use mutable tags instead of pinned 40-character commit SHAs, making the action vulnerable to supply-chain attacks if the referenced tag is moved or overwritten. Failing references in action.yml: `actions/setup-node@v4`. Failing references in .github/workflows/ci.yml: `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4`. All should be pinned to full SHA digests (e.g. `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4`).

Locations:

- `action.yml:37`
- `.github/workflows/ci.yml:12`
- `.github/workflows/ci.yml:13`
- `.github/workflows/ci.yml:15`

### missing-permissions (severity: medium)

.github/workflows/ci.yml has no top-level `permissions:` key and the `build` job also has no job-level `permissions:` key. Without explicit permissions, the workflow inherits the repository's default token permissions, which may be overly broad (e.g. write access to contents). A minimal permissions block such as `permissions: read-all` or specific scopes (e.g. `contents: read`) should be added.

Locations:

- `.github/workflows/ci.yml:1`

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

**Fixes applied:** script-injection, static-inline-injection, unpinned-uses, missing-permissions

**Notes:**

Fixed all findings in action.yml and .github/workflows/ci.yml:

1. script-injection / static-inline-injection: Moved all ${{ inputs.version }}, ${{ inputs.path }}, and ${{ inputs.strict }} expressions out of run: shell blocks into env: maps (PULSER_VERSION, PULSER_PATH, PULSER_STRICT). Shell commands now reference plain environment variables with double-quoting.

2. unpinned-uses: Pinned all three action references to full 40-character commit SHAs with tag comments preserved: actions/setup-node@v4 → @49933ea5288caeca8642d1e84afbd3f7d6820020, actions/checkout@v4 → @11d5960a326750d5838078e36cf38b85af677262, pnpm/action-setup@v4 → @b906affcce14559ad1aafd4ab0e942779e9f58b1.

3. missing-permissions: Added `permissions: contents: read` at both the top-level workflow scope and the build job level in ci.yml.

