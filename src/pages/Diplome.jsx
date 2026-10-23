import { useState } from 'react';
import Page from '../composants/Page.jsx';
import Logo from '../composants/Logo.jsx';
import { ReserveChef } from '../composants/Chef.jsx';
import ChoixAgent, { useAgents } from '../composants/ChoixAgent.jsx';

function aujourdhuiLong() {
  return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
}

function Diplomes() {
  const { agents, erreur } = useAgents();
  const [id, setId] = useState('');
  const agent = agents?.find((a) => a.id === id);
  return (
    <div className="pile">
      {erreur && <p className="erreur">{erreur}</p>}
      <ChoixAgent agents={agents} valeur={id} onChange={setId} />
      {agent && (
        <>
          <div className="diplome" style={{ width: '100%', maxWidth: '297mm', aspectRatio: '297 / 210', background: '#fff', border: '3px solid var(--nuit)', padding: '4%', boxSizing: 'border-box', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            <div style={{ height: '100%', border: '6px double var(--nuit)', outline: '3px solid var(--jaune)', outlineOffset: -14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', padding: '4% 6%' }}>
              <Logo taille={96} />
              <div className="mono" style={{ letterSpacing: 4, color: 'var(--rouge)', fontWeight: 800 }}>DIPLÔME OFFICIEL D'AGENT</div>
              <div style={{ fontSize: 18 }}>L'Agence M² certifie que</div>
              <div style={{ fontFamily: 'var(--titre)', fontSize: 'clamp(28px, 5vw, 56px)', lineHeight: 1 }}>{agent.nomHeros}</div>
              <div style={{ fontSize: 18, maxWidth: '50ch' }}>est devenu agent n° <b className="mono">M²-{agent.numero}</b> et a juré de protéger le QG, de garder son code secret et de respecter la charte.</div>
              <div className="mono">Fait au QG, le {aujourdhuiLong()}</div>
              <div style={{ display: 'flex', gap: '15%', width: '100%', justifyContent: 'center' }}>
                {['Maël Domenech', 'Marin Domenech'].map((n) => (
                  <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                    <div style={{ borderBottom: '2px solid var(--nuit)', height: 40 }} />
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{n}</span>
                    <span className="mono" style={{ fontSize: 11 }}>{n.startsWith('Maël') ? 'DIRECTEUR TECHNIQUE' : 'DIRECTEUR DES OPÉRATIONS'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pas-imprimer"><button className="btn principal" type="button" onClick={() => window.print()}>Imprimer (A4 paysage)</button></div>
          <style>{'@media print { @page { size: A4 landscape; margin: 0; } .diplome { width: 297mm !important; height: 210mm !important; max-width: none !important; border: 0 !important; } }'}</style>
        </>
      )}
    </div>
  );
}

export default function Diplome() {
  return (
    <Page numero="OUTIL · BONUS" titre="Diplôme d'agent" intro="Certificat A4 imprimable avec le nom de héros, la date et les signatures des chefs.">
      <ReserveChef><Diplomes /></ReserveChef>
    </Page>
  );
}
