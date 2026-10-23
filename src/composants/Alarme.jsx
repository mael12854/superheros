import { useEffect, useState } from 'react';
import { sirene } from '../lib/son.js';

// Plein écran rouge clignotant + sirène, avec compte à rebours du blocage.
export default function EcranAlarme({ jusqua, onFin }) {
  const [reste, setReste] = useState(Math.max(0, Math.ceil((jusqua - Date.now()) / 1000)));
  const [sonCoupe, setSonCoupe] = useState(false);

  useEffect(() => {
    if (sonCoupe) return undefined;
    const arreter = sirene();
    return arreter;
  }, [sonCoupe]);

  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.max(0, Math.ceil((jusqua - Date.now()) / 1000));
      setReste(r);
      if (r === 0) {
        clearInterval(t);
        onFin?.();
      }
    }, 250);
    return () => clearInterval(t);
  }, [jusqua, onFin]);

  return (
    <div className="alarme-ecran" role="alert">
      <div className="mono" style={{ letterSpacing: 3 }}>3 NON DE SUITE</div>
      <div className="grand">ALARME</div>
      <div style={{ fontFamily: 'var(--titre)', fontSize: 24 }}>Clavier bloqué</div>
      <div className="mono" style={{ fontSize: 72, fontWeight: 800 }}>{String(Math.floor(reste / 60)).padStart(2, '0')}:{String(reste % 60).padStart(2, '0')}</div>
      <p>Les chefs sont prévenus. Seul un chef peut arrêter l'alarme.</p>
      {!sonCoupe && <button className="btn" type="button" onClick={() => setSonCoupe(true)}>Couper le son</button>}
    </div>
  );
}
