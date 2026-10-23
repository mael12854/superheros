// Sons fabriqués par le navigateur (pas de fichier à télécharger).
let ctx;
function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function bip(frequence = 880, duree = 0.15, type = 'square') {
  try {
    const c = audio();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = frequence;
    g.gain.value = 0.08;
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + duree);
  } catch { /* pas de son, pas grave */ }
}

export function sonOui() {
  bip(660, 0.12, 'sine');
  setTimeout(() => bip(990, 0.2, 'sine'), 130);
}

export function sonNon() {
  bip(220, 0.35, 'sawtooth');
}

// Sirène : renvoie une fonction pour l'arrêter.
export function sirene() {
  try {
    const c = audio();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sawtooth';
    g.gain.value = 0.07;
    o.connect(g).connect(c.destination);
    const t = c.currentTime;
    for (let i = 0; i < 120; i++) {
      o.frequency.setValueAtTime(600, t + i);
      o.frequency.linearRampToValueAtTime(1200, t + i + 0.5);
      o.frequency.linearRampToValueAtTime(600, t + i + 1);
    }
    o.start();
    return () => { try { o.stop(); } catch { /* déjà arrêté */ } };
  } catch {
    return () => {};
  }
}
