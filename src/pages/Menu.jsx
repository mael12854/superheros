import { useEffect, useState } from 'react';
import Page from '../composants/Page.jsx';
import { api } from '../lib/api.js';

const auHasard = (liste) => (liste.length ? liste[Math.floor(Math.random() * liste.length)] : '—');

export default function Menu() {
  const [data, setData] = useState(null);
  const [menu, setMenu] = useState(null);

  useEffect(() => {
    api('menu').then((d) => {
      setData(d);
      setMenu({ entree: auHasard(d.entrees), plat: auHasard(d.plats), dessert: auHasard(d.desserts) });
    }).catch(() => {});
  }, []);

  const relancer = () => setMenu({ entree: auHasard(data.entrees), plat: auHasard(data.plats), dessert: auHasard(data.desserts) });

  return (
    <Page numero="OUTIL · BONUS" titre="Menu du QG" intro="Un menu entrée-plat-dessert avec les plats préférés des agents qui sont au QG en ce moment.">
      {data && data.nbPresents === 0 && <div className="carte"><p>Personne n'est au QG. Les agents doivent d'abord passer le contrôle d'entrée.</p></div>}
      {data && data.nbPresents > 0 && menu && (
        <div className="carte ombre" style={{ maxWidth: 520, alignItems: 'center', textAlign: 'center', gap: 20, padding: 40 }}>
          <span className="mono">MENU POUR {data.nbPresents} AGENT{data.nbPresents > 1 ? 'S' : ''}</span>
          {[['ENTRÉE', menu.entree], ['PLAT', menu.plat], ['DESSERT', menu.dessert]].map(([t, v]) => (
            <div key={t} className="pile" style={{ gap: 4 }}>
              <span className="mono" style={{ color: 'var(--rouge)', fontWeight: 800 }}>{t}</span>
              <span style={{ fontFamily: 'var(--titre)', fontSize: 28 }}>{v}</span>
            </div>
          ))}
          <button className="btn principal" type="button" onClick={relancer}>Autre menu</button>
        </div>
      )}
    </Page>
  );
}
