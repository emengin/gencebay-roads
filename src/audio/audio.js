import { clamp } from "../core/math.js";
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }
  async start() {
    try {
      if (this.ctx) {
        await this.ctx.resume();
        return;
      }
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = 0;
      this.master.connect(c.destination);
      this.engine = c.createOscillator();
      this.engine.type = "sawtooth";
      this.engine.frequency.value = 48;
      this.engine2 = c.createOscillator();
      this.engine2.type = "triangle";
      this.engine2.frequency.value = 96;
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 320;
      this.engineFilter = filter;
      this.engineGain = c.createGain();
      this.engineGain.gain.value = 0.05;
      this.engine.connect(filter);
      this.engine2.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.master);
      this.engine.start();
      this.engine2.start();
      const buffer = c.createBuffer(1, c.sampleRate * 3, c.sampleRate),
        data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        last = (last + (Math.random() * 2 - 1) * 0.025) / 1.025;
        data[i] = last * 4;
      }
      const noise = c.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const windFilter = c.createBiquadFilter();
      windFilter.type = "highpass";
      windFilter.frequency.value = 500;
      this.windGain = c.createGain();
      this.windGain.gain.value = 0;
      noise.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.master);
      const rainFilter = c.createBiquadFilter();
      rainFilter.type = "highpass";
      rainFilter.frequency.value = 1300;
      this.rainGain = c.createGain();
      this.rainGain.gain.value = 0;
      noise.connect(rainFilter);
      rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.master);
      noise.start();
      this.brakeOsc = c.createOscillator();
      this.brakeOsc.type = "sine";
      this.brakeOsc.frequency.value = 920;
      this.brakeGain = c.createGain();
      this.brakeGain.gain.value = 0;
      this.brakeOsc.connect(this.brakeGain);
      this.brakeGain.connect(this.master);
      this.brakeOsc.start();
      // An occasional quiet two-note bird call; entirely synthesized, no music assets.
      this.bird = c.createOscillator();
      this.bird.type = "sine";
      this.bird.frequency.value = 2100;
      this.birdGain = c.createGain();
      this.birdGain.gain.value = 0;
      this.bird.connect(this.birdGain);
      this.birdGain.connect(this.master);
      this.bird.start();
      this.elapsed = 0;
      await c.resume();
    } catch {
      this.failed = true;
    }
  }
  update(dt, state, spec, settings, active) {
    if (!this.ctx || this.failed) return;
    const t = this.ctx.currentTime,
      speed = Math.abs(state.speed),
      rpm =
        (spec.engine + speed * 3.5) * (1 + Math.max(0, state.accel) * 0.018);
    this.master.gain.setTargetAtTime(
      active && !settings.muted ? settings.volume : 0,
      t,
      0.1,
    );
    this.engine.frequency.setTargetAtTime(rpm, t, 0.08);
    this.engine2.frequency.setTargetAtTime(rpm * 1.49, t, 0.08);
    this.engineFilter.frequency.setTargetAtTime(180 + speed * 12, t, 0.1);
    this.engineGain.gain.setTargetAtTime(
      0.035 + Math.max(0, state.accel) * 0.005,
      t,
      0.1,
    );
    this.windGain.gain.setTargetAtTime(
      clamp(speed / 45, 0, 1) * 0.2 + (state.offroad ? 0.025 : 0.008),
      t,
      0.1,
    );
    this.rainGain.gain.setTargetAtTime(
      settings.weather === "rain" ? 0.3 : 0,
      t,
      0.3,
    );
    this.brakeGain.gain.setTargetAtTime(
      state.braking && speed > 8 ? 0.006 : 0,
      t,
      0.04,
    );
    this.elapsed += dt;
    const bird =
      active &&
      settings.biome !== "desert" &&
      settings.time !== "night" &&
      Math.sin(this.elapsed * 0.45) > 0.97;
    this.birdGain.gain.setTargetAtTime(bird ? 0.006 : 0, t, 0.08);
    this.bird.frequency.setTargetAtTime(
      1700 + Math.sin(this.elapsed * 20) * 450,
      t,
      0.03,
    );
  }
}
