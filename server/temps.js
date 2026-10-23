// L'heure du QG : toujours celle de Paris, même si le serveur est ailleurs.
const FUSEAU = 'Europe/Paris';

function morceaux(date = new Date()) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: FUSEAU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const o = {};
  for (const p of parts) o[p.type] = p.value;
  return o;
}

// « 2026-10-23 »
export function aujourdhui(date = new Date()) {
  const o = morceaux(date);
  return `${o.year}-${o.month}-${o.day}`;
}

// « 16:42 »
export function heure(date = new Date()) {
  const o = morceaux(date);
  return `${o.hour}:${o.minute}`;
}

export function ageLe(dateNaissanceISO, jourISO = aujourdhui()) {
  const [an, mn, jn] = dateNaissanceISO.split('-').map(Number);
  const [a, m, j] = jourISO.split('-').map(Number);
  let age = a - an;
  if (m < mn || (m === mn && j < jn)) age--;
  return age;
}

export function dateValide(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso || '');
}
