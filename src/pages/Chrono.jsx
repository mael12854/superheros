import { useEffect, useRef, useState } from 'react';
import { Barre } from '../composants/Page.jsx';
import { sirene } from '../lib/son.js';

export default function Chrono() {
  const [minutes, setMinutes] = useState(5);
  const [secondes, setSecondes] = useState(0);
  const [fin, setFin] = useState(0); // heure de fin (ms) quand ça tourne
  const [pause, setPause] = useState(null); // ms restantes en pause
  const [reste, setReste] = useState(0);
  const [sonne, setSonne] = useState(false);
  const arretSon = useRef(null);

  useEffect(() => { document.title = 'Chronomètre · Agence M²'; }, []);

  useEffect(() => {
    if (!fin) return undefined;
    const t = setInterval(() => {
      const r = Math.max(0, fin - Date.now());
      setReste(r);
      if (r === 0) {
        setFin(0);
        setSonne(true);
        arretSon.current = sirene();
      }
    }, 100);
    return () => clearInterval(t);
  }, [fin]);

  useEffect(() => () => arretSon.current?.(), []);

  const total = (minutes * 60 + secondes) * 1000;
  const affiche = fin ? reste : pause ?? total;
  const s = Math.ceil(affiche / 1000);
  const texte = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const demarrer = () => { setFin(Date.now() + (pause ?? total)); setPause(null); };
  const arreter = () => { setPause(reste); setFin(0); };
  const remettre = () => { setFin(0); setPause(null); setSonne(false); arretSon.current?.(); };

  return (
    <div className={sonne ? 'alarme-ecran' : ''} style={sonne ? undefined : { minHeight: '100vh', background: 'var(--nuit)', color: 'var(--papier)' }}>
      {!sonne && <Barre />}
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '32px 16px', textAlign: 'center' }}>
        <div className="mono" style={{ color: sonne ? '#fff' : 'var(--jaune)', letterSpacing: 3 }}>{sonne ? 'TEMPS ÉCOULÉ !' : 'CHRONOMÈTRE DE MISSION'}</div>
        <div className="mono" style={{ fontSize: 'clamp(80px, 24vw, 280px)', fontWeight: 800, lineHeight: 1 }}>{texte}</div>
        {!fin && pause === null && !sonne && (
          <div className="rangee" style={{ justifyContent: 'center' }}>
            {[[1, 'min'], [5, 'min'], [10, 'min'], [30, 's']].map(([v, u]) => (
              <button key={v + u} type="button" className="btn petit" onClick={() => { setMinutes(u === 'min' ? v : 0); setSecondes(u === 's' ? v : 0); }}>{v} {u}</button>
            ))}
            <label className="rangee" style={{ gap: 6 }}>
              <input className="champ mono" style={{ width: 80 }} type="number" min="0" max="180" value={minutes} onChange={(e) => setMinutes(Math.max(0, Math.min(180, +e.target.value || 0)))} aria-label="Minutes" /> min
              <input className="champ mono" style={{ width: 80 }} type="number" min="0" max="59" value={secondes} onChange={(e) => setSecondes(Math.max(0, Math.min(59, +e.target.value || 0)))} aria-label="Secondes" /> s
            </label>
          </div>
        )}
        <div className="rangee" style={{ justifyContent: 'center' }}>
          {sonne ? <button className="btn principal" type="button" onClick={remettre}>Arrêter l'alarme</button> : fin ? (
            <button className="btn" type="button" onClick={arreter}>Pause</button>
          ) : (
            <button className="btn principal" type="button" onClick={demarrer} disabled={total === 0 && pause === null}>{pause !== null ? 'Reprendre' : 'Démarrer'}</button>
          )}
          {!sonne && (fin || pause !== null) ? <button className="btn" type="button" onClick={remettre}>Remettre à zéro</button> : null}
          {!sonne && <button className="btn" type="button" onClick={() => document.documentElement.requestFullscreen?.()}>Plein écran</button>}
        </div>
      </main>
    </div>
  );
}
