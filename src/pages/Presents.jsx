import { useEffect, useState } from 'react';
import { Barre } from '../composants/Page.jsx';
import { api } from '../lib/api.js';

// Écran géant : se met à jour tout seul toutes les 15 secondes.
export default function Presents() {
  const [agents, setAgents] = useState(null);
  const [visiteurs, setVisiteurs] = useState([]);
  useEffect(() => {
    document.title = 'Qui est au QG ? · Agence M²';
    const charger = () => api('presents').then((r) => { setAgents(r.agents); setVisiteurs(r.visiteurs || []); }).catch(() => {});
    charger();
    const t = setInterval(charger, 15000);
    return () => clearInterval(t);
  }, []);

  const dedans = agents?.filter((a) => a.etat === 'dedans').length ?? 0;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--nuit)', color: 'var(--papier)' }}>
      <Barre />
      <main className="contenu">
        <div className="entete">
          <div className="mono" style={{ color: 'var(--jaune)', letterSpacing: 3 }}>EN DIRECT</div>
          <h1 style={{ fontSize: 'clamp(40px, 8vw, 80px)' }}>Qui est au QG ?</h1>
          <p className="mono" style={{ fontSize: 24 }}>{dedans} agent{dedans > 1 ? 's' : ''} dedans</p>
        </div>
        <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {agents?.map((a) => (
            <div key={a.id} style={{ borderRadius: 18, border: '3px solid var(--papier)', padding: 24, background: a.etat === 'dedans' ? 'var(--vert)' : 'var(--gris-trait)', opacity: a.etat === 'dedans' ? 1 : 0.7, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="mono" style={{ fontSize: 13 }}>AGENT N° {a.numero}</span>
              <span style={{ fontFamily: 'var(--titre)', fontSize: 26, lineHeight: 1.1 }}>{a.nomHeros}</span>
              <span style={{ fontFamily: 'var(--titre)', fontSize: 18 }}>{a.etat === 'dedans' ? '● DEDANS' : '○ DEHORS'}</span>
              {a.depuis && <span className="mono" style={{ fontSize: 13 }}>depuis {a.depuis.slice(8, 10)}/{a.depuis.slice(5, 7)} {a.depuis.slice(11)}</span>}
            </div>
          ))}
        </div>
        {agents?.length === 0 && <p>Aucun agent inscrit pour l'instant.</p>}
        {visiteurs.length > 0 && (
          <>
            <h2 style={{ marginTop: 16 }}>Visiteurs au QG</h2>
            <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {visiteurs.map((v) => (
                <div key={v.id} style={{ borderRadius: 18, border: '3px solid var(--jaune)', padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span className="mono" style={{ fontSize: 13, color: 'var(--jaune)' }}>VISITEUR</span>
                  <span style={{ fontFamily: 'var(--titre)', fontSize: 22 }}>{v.nom}</span>
                  <span>{v.lien}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
