export class SoundManager {
  private static ctx: AudioContext | null = null;
  private static enabled = true;

  static init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported');
      }
    }
  }

  static toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  static isEnabled() {
    return this.enabled;
  }

  static playTone(frequency: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (!this.enabled || !this.ctx) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    try {
      const vca = this.ctx.createGain();
      const osc = this.ctx.createOscillator();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      
      vca.gain.setValueAtTime(volume, this.ctx.currentTime);
      vca.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(vca);
      vca.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Playback failed', e);
    }
  }

  static playClick() {
    this.playTone(600, 'sine', 0.1, 0.1);
  }

  static playPop() {
    this.playTone(800, 'sine', 0.15, 0.15);
    setTimeout(() => this.playTone(1200, 'sine', 0.1, 0.1), 50);
  }

  static playEliminated() {
    this.playTone(200, 'sawtooth', 0.5, 0.2);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.5, 0.2), 200);
  }

  static playTurn() {
    this.playTone(400, 'triangle', 0.2, 0.1);
    setTimeout(() => this.playTone(600, 'triangle', 0.3, 0.1), 100);
  }

  static playWin() {
    this.playTone(440, 'square', 0.2, 0.1);
    setTimeout(() => this.playTone(554, 'square', 0.2, 0.1), 150);
    setTimeout(() => this.playTone(659, 'square', 0.4, 0.1), 300);
  }

  static playLose() {
    this.playTone(300, 'sawtooth', 0.3, 0.1);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.4, 0.1), 200);
  }
}
