// Web Audio API Engine & Built-in Afro/Mbalax Demo Track Generator

/**
 * Generates a warm 30-second rhythmic Afro-melodic WAV Blob in memory
 * so the studio has a real playable, seekable, exportable audio track out of the box.
 */
export function createDemoAudioBlob(durationSeconds = 30) {
  const sampleRate = 22050;
  const numSamples = sampleRate * durationSeconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // WAV Header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Chord progression (Afro-pop / Mbalax warm progression: Fm -> Db -> Ab -> Eb)
  const chords = [
    [174.61, 207.65, 261.63, 349.23],
    [138.59, 174.61, 207.65, 277.18],
    [207.65, 261.63, 311.13, 415.30],
    [155.56, 196.00, 233.08, 311.13],
  ];
  const bpm = 112;
  const beatDur = 60 / bpm;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const beatPos = t / beatDur;
    const barIndex = Math.floor(beatPos / 4) % chords.length;
    const beatInBar = beatPos % 4;
    const subBeat = beatPos % 1;
    const sixteenth = (beatPos * 4) % 1;

    // 1. Warm Kick Drum on 0, 1.5, 2.5, 3
    let kick = 0;
    const kickTriggers = [0, 1.5, 2.0, 3.25];
    for (const trig of kickTriggers) {
      const dt = beatInBar - trig;
      if (dt >= 0 && dt < 0.22) {
        const freq = 115 * Math.exp(-dt * 22) + 45;
        kick += Math.sin(2 * Math.PI * freq * dt) * Math.exp(-dt * 16) * 0.45;
      }
    }

    // 2. Syncopated Tama / Talking Drum & Rimshot accents
    let perc = 0;
    const percTriggers = [0.5, 0.75, 1.0, 1.75, 2.5, 2.75, 3.5, 3.75];
    for (const trig of percTriggers) {
      const dt = beatInBar - trig;
      if (dt >= 0 && dt < 0.12) {
        const pitchBend = 340 + 90 * Math.sin(trig * 4);
        perc += Math.sin(2 * Math.PI * pitchBend * dt) * Math.exp(-dt * 32) * 0.25;
      }
    }

    // 3. Soft Shaker on 16th notes
    const shakerEnv = Math.exp(-sixteenth * 18) * 0.05;
    const noise = ((Math.sin(i * 12.9898) * 43758.5453) % 1) * 2 - 1;
    const shaker = noise * shakerEnv;

    // 4. Warm Bassline + Marimba/Kora pluck
    const chord = chords[barIndex];
    const bassFreq = chord[0] * 0.5;
    const bassEnv = Math.exp(-subBeat * 4.5);
    const bass = Math.sin(2 * Math.PI * bassFreq * t) * bassEnv * 0.32;

    // Kora / Balafon arpeggio pluck
    const arpIdx = Math.floor((beatPos * 2) % chord.length);
    const arpFreq = chord[arpIdx] * 2;
    const arpSub = (beatPos * 2) % 1;
    const arp =
      (Math.sin(2 * Math.PI * arpFreq * t) + 0.4 * Math.sin(4 * Math.PI * arpFreq * t)) *
      Math.exp(-arpSub * 9) *
      0.16;

    // Combine and soft-clip
    let sample = kick + perc + shaker + bass + arp;
    sample = Math.max(-0.95, Math.min(0.95, sample));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export class StudioAudioController {
  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'auto';

    this.ctx = null;
    this.sourceNode = null;
    this.analyser = null;
    this.streamDest = null;
    this.freqData = new Uint8Array(64);
    this.isInitialized = false;
  }

  ensureContext() {
    if (!this.isInitialized) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.78;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

      this.streamDest = this.ctx.createMediaStreamDestination();

      this.sourceNode = this.ctx.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.sourceNode.connect(this.streamDest);

      this.isInitialized = true;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  loadUrl(url) {
    const wasPlaying = !this.audio.paused;
    this.audio.src = url;
    this.audio.load();
    if (wasPlaying) {
      this.play();
    }
  }

  async play() {
    this.ensureContext();
    try {
      await this.audio.play();
    } catch (err) {
      console.warn('Playback prevented:', err);
    }
  }

  pause() {
    this.audio.pause();
  }

  seek(timeSeconds) {
    if (Number.isFinite(timeSeconds)) {
      this.audio.currentTime = Math.max(0, Math.min(this.audio.duration || 300, timeSeconds));
    }
  }

  /**
   * Returns normalized bar heights (0..1) for the symmetrical visualizer.
   * Falls back to a natural procedural wave when paused or during deterministic preview.
   */
  getVisualizerLevels(barCount = 39, currentTime = 0, isPlaying = false) {
    const half = Math.ceil(barCount / 2);
    const levels = new Array(barCount).fill(0.08);

    if (isPlaying && this.analyser) {
      this.analyser.getByteFrequencyData(this.freqData);
      for (let i = 0; i < barCount; i++) {
        // Center bars get stronger bass/mid energy, outer bars taper gently like the reference images
        const distFromCenter = Math.abs(i - (barCount - 1) / 2) / half;
        const envelope = Math.pow(Math.max(0, 1 - distFromCenter * 0.92), 1.35);
        const binIdx = Math.min(
          this.freqData.length - 1,
          Math.floor(distFromCenter * 18) + (i % 5) * 2
        );
        const raw = this.freqData[binIdx] / 255;
        // Mix real FFT with subtle artistic variation so neighboring bars have distinct heights like in the screenshots
        const artisticRipple =
          0.35 +
          0.35 * Math.sin(currentTime * 9.5 + i * 1.7) +
          0.3 * Math.cos(currentTime * 6.2 - i * 2.3);
        const combined = (raw * 0.72 + artisticRipple * 0.28) * envelope;
        levels[i] = distFromCenter > 0.82 ? 0.04 : Math.max(0.06, Math.min(1.0, combined));
      }
      return levels;
    }

    // Static / Paused aesthetic waveform matching the exact silhouette in Reference Image 1 & 2
    const staticPattern = [
      0.04, 0.04, 0.08, 0.08, 0.14, 0.28, 0.18, 0.56, 0.34, 0.26, 0.24, 0.42, 0.32, 0.48,
      0.66, 0.38, 0.78, 0.52, 0.24, 0.16, 0.30, 0.14, 0.22, 0.18, 0.10, 0.36, 0.20, 0.12,
      0.16, 0.08, 0.12, 0.08, 0.14, 0.06, 0.04, 0.08, 0.04, 0.04, 0.04,
    ];
    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor((i / barCount) * staticPattern.length);
      const base = staticPattern[idx] || 0.05;
      const breath = 1 + 0.08 * Math.sin(currentTime * 4 + i * 0.9);
      levels[i] = Math.min(1, base * breath);
    }
    return levels;
  }

  getAudioStreamTrack() {
    this.ensureContext();
    if (this.streamDest && this.streamDest.stream.getAudioTracks().length > 0) {
      return this.streamDest.stream.getAudioTracks()[0];
    }
    return null;
  }
}

