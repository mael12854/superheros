import { useEffect, useState } from 'react';
import Logo from '../composants/Logo.jsx';
import { Barre } from '../composants/Page.jsx';
import { OUTILS } from '../outils.js';
import { api } from '../lib/api.js';

export default function Accueil() {
  const [etat, setEtat] = useState(null);
  useEffect(() => {
    document.title = 'QG de l\'Agence M²';
    api('etat').then(setEtat).catch(() => {});
  }, []);

  return (
    <>
      <Barre />
      <main className="contenu" style={{ gap: 48 }}>
        <section style={{ background: 'var(--nuit)', color: 'var(--papier)', borderRadius: 20, padding: '40px 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, alignItems: 'center' }}>
          <div className="pile">
            <div className="mono" style={{ fontSize: 13, letterSpacing: 3, color: 'var(--jaune)' }}>DOCUMENT CLASSÉ · NIVEAU AGENT</div>
            <h1 style={{ fontSize: 'clamp(40px, 7vw, 72px)', lineHeight: 0.95 }}>QG de l'Agence M²</h1>
            <p style={{ fontSize: 20, maxWidth: '44ch' }}>Ici on surveille qui entre et qui sort. M² = <b>M</b>aël + <b>M</b>arin Domenech.</p>
            <div className="rangee" style={{ marginTop: 8 }}>
              <a className="btn principal" href="/entree">Entrer au QG</a>
              <a className="btn" href="/sortie">Sortir du QG</a>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Logo taille={220} fond="nuit" />
          </div>
        </section>

        {etat && !etat.installe && (
          <div className="carte alerte ombre">
            <h2 style={{ fontSize: 24 }}>Le QG n'est pas encore installé</h2>
            <p>Il faut d'abord créer le premier chef (Maël ou Marin).</p>
            <div><a className="btn principal" href="/installation">Installer le QG</a></div>
          </div>
        )}

        <section className="pile">
          <div className="surtitre">LES OUTILS DU QG</div>
          <h2>18 outils + les visiteurs</h2>
          <div className="grille">
            {OUTILS.map((o) => (
              <a key={o.chemin} className="tuile" href={o.chemin}>
                <div className="tuile-haut">
                  <b>{o.nom}</b>
                  <span className={`etiq ${o.etiq}`}>{o.etiq === 'priorite' ? 'PRIORITÉ' : o.etiq === 'nouveau' ? 'NOUVEAU' : 'BONUS'}</span>
                </div>
                <span>{o.texte}</span>
                {o.chef && <span className="etiq chef">🔒 CHEF</span>}
              </a>
            ))}
          </div>
        </section>

        <section className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <a className="tuile" href="/charte.html">
            <b>La charte officielle</b>
            <span>Logo, couleurs, polices et règles de l'Agence M².</span>
          </a>
          <a className="tuile" href="/agents">
            <div className="tuile-haut"><b>Les agents</b><span className="etiq chef">🔒 CHEF</span></div>
            <span>Liste des agents, changer un code, retirer un agent.</span>
          </a>
        </section>
      </main>
    </>
  );
}
