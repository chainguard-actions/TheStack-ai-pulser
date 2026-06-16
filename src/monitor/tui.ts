import { CHANNEL_PATTERNS, FLATLINE, ERRATIC_PATTERN } from "./frames.js";
import { WaveformRenderer, GREEN, YELLOW, RED, CYAN, WHITE, DIM, BOLD, RESET, BG_BLACK } from "./waveform.js";

export interface MonitorMetrics {
  skillsTotal: number;
  skillsScanned: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  score: number;
  rxCount: number;
  phase: string;
}

const WAVE_WIDTH = 40;

export class PatientMonitor {
  private waveforms: {
    skills: WaveformRenderer;
    rules: WaveformRenderer;
    coverage: WaveformRenderer;
    fixes: WaveformRenderer;
  };
  private timer: ReturnType<typeof setInterval> | null = null;
  private lineCount = 0;

  constructor() {
    this.waveforms = {
      skills: new WaveformRenderer({
        pattern: CHANNEL_PATTERNS.skills,
        width: WAVE_WIDTH,
        color: GREEN,
        label: "SKILLS",
        value: "-- / --",
        valueColor: GREEN,
      }),
      rules: new WaveformRenderer({
        pattern: CHANNEL_PATTERNS.rules,
        width: WAVE_WIDTH,
        color: GREEN,
        label: "RULES",
        value: "-- / -- / --",
        valueColor: GREEN,
      }),
      coverage: new WaveformRenderer({
        pattern: CHANNEL_PATTERNS.coverage,
        width: WAVE_WIDTH,
        color: CYAN,
        label: "SCORE",
        value: "--",
        valueColor: CYAN,
      }),
      fixes: new WaveformRenderer({
        pattern: CHANNEL_PATTERNS.fixes,
        width: WAVE_WIDTH,
        color: YELLOW,
        label: "Rx",
        value: "--",
        valueColor: YELLOW,
      }),
    };
  }

  start(): void {
    // Hide cursor
    process.stdout.write("\x1b[?25l");
    // Black background for monitor feel
    process.stdout.write(BG_BLACK);

    this.render();
    this.timer = setInterval(() => this.render(), 150);
  }

  update(metrics: MonitorMetrics): void {
    const { skillsTotal, skillsScanned, passCount, warnCount, failCount, score, rxCount, phase } = metrics;

    this.waveforms.skills.updateValue(`${skillsScanned} / ${skillsTotal}`);
    this.waveforms.rules.updateValue(`${GREEN}${passCount}${RESET}${BG_BLACK} ${YELLOW}${warnCount}${RESET}${BG_BLACK} ${RED}${failCount}${RESET}${BG_BLACK}`);

    const scoreColor = score >= 80 ? GREEN : score >= 50 ? YELLOW : RED;
    this.waveforms.coverage.updateValue(`${score}`);
    this.waveforms.coverage.updateColor(scoreColor);

    this.waveforms.fixes.updateValue(`${rxCount}`);

    if (failCount > 0) {
      // Erratic waveform on errors
      this.waveforms.rules = new WaveformRenderer({
        pattern: ERRATIC_PATTERN,
        width: WAVE_WIDTH,
        color: RED,
        label: "RULES",
        value: this.waveforms.rules.tick().split("  ").pop() || "",
        valueColor: RED,
      });
    }
  }

  stop(metrics: MonitorMetrics): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Freeze all waveforms
    Object.values(this.waveforms).forEach((w) => w.freeze());

    // Update final metrics
    this.update(metrics);

    // Final render
    this.render();

    // Show cursor, reset background
    process.stdout.write("\x1b[?25h");
    process.stdout.write(RESET);
    console.log("");
  }

  stopFlatline(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Clear and show flatline
    this.clearLines();
    const flat = `${RED}${FLATLINE.slice(0, WAVE_WIDTH)}${RESET}`;
    console.log("");
    console.log(`${BG_BLACK}${DIM}  pulser v0.4.0${RESET}${BG_BLACK}                        ${DIM}${new Date().toLocaleTimeString()}${RESET}`);
    console.log(`${BG_BLACK}${RED}  SKILLS    ┃${flat}  ${BOLD}FLATLINE${RESET}`);
    console.log(`${BG_BLACK}${DIM}  No skills found${RESET}`);
    console.log(RESET);

    process.stdout.write("\x1b[?25h");
  }

  private render(): void {
    this.clearLines();

    const now = new Date().toLocaleTimeString();
    const lines = [
      "",
      `${BG_BLACK}${DIM}  pulser v0.4.0${RESET}${BG_BLACK}                        ${DIM}${now}${RESET}`,
      `${BG_BLACK}${DIM}${"─".repeat(60)}${RESET}`,
      `${BG_BLACK}  ${this.waveforms.skills.tick()}`,
      `${BG_BLACK}${DIM}${"─".repeat(60)}${RESET}`,
      `${BG_BLACK}  ${this.waveforms.rules.tick()}`,
      `${BG_BLACK}${DIM}${"─".repeat(60)}${RESET}`,
      `${BG_BLACK}  ${this.waveforms.coverage.tick()}`,
      `${BG_BLACK}${DIM}${"─".repeat(60)}${RESET}`,
      `${BG_BLACK}  ${this.waveforms.fixes.tick()}`,
      `${BG_BLACK}${DIM}${"─".repeat(60)}${RESET}`,
    ];

    for (const line of lines) {
      process.stdout.write(line + RESET + "\n");
    }

    this.lineCount = lines.length;
  }

  private clearLines(): void {
    if (this.lineCount > 0) {
      // Move cursor up and clear lines
      process.stdout.write(`\x1b[${this.lineCount}A`);
      for (let i = 0; i < this.lineCount; i++) {
        process.stdout.write("\x1b[2K\n");
      }
      process.stdout.write(`\x1b[${this.lineCount}A`);
    }
  }
}
