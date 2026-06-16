// EtCO2-style waveform patterns for terminal animation
// Each pattern is a string of characters representing one "sweep" of the waveform

// ECG-style: sharp QRS complex with flat baseline
export const ECG_PATTERN = "───────╱╲───────────────────────────";

// EtCO2/Capnography: square-ish plateau wave
export const CAPNO_PATTERN = "────╱▔▔▔▔╲────────────────────────";

// SpO2/Plethysmograph: rounded wave
export const PLETH_PATTERN = "────╱╲──────────────────────────────";

// Respiratory: gentle sine-like wave
export const RESP_PATTERN = "──╱╲──╱╲────────────────────────────";

// Flatline
export const FLATLINE = "────────────────────────────────────";

// Erratic (error state)
export const ERRATIC_PATTERN = "╱╲╱╲╱╱╲╲╱╲──╱╲╱──╱╲───────────────";

// Each channel uses a different waveform style
export const CHANNEL_PATTERNS = {
  skills: ECG_PATTERN,
  rules: CAPNO_PATTERN,
  coverage: PLETH_PATTERN,
  fixes: RESP_PATTERN,
} as const;

// Generate scrolling frames from a pattern
export function generateFrames(pattern: string, width: number, frameCount: number): string[] {
  const frames: string[] = [];
  const padded = pattern.repeat(Math.ceil((width + frameCount) / pattern.length));

  for (let i = 0; i < frameCount; i++) {
    frames.push(padded.slice(i, i + width));
  }

  return frames;
}
