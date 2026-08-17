// Storybook Sunbeam audio: concise Web Audio cues, unlocked only by a player gesture.

type ToneShape = OscillatorType;

export class SoundManager {
  private context: AudioContext | null = null;
  private enabled = this.readPreference();

  get isEnabled() {
    return this.enabled;
  }

  async unlock() {
    const context = this.getContext();
    if (context?.state === "suspended") {
      try {
        await context.resume();
      } catch {
        // Sound remains optional when a browser blocks audio until a later gesture.
      }
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    this.writePreference();
    if (this.enabled) {
      void this.unlock().then(() => this.menu());
    }
    return this.enabled;
  }

  launch() {
    this.play(392, 620, 0.18, 0.06, "triangle");
    this.play(587, 784, 0.22, 0.05, "triangle", 0.1);
  }

  flap() {
    this.play(340, 680, 0.12, 0.055, "square");
  }

  score() {
    this.play(660, 740, 0.09, 0.05, "sine");
    this.play(880, 1046, 0.15, 0.045, "sine", 0.08);
  }

  crash() {
    this.play(250, 72, 0.34, 0.075, "sawtooth");
  }

  menu() {
    this.play(520, 660, 0.08, 0.035, "triangle");
  }

  private getContext() {
    if (this.context) return this.context;
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return null;
    this.context = new AudioContextConstructor();
    return this.context;
  }

  private play(startFrequency: number, endFrequency: number, duration: number, volume: number, shape: ToneShape, delay = 0) {
    if (!this.enabled) return;
    const context = this.getContext();
    if (!context || context.state !== "running") return;

    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(startFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.025);
  }

  private readPreference() {
    try {
      return window.localStorage.getItem("princess-castle-flight-sound") !== "off";
    } catch {
      return true;
    }
  }

  private writePreference() {
    try {
      window.localStorage.setItem("princess-castle-flight-sound", this.enabled ? "on" : "off");
    } catch {
      // A blocked storage area should not affect play.
    }
  }
}
