/**
 * Sound + vibration after each scan, so operators do not need to look at
 * the screen. Browsers only allow sound after a tap, so unlockAudio() is
 * called from the "Start" buttons. Vibration is not supported on iPhone.
 */
let audioContext = null;

export function unlockAudio() {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext = audioContext || new Context();
    if (audioContext.state === "suspended") audioContext.resume();
  } catch {
    audioContext = null;
  }
}

function tone(frequency, durationMs) {
  if (!audioContext) return;
  try {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.06;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + durationMs / 1000);
  } catch {
    // sound is optional
  }
}

function vibrate(pattern) {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

export function feedbackSuccess() {
  tone(1046, 110);
  vibrate(60);
}

export function feedbackError() {
  tone(220, 380);
  vibrate([120, 80, 120]);
}

export function newScanId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
