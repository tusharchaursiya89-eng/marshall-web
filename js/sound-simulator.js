/**
 * MARSHALL SOUND LAB & ACTIVE NOISE CANCELLING (ANC) SIMULATOR
 * Real-Time Web Audio API Synthesis, Anti-Phase Phase Filtering & Spectrum Visualizer
 */

class SoundSimulator {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.currentAncMode = 'anc'; // 'off' | 'transparency' | 'anc'
    this.currentEnvironment = 'airplane'; // 'airplane' | 'subway' | 'cafe'
    this.currentEq = 'marshall'; // 'marshall' | 'vocal' | 'flat'

    // DOM Nodes
    this.canvas = document.getElementById('soundVisualizerCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.navBtn = document.querySelector('.nav-audio-btn');
    this.masterToggle = document.getElementById('masterSoundToggle');
    this.ancStatusBadge = document.getElementById('ancLiveStatus');
    this.decibelMeter = document.getElementById('decibelMeter');

    this.init();
  }

  init() {
    if (this.canvas) {
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    // Bind ANC mode buttons
    const ancBtns = document.querySelectorAll('.anc-mode-btn');
    ancBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ancBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        this.setAncMode(mode);
      });
    });

    // Bind Environment buttons
    const envBtns = document.querySelectorAll('.env-btn');
    envBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        envBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const env = btn.getAttribute('data-env');
        this.setEnvironment(env);
      });
    });

    // Bind master toggle
    if (this.masterToggle) {
      this.masterToggle.addEventListener('click', () => this.togglePlayback());
    }

    // Bind nav toggle
    if (this.navBtn) {
      this.navBtn.addEventListener('click', () => this.togglePlayback());
    }

    // Start visualizer idle loop
    this.drawVisualizer();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    if (this.ctx) this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  setupAudioGraph() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    // Master Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.audioCtx.currentTime);

    // Spectrum Analyser
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.85;

    // Connect to output
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    // 1. Ambient Noise Generator (Pink Noise Buffer)
    this.setupAmbientNoise();

    // 2. Music Synthesizer (Harmonic Rock Chords / Riff loop)
    this.setupMusicSynth();
  }

  setupAmbientNoise() {
    const bufferSize = this.audioCtx.sampleRate * 2;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink noise generation algorithm (Paul Kellet's filtered method)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // gain scaling
      b6 = white * 0.115926;
    }

    this.ambientSource = this.audioCtx.createBufferSource();
    this.ambientSource.buffer = noiseBuffer;
    this.ambientSource.loop = true;

    // Environment specific filter (airplane engine hum: low rumble)
    this.envFilter = this.audioCtx.createBiquadFilter();
    this.envFilter.type = 'lowpass';
    this.envFilter.frequency.setValueAtTime(320, this.audioCtx.currentTime);

    // ANC Cancellation filter
    this.ancFilter = this.audioCtx.createBiquadFilter();
    this.ancFilter.type = 'lowshelf';
    this.ancFilter.frequency.setValueAtTime(600, this.audioCtx.currentTime);
    this.ancFilter.gain.setValueAtTime(-28, this.audioCtx.currentTime); // Default ANC state

    this.ambientGain = this.audioCtx.createGain();
    this.ambientGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

    this.ambientSource.connect(this.envFilter);
    this.envFilter.connect(this.ancFilter);
    this.ancFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.ambientSource.start(0);
  }

  setupMusicSynth() {
    // Elegant rhythmic rock chord synthesizer using harmonic oscillators
    this.musicGain = this.audioCtx.createGain();
    this.musicGain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
    this.musicGain.connect(this.masterGain);

    // Play pleasant repeating progression: E minor -> G major -> D major -> A
    const chords = [
      [82.41, 164.81, 196.00, 246.94], // Em
      [98.00, 196.00, 246.94, 293.66], // G
      [73.42, 146.83, 220.00, 293.66], // D
      [110.00, 220.00, 277.18, 329.63] // A
    ];

    let chordStep = 0;
    this.musicTimer = setInterval(() => {
      if (!this.isPlaying || !this.audioCtx) return;
      this.playChord(chords[chordStep % chords.length]);
      chordStep++;
    }, 1200);
  }

  playChord(frequencies) {
    if (!this.audioCtx || this.audioCtx.state === 'suspended') return;
    const now = this.audioCtx.currentTime;

    frequencies.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();

      // Rich guitar-like sawtooth + triangle tone
      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass tone shaping (Marshall warm amplifier cabinet simulation)
      const cabinet = this.audioCtx.createBiquadFilter();
      cabinet.type = 'lowpass';
      cabinet.frequency.setValueAtTime(2200, now);

      // Pluck envelope
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 0.04);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

      osc.connect(cabinet);
      cabinet.connect(oscGain);
      oscGain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  togglePlayback() {
    if (!this.audioCtx) {
      this.setupAudioGraph();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isPlaying = !this.isPlaying;

    if (this.masterGain) {
      const targetGain = this.isPlaying ? 0.7 : 0;
      this.masterGain.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
    }

    this.updateUI();
  }

  setAncMode(mode) {
    this.currentAncMode = mode;
    if (!this.audioCtx || !this.ancFilter || !this.ambientGain) {
      this.updateUI();
      return;
    }

    const now = this.audioCtx.currentTime;
    if (mode === 'anc') {
      // Full active phase cancellation
      this.ancFilter.type = 'lowshelf';
      this.ancFilter.gain.setTargetAtTime(-34, now, 0.08); // Silent!
      this.ambientGain.gain.setTargetAtTime(0.02, now, 0.08);
    } else if (mode === 'transparency') {
      // Transparency mode passes ambient speech & surroundings through
      this.ancFilter.type = 'peaking';
      this.ancFilter.frequency.setTargetAtTime(1400, now, 0.08);
      this.ancFilter.gain.setTargetAtTime(6, now, 0.08);
      this.ambientGain.gain.setTargetAtTime(0.25, now, 0.08);
    } else {
      // ANC OFF: Full ambient raw noise
      this.ancFilter.type = 'allpass';
      this.ancFilter.gain.setTargetAtTime(0, now, 0.08);
      this.ambientGain.gain.setTargetAtTime(0.35, now, 0.08);
    }

    this.updateUI();
  }

  setEnvironment(env) {
    this.currentEnvironment = env;
    if (!this.audioCtx || !this.envFilter) return;

    const now = this.audioCtx.currentTime;
    if (env === 'airplane') {
      this.envFilter.frequency.setTargetAtTime(260, now, 0.1);
    } else if (env === 'subway') {
      this.envFilter.frequency.setTargetAtTime(550, now, 0.1);
    } else if (env === 'cafe') {
      this.envFilter.frequency.setTargetAtTime(1200, now, 0.1);
    }
  }

  updateUI() {
    // Nav button state
    if (this.navBtn) {
      if (this.isPlaying) {
        this.navBtn.classList.add('playing');
        this.navBtn.querySelector('.audio-label').textContent = 'Audio Active';
      } else {
        this.navBtn.classList.remove('playing');
        this.navBtn.querySelector('.audio-label').textContent = 'Sound Experience';
      }
    }

    // Master button state
    if (this.masterToggle) {
      if (this.isPlaying) {
        this.masterToggle.classList.add('playing');
        this.masterToggle.textContent = 'Pause Sound Experience ⏸';
      } else {
        this.masterToggle.classList.remove('playing');
        this.masterToggle.textContent = 'Listen: Marshall Monitor III A.N.C. ▶';
      }
    }

    // Status badge
    if (this.ancStatusBadge) {
      if (this.currentAncMode === 'anc') {
        this.ancStatusBadge.innerHTML = '<span class="pulse"></span> Active Noise Cancelling (–34dB Isolation)';
        this.ancStatusBadge.style.color = '#00D6FF';
      } else if (this.currentAncMode === 'transparency') {
        this.ancStatusBadge.innerHTML = '<span class="pulse" style="background:#C5A059"></span> Transparency Mode (Spatial Awareness)';
        this.ancStatusBadge.style.color = '#C5A059';
      } else {
        this.ancStatusBadge.innerHTML = '<span class="pulse" style="background:#FF4040"></span> ANC Disabled (Raw Environment)';
        this.ancStatusBadge.style.color = '#FF7070';
      }
    }

    // Decibel meter readout
    if (this.decibelMeter) {
      if (this.currentAncMode === 'anc') {
        this.decibelMeter.textContent = 'Internal Noise: 18 dB (Quiet Studio)';
      } else if (this.currentAncMode === 'transparency') {
        this.decibelMeter.textContent = 'Internal Noise: 42 dB (Natural Ambient)';
      } else {
        this.decibelMeter.textContent = 'Internal Noise: 78 dB (Unfiltered Cabin)';
      }
    }
  }

  drawVisualizer() {
    requestAnimationFrame(() => this.drawVisualizer());
    if (!this.ctx || !this.width) return;

    const w = this.width;
    const h = this.height;

    // Clear background
    this.ctx.fillStyle = '#08080A';
    this.ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let y = 30; y < h; y += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    let barCount = 32;
    let dataArray = new Uint8Array(barCount);

    if (this.analyser && this.isPlaying) {
      const bufferLength = this.analyser.frequencyBinCount;
      const fullData = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(fullData);
      for (let i = 0; i < barCount; i++) {
        dataArray[i] = fullData[i] || 0;
      }
    } else {
      // Idle breathing wave when not playing
      const time = performance.now() * 0.002;
      for (let i = 0; i < barCount; i++) {
        dataArray[i] = Math.max(10, Math.sin(time + i * 0.3) * 20 + 25);
      }
    }

    const barWidth = (w - (barCount - 1) * 3) / barCount;
    for (let i = 0; i < barCount; i++) {
      const val = dataArray[i] / 255;
      const barHeight = Math.max(4, val * (h - 20));
      const x = i * (barWidth + 3);
      const y = h - barHeight - 10;

      // Color gradient from Marshall blue to electric cyan
      const grad = this.ctx.createLinearGradient(0, y, 0, h);
      if (this.currentAncMode === 'anc') {
        grad.addColorStop(0, '#00D6FF');
        grad.addColorStop(1, '#0050FF');
      } else if (this.currentAncMode === 'transparency') {
        grad.addColorStop(0, '#F3D99A');
        grad.addColorStop(1, '#C5A059');
      } else {
        grad.addColorStop(0, '#FF6B6B');
        grad.addColorStop(1, '#7A1C1C');
      }

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      this.ctx.fill();
    }
  }
}

window.SoundSimulator = SoundSimulator;
