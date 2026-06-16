import { generateFrames } from "./frames.js";

export interface WaveformConfig {
  pattern: string;
  width: number;
  color: string; // ANSI color code
  label: string;
  value: string;
  valueColor: string;
}

export class WaveformRenderer {
  private frames: string[];
  private frameIndex = 0;
  private frozen = false;

  constructor(private config: WaveformConfig) {
    this.frames = generateFrames(config.pattern, config.width, config.pattern.length);
  }

  tick(): string {
    if (this.frozen) {
      return this.renderLine(this.frames[this.frameIndex]);
    }
    this.frameIndex = (this.frameIndex + 1) % this.frames.length;
    return this.renderLine(this.frames[this.frameIndex]);
  }

  freeze(): void {
    this.frozen = true;
  }

  updateValue(value: string): void {
    this.config.value = value;
  }

  updateColor(color: string): void {
    this.config.valueColor = color;
  }

  private renderLine(frame: string): string {
    const { color, label, value, valueColor } = this.config;
    const labelPart = `${color}${label.padEnd(10)}${RESET}`;
    const wavePart = `${color}┃${frame}${RESET}`;
    const valuePart = `  ${valueColor}${value.padStart(8)}${RESET}`;
    return `${labelPart}${wavePart}${valuePart}`;
  }
}

// ANSI color codes
export const RESET = "\x1b[0m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const RED = "\x1b[31m";
export const CYAN = "\x1b[36m";
export const WHITE = "\x1b[37m";
export const DIM = "\x1b[2m";
export const BOLD = "\x1b[1m";
export const BG_BLACK = "\x1b[40m";
