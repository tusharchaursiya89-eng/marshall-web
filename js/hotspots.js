/**
 * MARSHALL MONITOR III A.N.C. — INTERACTIVE COMPONENT HOTSPOTS & TELEMETRY
 * Detailed Technical Architecture Exploration with Floating Tooltips & Spec Drawer
 */

const HOTSPOT_DATA = {
  driver: {
    tag: 'ACOUSTIC TRANSDUCER',
    name: 'Custom 32mm Dynamic Driver',
    desc: 'Engineered specifically for Monitor III A.N.C, this 32mm dynamic driver utilizes a high-compliance diaphragm coupled with a lightweight copper-clad aluminum voice coil to deliver deep, articulate bass, open midrange, and shimmering rock-and-roll highs.',
    stats: [
      { label: 'Driver Type', value: 'Dynamic 32mm' },
      { label: 'Frequency Range', value: '20 Hz – 20 kHz' },
      { label: 'Sensitivity', value: '91.7 dB SPL' },
      { label: 'Impedance', value: '35 Ω' }
    ]
  },
  ancMics: {
    tag: 'ACTIVE ISOLATION',
    name: 'Quad-Microphone Beamforming Array',
    desc: 'Dual external feedforward microphones work in tandem with dual internal feedback microphones to continuously measure ambient noise 1,000 times per second, generating an inverted anti-phase wave that cancels engine roar and chatter.',
    stats: [
      { label: 'Microphones', value: '4 × Digital MEMS' },
      { label: 'Sampling Rate', value: '48 kHz / 24-bit' },
      { label: 'Wind Noise Filter', value: 'Acoustic Mesh' },
      { label: 'Latency', value: '< 1.2 ms' }
    ]
  },
  brassKnob: {
    tag: 'TACTILE CONTROL',
    name: 'Multi-Directional Brass Control Knob',
    desc: 'The iconic Marshall solid brass control knob gives tactile command over your audio world. Nudge up/down for volume, click forward/back for tracks, or push to play, pause, answer calls, or engage voice assistants.',
    stats: [
      { label: 'Material', value: 'Precision Solid Brass' },
      { label: 'Knurling', value: 'Diamond-Cut Texture' },
      { label: 'Actuation', value: '5-Way Joystick' },
      { label: 'Cycle Rating', value: '100,000+ Clicks' }
    ]
  },
  pcb: {
    tag: 'INTELLIGENT PROCESSING',
    name: 'Bluetooth 5.3 Low-Energy DSP Motherboard',
    desc: 'Houses the ultra-low-power DSP processor, custom Marshall Soundstage spatial audio engine, high-resolution DAC, and next-generation Bluetooth LE Audio with Auracast™ broadcast support.',
    stats: [
      { label: 'Bluetooth', value: 'Version 5.3 LE' },
      { label: 'Broadcast', value: 'Auracast™ Ready' },
      { label: 'DSP Engine', value: '32-bit Floating' },
      { label: 'Multipoint', value: 'Simultaneous Dual' }
    ]
  },
  headband: {
    tag: 'CHASSIS & ERGONOMICS',
    name: 'Collapsible Steel Headband & Textured Leather',
    desc: 'Engineered for years of tours and daily commuting. Features reinforced stainless steel sliding arms, durable cast metal hinges, signature textured black vinyl leatherette, and ultra-compact folding capability.',
    stats: [
      { label: 'Material', value: 'Stainless Steel & Vinyl' },
      { label: 'Hinge Design', value: 'Collapsible 3D Fold' },
      { label: 'Clamping Force', value: 'Calibrated 4.2 N' },
      { label: 'Weight', value: '250 g (8.8 oz)' }
    ]
  },
  cushions: {
    tag: 'PASSIVE ISOLATION',
    name: 'Ergonomic Memory Foam Ear Cushions',
    desc: 'Ultra-soft slow-rebound memory foam enclosed in premium breathable protein leather conforms perfectly to the contours of your head, establishing an airtight acoustic seal for maximum passive bass extension.',
    stats: [
      { label: 'Foam Type', value: 'Viscoelastic Memory' },
      { label: 'Covering', value: 'Breathable Leatherette' },
      { label: 'Replaceable', value: 'Twist-Lock System' },
      { label: 'Acoustic Seal', value: '–18 dB Passive' }
    ]
  }
};

class HotspotController {
  constructor() {
    this.modal = document.getElementById('telemetryModal');
    this.closeBtn = document.getElementById('telemetryCloseBtn');
    this.tagEl = document.getElementById('telemetryTag');
    this.nameEl = document.getElementById('telemetryName');
    this.descEl = document.getElementById('telemetryDesc');
    this.gridEl = document.getElementById('telemetryGrid');

    this.init();
  }

  init() {
    const pins = document.querySelectorAll('.hotspot-pin');
    pins.forEach(pin => {
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        const partKey = pin.getAttribute('data-part');
        if (partKey && HOTSPOT_DATA[partKey]) {
          this.showTelemetry(HOTSPOT_DATA[partKey]);
        }
      });
    });

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.hideTelemetry());
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.modal && this.modal.classList.contains('open') && !this.modal.contains(e.target)) {
        this.hideTelemetry();
      }
    });

    // Close on escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hideTelemetry();
    });
  }

  showTelemetry(data) {
    if (!this.modal) return;
    this.tagEl.textContent = data.tag;
    this.nameEl.textContent = data.name;
    this.descEl.textContent = data.desc;

    this.gridEl.innerHTML = '';
    data.stats.forEach(stat => {
      const card = document.createElement('div');
      card.className = 'telemetry-stat-item';
      card.innerHTML = `
        <div class="telemetry-stat-label">${stat.label}</div>
        <div class="telemetry-stat-value">${stat.value}</div>
      `;
      this.gridEl.appendChild(card);
    });

    this.modal.classList.add('open');
  }

  hideTelemetry() {
    if (this.modal) {
      this.modal.classList.remove('open');
    }
  }
}

window.HotspotController = HotspotController;
