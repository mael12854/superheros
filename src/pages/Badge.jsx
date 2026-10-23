import { useEffect, useState } from 'react';
import Page from '../composants/Page.jsx';
import { ReserveChef } from '../composants/Chef.jsx';
import ChoixAgent, { useAgents } from '../composants/ChoixAgent.jsx';
import { urlPhoto } from '../lib/api.js';

// Carte au format carte bancaire : 85 × 54 mm. Jamais le code secret dessus.
function Carte({ agent }) {
  const [photo, setPhoto] = useState(null);
  useEffect(() => {
    let url;
    setPhoto(null);
    if (agent.photo) urlPhoto(agent.id).then((u) => { url = u; setPhoto(u); });
    return () => url && URL.revokeObjectURL(url);
  }, [agent]);
  const chef = agent.role === 'chef';
  return (
    <div className="badge" style={{ width: '85mm', height: '54mm', background: 'var(--nuit)', color: 'var(--papier)', borderRadius: '3.5mm', overflow: 'hidden', display: 'grid', gridTemplateColumns: '27mm 1fr', boxShadow: '5px 5px 0 var(--nuit)', border: '0.6mm solid var(--nuit)', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
      <div style={{ background: chef ? 'var(--rouge)' : 'var(--bleu)', padding: '3mm', display: 'flex', flexDirection: 'column', gap: '2mm', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '21mm', height: '21mm', borderRadius: '2mm', overflow: 'hidden', border: '0.6mm solid var(--papier)', background: 'var(--papier)' }}>
          {photo ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="photo-vide" style={{ fontSize: 8 }}>photo</div>}
        </div>
        <span className="mono" style={{ fontSize: '2.6mm', fontWeight: 800 }}>{chef ? 'CHEF' : 'AGENT'}</span>
      </div>
      <div style={{ padding: '3mm 3.5mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="mono" style={{ fontSize: '2.2mm', letterSpacing: '0.4mm', color: 'var(--jaune)' }}>AGENCE M²<br />CARTE OFFICIELLE</span>
          <div style={{ width: '11mm', height: '11mm', borderRadius: '50%', background: 'var(--jaune)', border: '0.7mm solid var(--papier)', boxShadow: '0 0 0 0.6mm var(--rouge)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--titre)', fontSize: '4.2mm', color: 'var(--nuit)' }}>M²</div>
        </div>
        <div style={{ fontFamily: 'var(--titre)', fontSize: agent.nomHeros.length > 16 ? '4mm' : '5mm', lineHeight: 1.05 }}>{agent.nomHeros}</div>
        <div className="mono" style={{ fontSize: '2.6mm' }}>
          <div>N° D'AGENT</div>
          <div style={{ fontSize: '5mm', fontWeight: 800, color: 'var(--jaune)', letterSpacing: '0.6mm' }}>M²-{agent.numero}</div>
        </div>
      </div>
    </div>
  );
}

function Badges() {
  const { agents, erreur } = useAgents();
  const [id, setId] = useState(new URLSearchParams(window.location.search).get('id') || '');
  const agent = agents?.find((a) => a.id === id);
  return (
    <div className="pile">
      {erreur && <p className="erreur">{erreur}</p>}
      <ChoixAgent agents={agents} valeur={id} onChange={setId} />
      {agent && (
        <>
          <Carte agent={agent} />
          <div className="pas-imprimer"><button className="btn principal" type="button" onClick={() => window.print()}>Imprimer</button></div>
          <p className="pas-imprimer" style={{ fontSize: 15 }}>Astuce : dans la fenêtre d'impression, mets l'échelle à 100 % et coche « graphiques d'arrière-plan ».</p>
        </>
      )}
      <style>{'@media print { .badge { box-shadow: none !important; } }'}</style>
    </div>
  );
}

export default function Badge() {
  return (
    <Page numero="OUTIL · PRIORITÉ" titre="Badge imprimable" intro="Carte au format carte bancaire (85 × 54 mm) : photo, nom de héros, n° d'agent et logo. Jamais le code secret.">
      <ReserveChef><Badges /></ReserveChef>
    </Page>
  );
}

