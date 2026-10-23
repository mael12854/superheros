import { useEffect, useState } from 'react';
import Page from '../composants/Page.jsx';
import { ReserveChef } from '../composants/Chef.jsx';
import { api } from '../lib/api.js';

function Mot() {
  const [r, setR] = useState(null);
  const [voir, setVoir] = useState(false);
  useEffect(() => { api('mot-du-jour').then(setR).catch(() => {}); }, []);
  if (!r) return <p>Chargement…</p>;
  return (
    <div className="carte nuit ombre" style={{ maxWidth: 560, alignItems: 'center', textAlign: 'center', gap: 20 }}>
      <span className="mono" style={{ color: 'var(--jaune)' }}>MOT DU {r.date.split('-').reverse().join('/')}</span>
      <div style={{ fontFamily: 'var(--titre)', fontSize: 'clamp(36px, 8vw, 64px)', filter: voir ? 'none' : 'blur(18px)', transition: 'filter .2s' }}>{r.mot}</div>
      <button className="btn principal" type="button" onClick={() => setVoir(!voir)}>{voir ? 'Cacher' : 'Montrer le mot'}</button>
    </div>
  );
}

export default function MotDuJour() {
  return (
    <Page numero="OUTIL · BONUS" titre="Mot de passe du jour" intro="Un mot qui change chaque matin. Les chefs le disent à voix haute aux agents.">
      <ReserveChef><Mot /></ReserveChef>
    </Page>
  );
}
