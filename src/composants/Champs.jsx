import { useRef, useState } from 'react';

// Code secret : 4 cases, un rond par chiffre tapé, jamais en clair.
// 4 cases au départ ; jusqu'à 6 si le code est plus long (comme celui de Maël).
export function ChampCode({ valeur, onChange, sombre = false, autoFocus = false, onValider, montrer = false }) {
  const [focus, setFocus] = useState(false);
  const ref = useRef(null);
  const nbCases = Math.min(6, Math.max(4, valeur.length + (valeur.length >= 4 && valeur.length < 6 ? 1 : 0)));
  return (
    <div className={`code-cases${sombre ? ' sombre' : ''}${focus ? ' focus' : ''}`}>
      {Array.from({ length: nbCases }, (_, i) => (
        <div key={i} className={`code-case${valeur[i] ? ' remplie' : ''}${i === Math.min(valeur.length, nbCases - 1) ? ' active' : ''}`}>
          {valeur[i] ? (montrer ? <span className="mono">{valeur[i]}</span> : '●') : ''}
        </div>
      ))}
      <input
        ref={ref}
        aria-label="Code secret (4 à 6 chiffres)"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        autoFocus={autoFocus}
        value={valeur}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onKeyDown={(e) => { if (e.key === 'Enter' && valeur.length >= 4 && onValider) onValider(); }}
      />
    </div>
  );
}

// Date : on tape les chiffres, les « / » arrivent tout seuls → 12 / 03 / 2016
export function masqueDate(brut) {
  const c = brut.replace(/\D/g, '').slice(0, 8);
  const parts = [c.slice(0, 2), c.slice(2, 4), c.slice(4)].filter(Boolean);
  return parts.join(' / ');
}

// Heure : 1830 → 18 : 30
export function masqueHeure(brut) {
  const c = brut.replace(/\D/g, '').slice(0, 4);
  return c.length > 2 ? `${c.slice(0, 2)} : ${c.slice(2)}` : c;
}

export function Champ({ type = 'texte', valeur, onChange, faux, ...reste }) {
  const props = { className: `champ${faux ? ' faux' : ''}`, value: valeur, ...reste };
  if (type === 'date') {
    return <input {...props} className={props.className + ' mono'} inputMode="numeric" placeholder="JJ / MM / AAAA" onChange={(e) => onChange(masqueDate(e.target.value))} />;
  }
  if (type === 'heure') {
    return <input {...props} className={props.className + ' mono'} inputMode="numeric" placeholder="HH : MM" onChange={(e) => onChange(masqueHeure(e.target.value))} />;
  }
  if (type === 'nombre') {
    return <input {...props} className={props.className + ' mono'} inputMode="numeric" onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, reste.maxLength || 6))} />;
  }
  return <input {...props} autoComplete="off" autoCapitalize="sentences" spellCheck={false} onChange={(e) => onChange(e.target.value)} />;
}
