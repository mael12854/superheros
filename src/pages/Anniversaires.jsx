import { useEffect, useState } from 'react';
import Page from '../composants/Page.jsx';
import { api } from '../lib/api.js';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export default function Anniversaires() {
  const [liste, setListe] = useState(null);
  useEffect(() => { api('anniversaires').then((r) => setListe(r.anniversaires)).catch(() => setListe([])); }, []);
  return (
    <Page numero="OUTIL · BONUS" titre="Anniversaires" intro="Les prochains anniversaires des agents.">
      <div className="grille">
        {liste?.map((a, i) => (
          <div key={i} className="carte ombre" style={a.dans === 0 ? { background: 'var(--jaune)' } : undefined}>
            <span className="mono" style={{ fontSize: 14 }}>{a.jour} {MOIS[a.mois - 1]}</span>
            <h3>{a.nomHeros}</h3>
            <span style={{ fontFamily: 'var(--titre)', fontSize: 22 }}>
              {a.dans === 0 ? `🎂 C'est aujourd'hui ! ${a.age} ans` : `${a.age} ans dans ${a.dans} jour${a.dans > 1 ? 's' : ''}`}
            </span>
          </div>
        ))}
      </div>
      {liste?.length === 0 && <div className="carte"><p>Aucun agent inscrit.</p></div>}
    </Page>
  );
}
