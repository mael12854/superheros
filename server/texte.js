// Outils pour comparer les réponses : sans majuscules, sans accents.

export function normaliser(valeur) {
  return String(valeur ?? '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function chiffres(valeur) {
  return String(valeur ?? '').replace(/\D/g, '');
}

export function identique(a, b) {
  const na = normaliser(a);
  return na !== '' && na === normaliser(b);
}

// Distance de Levenshtein : combien de lettres à changer pour passer de a à b.
export function distance(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  let precedente = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const courante = [i];
    for (let j = 1; j <= n; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      courante[j] = Math.min(precedente[j] + 1, courante[j - 1] + 1, precedente[j - 1] + cout);
    }
    precedente = courante;
  }
  return precedente[n];
}

// Sortie : une petite faute (1 lettre) est acceptée.
export function presque(a, b) {
  const na = normaliser(a);
  const nb = normaliser(b);
  if (!na || !nb) return false;
  return distance(na, nb) <= 1;
}

// Identifiant d'agent à partir du nom de héros : « Captain Circuit » → « captain-circuit ».
export function slug(valeur) {
  return normaliser(valeur).replace(/ /g, '-').slice(0, 60);
}

// Nombre de lettres dans le nom de héros (sans espaces ni tirets).
export function compterLettres(valeur) {
  return (String(valeur ?? '').match(/\p{L}/gu) || []).length;
}

// « 12/03/2016 » ou « 2016-03-12 » → « 2016-03-12 » (ou null si impossible).
export function dateISO(valeur) {
  const v = String(valeur ?? '').trim();
  let j, m, a;
  let r = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (r) [, a, m, j] = r;
  else {
    const c = chiffres(v);
    if (c.length !== 8) return null;
    j = c.slice(0, 2);
    m = c.slice(2, 4);
    a = c.slice(4);
  }
  const d = new Date(Date.UTC(+a, +m - 1, +j));
  if (d.getUTCFullYear() !== +a || d.getUTCMonth() !== +m - 1 || d.getUTCDate() !== +j) return null;
  return `${a}-${m}-${j}`;
}

export function memeDate(saisie, iso) {
  const d = dateISO(saisie);
  return d !== null && d === iso;
}
