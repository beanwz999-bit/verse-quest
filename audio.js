// Web Audio API Synthesizer and Web Speech API Wrapper
const AudioManager = {
  ctx: null,
  soundEnabled: true,
  speechEnabled: true,
  speechRate: 0.85, // Friendly slow speed for kids
  speechPitch: 1.1,  // Friendly higher-pitched tone
  selectedVoice: null,

  init() {
    // Initialize Web Audio Context on user interaction to satisfy browser policies
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  toggleSound(enabled) {
    this.soundEnabled = enabled;
  },

  toggleSpeech(enabled) {
    this.speechEnabled = enabled;
    if (!enabled) {
      this.stopSpeech();
    }
  },

  // Play a bubble pop sound
  playPop() {
    if (!this.soundEnabled) return;
    this.init();
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Swift frequency sweep upwards for a popping effect
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.06);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  },

  // Play a positive double-chime sound (for correct answers)
  playCorrect() {
    if (!this.soundEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();

    osc1.type = 'triangle'; // softer tone
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Second note slightly delayed and higher pitch
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
    gain2.gain.setValueAtTime(0.2, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.26);
  },

  // Play a soft mistake buzzer
  playWrong() {
    if (!this.soundEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    // Slide down frequency
    osc.frequency.linearRampToValueAtTime(90, now + 0.2);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

    // Create a lowpass filter to make it less harsh
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  },

  // Play a happy game completed arpeggio
  playVictory() {
    if (!this.soundEnabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    const duration = 0.08;

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * duration;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      // Sustain the final C6 note longer
      const noteLen = (idx === notes.length - 1) ? 0.5 : 0.15;
      const volume = (idx === notes.length - 1) ? 0.25 : 0.15;

      gain.gain.setValueAtTime(volume, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + noteLen);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + noteLen + 0.01);
    });
  },

  // --- Speech Synthesis ---
  speak(text) {
    if (!this.speechEnabled || !('speechSynthesis' in window)) return;
    
    this.stopSpeech(); // cancel any active speech

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to set a friendly voice if specified
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    } else {
      // Find first English voice
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google') || v.name.includes('Natural')) 
                   || voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.rate = this.speechRate;
    utterance.pitch = this.speechPitch;

    window.speechSynthesis.speak(utterance);
  },

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  // Fetch available English voices
  getVoices() {
    if (!('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
  },

  setVoice(voiceName) {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      this.selectedVoice = voice;
    }
  }
};

// Handle voices changing asynchronously in some browsers
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    // pre-fetch/cache voices
    AudioManager.getVoices();
  };
}

// Export
window.AudioManager = AudioManager;
