// Web Audio API Synthesizer for H.O.L.M.E.V. HUD Interface

let audioCtx: AudioContext | null = null;
let humOscillator: OscillatorNode | null = null;
let humGainNode: GainNode | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

// Play a quick high-tech chirp click
export const playChirp = () => {
  try {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (e) {
    console.warn("Audio Context blocked or unsupported:", e);
  }
};

// Play a high-tech data transfer sound
export const playDataTick = () => {
  try {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) {}
};

// Play validation / confirm tone
export const playConfirm = () => {
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.setValueAtTime(900, now + 0.08);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.setValueAtTime(1800, now + 0.08);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.22);
    osc2.stop(now + 0.22);
  } catch (e) {}
};

// Play critical mode / warning sirens
export const playWarning = () => {
  try {
    initAudio();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.15);
    osc.frequency.linearRampToValueAtTime(180, now + 0.3);
    osc.frequency.linearRampToValueAtTime(320, now + 0.45);
    osc.frequency.linearRampToValueAtTime(180, now + 0.6);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(now + 0.75);
  } catch (e) {}
};

// Toggle low frequency reactor hum
export const startReactorHum = (isOverclocked = false) => {
  try {
    initAudio();
    if (!audioCtx) return;

    if (humOscillator) {
      // Adjust existing hum frequency
      const targetFreq = isOverclocked ? 90 : 55;
      humOscillator.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + 1.0);
      return;
    }

    humOscillator = audioCtx.createOscillator();
    humGainNode = audioCtx.createGain();

    humOscillator.type = 'triangle';
    humOscillator.frequency.setValueAtTime(isOverclocked ? 90 : 55, audioCtx.currentTime);

    // Dynamic low-frequency modulation (LFO) for sci-fi filter effect
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.4; // 0.4Hz slow sweep
    lfoGain.gain.value = 10; // sweep +/- 10Hz

    lfo.connect(lfoGain);
    lfoGain.connect(humOscillator.frequency);

    // Soft ambient level
    humGainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);

    humOscillator.connect(humGainNode);
    humGainNode.connect(audioCtx.destination);

    lfo.start();
    humOscillator.start();
  } catch (e) {}
};

export const stopReactorHum = () => {
  if (humOscillator) {
    try {
      humOscillator.stop();
      humOscillator.disconnect();
    } catch (e) {}
    humOscillator = null;
  }
  if (humGainNode) {
    humGainNode.disconnect();
    humGainNode = null;
  }
};

// Text-to-Speech using window.speechSynthesis
export const speak = (text: string) => {
  if (!('speechSynthesis' in window)) return;
  
  // Cancel previous speech to prevent cue stacking
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a cool english voice (preferably male or robotic-sounding)
  const voices = window.speechSynthesis.getVoices();
  const selectVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David')));
  if (selectVoice) {
    utterance.voice = selectVoice;
  }
  
  utterance.pitch = 0.85; // Slightly lower pitch for mature/Jarvis feel
  utterance.rate = 1.05; // Slightly faster speaking rate
  utterance.volume = 0.85;
  
  window.speechSynthesis.speak(utterance);
};
