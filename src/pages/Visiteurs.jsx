import { useEffect, useState } from 'react';
import Page, { useSession } from '../composants/Page.jsx';
import { Champ, ChampCode } from '../composants/Champs.jsx';
import { api } from '../lib/api.js';
import { CHAMPS_VISITEUR, NOMS_CHAMPS } from '../champsVisiteur.js';

// Un visiteur (famille, copain…) crée son compte. Un chef doit ensuite le valider.
function Formulaire() {
  const [f, setF] = useState({});
  const [code, setCode] = useState('');
  const [code2, setCode2] = useState('');
  const [erreur, setErreur] = useState('');
  const [fini, setFini] = useState(null);
  const [occupe, setOccupe] = useState(false);

  async function envoyer(e) {
    e.preventDefault();
    if (code !== code2) { setErreur('Les deux codes ne sont pas pareils.'); return; }
    setErreur('');
    setOccupe(true);
    try {
      const r = await api('visiteurs', { methode: 'POST', corps: { ...f, code } });
      setFini(r.visiteur);
    } catch (err) { setErreur(err.message); } finally { setOccupe(false); }
  }

  if (fini) {
    return (
      <div className="carte ombre" style={{ maxWidth: 560, background: 'var(--jaune)' }}>
        <span className="mono" style={{ fontSize: 13 }}>COMPTE VISITEUR EN ATTENTE</span>
        <h2>Merci, {fini.prenom} !</h2>
        <p>Maël ou Marin doit maintenant valider ton compte. Ensuite, au contrôle d'entrée, choisis « Je suis un visiteur » et réponds aux 14 questions : exactement les réponses que tu viens d'écrire.</p>
        <div><a className="btn" href="/">Retour au QG</a></div>
      </div>
    );
  }

  return (
    <form className="carte ombre" onSubmit={envoyer}>
      <span className="mono" style={{ fontSize: 13, color: 'var(--bleu)' }}>NOUVEAU COMPTE VISITEUR</span>
      <p style={{ fontSize: 16 }}>Retiens bien tes réponses : le contrôle d'entrée te les demandera toutes (14 questions).</p>
      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {CHAMPS_VISITEUR.map((c) => (
          <label key={c.cle} className="etiquette">
            <span>{c.label}</span>
            <Champ type={c.type} valeur={f[c.cle] || ''} onChange={(v) => setF((x) => ({ ...x, [c.cle]: v }))} maxLength={c.maxLength || 120} placeholder={c.placeholder} required />
          </label>
        ))}
      </div>
      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="etiquette"><span>Choisis un code secret (4 à 6 chiffres)</span><ChampCode valeur={code} onChange={setCode} /></div>
        <div className="etiquette"><span>Tape-le encore une fois</span><ChampCode valeur={code2} onChange={setCode2} /></div>
      </div>
      <span style={{ fontSize: 15 }}>Pas de 1234, 0000, 1111 ou 1212. Ne le dis à personne.</span>
      {erreur && <div className="erreur" role="alert">{erreur}</div>}
      <div><button className="btn principal" type="submit" disabled={occupe || code.length < 4 || code2.length < 4}>{occupe ? '…' : 'Créer mon compte'}</button></div>
    </form>
  );
}

// Pour un chef : remplir ce qui manque à un visiteur.
function Completer({ visiteur, fermer, apres }) {
  const [f, setF] = useState({});
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const aRemplir = CHAMPS_VISITEUR.filter((c) => visiteur.manquants.includes(c.cle));
  const manqueCode = visiteur.manquants.includes('code');

  async function envoyer(e) {
    e.preventDefault();
    setErreur('');
    try {
      await api('visiteurs/completer', { methode: 'POST', corps: { id: visiteur.id, ...f, code } });
      apres();
    } catch (err) { setErreur(err.message); }
  }

  return (
    <form className="carte alerte ombre" onSubmit={envoyer}>
      <h3>Compléter la fiche de {visiteur.prenom} {visiteur.nom}</h3>
      <p style={{ fontSize: 16 }}>Demande-lui ses réponses et écris-les exactement comme il ou elle les dira au contrôle d'entrée.</p>
      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {aRemplir.map((c) => (
          <label key={c.cle} className="etiquette">
            <span>{c.label.replace(/^Ton |^Ta |^Le nom de ton /, (m) => (m === 'Le nom de ton ' ? 'Le nom de son ' : m === 'Ton ' ? 'Son ' : 'Sa '))}</span>
            <Champ type={c.type} valeur={f[c.cle] || ''} onChange={(v) => setF((x) => ({ ...x, [c.cle]: v }))} maxLength={c.maxLength || 120} required />
          </label>
        ))}
        {manqueCode && <div className="etiquette"><span>Son code secret</span><ChampCode valeur={code} onChange={setCode} montrer /></div>}
      </div>
      {erreur && <div className="erreur" role="alert">{erreur}</div>}
      <div className="rangee">
        <button className="btn principal" type="submit" disabled={manqueCode && code.length < 4}>Enregistrer</button>
        <button className="btn" type="button" onClick={fermer}>Annuler</button>
      </div>
    </form>
  );
}

function PanneauChef() {
  const [liste, setListe] = useState(null);
  const [ouvert, setOuvert] = useState(null);
  const charger = () => api('visiteurs').then((r) => setListe(r.visiteurs)).catch(() => {});
  useEffect(() => { charger(); }, []);

  async function statut(v, s) { await api('visiteurs/statut', { methode: 'POST', corps: { id: v.id, statut: s } }); charger(); }
  async function effacer(v) {
    if (!window.confirm(`Effacer le compte de ${v.prenom} ${v.nom} ?`)) return;
    await api(`visiteurs?id=${v.id}`, { methode: 'DELETE' });
    charger();
  }

  const incomplets = liste?.filter((v) => v.manquants.length > 0) || [];

  return (
    <section className="pile" id="chefs">
      <div className="surtitre">POUR LES CHEFS</div>
      <h2>Comptes visiteurs</h2>
      {incomplets.length > 0 && (
        <div className="bandeau-alarme" style={{ borderRadius: 12, justifyContent: 'flex-start' }} role="alert">
          ⚠ IL MANQUE DES DONNÉES À {incomplets.length > 1 ? `${incomplets.length} VISITEURS` : 'UN VISITEUR'}. Ils ne peuvent pas entrer tant que leur fiche n'est pas complète.
        </div>
      )}
      {ouvert && <Completer visiteur={ouvert} fermer={() => setOuvert(null)} apres={() => { setOuvert(null); charger(); window.dispatchEvent(new Event('m2-etat')); }} />}
      {liste?.length === 0 && <p>Aucun compte visiteur.</p>}
      {liste?.length > 0 && (
        <div className="defile">
          <table className="tableau">
            <thead><tr><th>VISITEUR</th><th>LIEN</th><th>ÉTAT</th><th>DONNÉES</th><th /></tr></thead>
            <tbody>
              {liste.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 700 }}>{v.prenom} {v.nom}</td>
                  <td>{v.lien}</td>
                  <td>{v.statut === 'valide' ? <span className="pastille vert">VALIDÉ</span> : <span className="pastille jaune">EN ATTENTE</span>}</td>
                  <td>
                    {v.manquants.length === 0 ? <span className="pastille vert">COMPLÈTES</span> : (
                      <>
                        <span className="pastille rouge">IL MANQUE {v.manquants.length}</span>
                        <div style={{ fontSize: 13, marginTop: 4, color: 'var(--rouge)' }}>{v.manquants.map((c) => NOMS_CHAMPS[c] || c).join(', ')}</div>
                      </>
                    )}
                  </td>
                  <td className="rangee">
                    {v.manquants.length > 0 && <button className="btn danger petit" type="button" onClick={() => setOuvert(v)}>Compléter</button>}
                    {v.statut === 'valide'
                      ? <button className="btn petit" type="button" onClick={() => statut(v, 'en-attente')}>Suspendre</button>
                      : <button className="btn principal petit" type="button" onClick={() => statut(v, 'valide')}>Valider</button>}
                    <button className="btn petit" type="button" onClick={() => effacer(v)}>Effacer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Visiteurs() {
  const session = useSession();
  return (
    <Page numero="VISITEURS" titre="Créer un compte visiteur" intro="Tu n'es pas agent mais tu viens souvent au QG ? Crée ton compte visiteur. Un chef le validera, puis tu pourras passer les contrôles d'entrée et de sortie.">
      {session && <PanneauChef />}
      <Formulaire />
    </Page>
  );
}
