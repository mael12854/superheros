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

// Pour un chef : compléter ce qui manque à un visiteur, ou modifier toute sa fiche.
// mode « completer » = seulement les champs vides ; mode « modifier » = tous les champs, déjà remplis.
const enSon = (label) => label.replace(/^Ton |^Ta |^Le nom de ton /, (m) => (m === 'Le nom de ton ' ? 'Le nom de son ' : m === 'Ton ' ? 'Son ' : 'Sa '));

function FicheChef({ visiteur, mode, fermer, apres }) {
  const modifier = mode === 'modifier';
  const depart = Object.fromEntries(CHAMPS_VISITEUR.map((c) => [c.cle, c.cle === 'dateNaissance' && visiteur.dateNaissance
    ? visiteur.dateNaissance.split('-').reverse().join(' / ')
    : (visiteur[c.cle] || '')]));
  const [f, setF] = useState(modifier ? depart : {});
  const [code, setCode] = useState('');
  const [changerCode, setChangerCode] = useState(false);
  const [erreur, setErreur] = useState('');
  // Prénom et nom forment l'identifiant du compte : on ne les change pas.
  const champs = CHAMPS_VISITEUR.filter((c) => c.cle !== 'prenom' && c.cle !== 'nom' && (modifier || visiteur.manquants.includes(c.cle)));
  const manqueCode = visiteur.manquants.includes('code');

  async function envoyer(e) {
    e.preventDefault();
    setErreur('');
    const changes = {};
    for (const c of champs) if (f[c.cle] && f[c.cle] !== depart[c.cle]) changes[c.cle] = f[c.cle];
    try {
      await api('visiteurs/completer', { methode: 'POST', corps: { id: visiteur.id, ...changes, code: manqueCode || changerCode ? code : '' } });
      apres();
    } catch (err) { setErreur(err.message); }
  }

  return (
    <form className={`carte ombre${modifier ? '' : ' alerte'}`} onSubmit={envoyer}>
      <h3>{modifier ? 'Modifier' : 'Compléter'} la fiche de {visiteur.prenom} {visiteur.nom}</h3>
      <p style={{ fontSize: 16 }}>
        {modifier
          ? 'Attention : le visiteur devra donner ces nouvelles réponses au contrôle d\'entrée.'
          : 'Demande-lui ses réponses et écris-les exactement comme il ou elle les dira au contrôle d\'entrée.'}
      </p>
      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {champs.map((c) => (
          <label key={c.cle} className="etiquette">
            <span>{enSon(c.label)}</span>
            <Champ type={c.type} valeur={f[c.cle] || ''} onChange={(v) => setF((x) => ({ ...x, [c.cle]: v }))} maxLength={c.maxLength || 120} required />
          </label>
        ))}
        {(manqueCode || changerCode) && (
          <div className="etiquette">
            <span>{manqueCode ? 'Son code secret' : 'Son nouveau code secret'}</span>
            <ChampCode valeur={code} onChange={setCode} montrer />
          </div>
        )}
        {modifier && !manqueCode && !changerCode && (
          <div className="etiquette" style={{ justifyContent: 'flex-end' }}>
            <button className="btn petit" type="button" onClick={() => setChangerCode(true)}>Changer son code secret</button>
          </div>
        )}
      </div>
      {erreur && <div className="erreur" role="alert">{erreur}</div>}
      <div className="rangee">
        <button className="btn principal" type="submit" disabled={((manqueCode || changerCode) && code.length < 4)}>Enregistrer</button>
        <button className="btn" type="button" onClick={fermer}>Annuler</button>
      </div>
    </form>
  );
}

// Pour un chef : vérifier le code d'un visiteur et voir exactement ce qui bloque.
function TesterCode({ visiteur, fermer }) {
  const [code, setCode] = useState('');
  const [r, setR] = useState(null);
  const [erreur, setErreur] = useState('');
  async function tester(e) {
    e?.preventDefault();
    setErreur('');
    try { setR(await api('visiteurs/tester', { methode: 'POST', corps: { id: visiteur.id, code } })); } catch (err) { setErreur(err.message); }
  }
  const verdict = r && (
    !r.codeOk ? ['rouge', 'Ce n\'est PAS son code. Clique « Modifier » puis « Changer son code secret » pour lui en donner un nouveau.']
      : r.etatCompte !== 'valide' ? ['jaune', 'Le code est bon, mais le compte n\'est pas validé. Clique « Valider ».']
      : r.manquants.length ? ['jaune', 'Le code est bon, mais il manque des données (entrée refusée). Clique « Compléter ».']
      : ['vert', 'Le code est bon et le compte est en règle : l\'entrée et la sortie doivent marcher.']
  );
  return (
    <form className="carte nuit ombre" onSubmit={tester}>
      <h3>Tester le code de {visiteur.prenom} {visiteur.nom}</h3>
      <ChampCode valeur={code} onChange={(v) => { setCode(v); setR(null); }} sombre montrer onValider={tester} />
      <div className="rangee">
        <button className="btn principal" type="submit" disabled={code.length < 4}>Tester</button>
        <button className="btn" type="button" onClick={fermer}>Fermer</button>
      </div>
      {verdict && <div className={`pastille ${verdict[0]}`} style={{ fontSize: 15, padding: '8px 12px', borderRadius: 10, whiteSpace: 'normal' }}>{verdict[1]}</div>}
      {erreur && <div className="erreur" style={{ color: '#ff8a7d' }}>{erreur}</div>}
    </form>
  );
}

function PanneauChef() {
  const [liste, setListe] = useState(null);
  const [ouvert, setOuvert] = useState(null);
  const [test, setTest] = useState(null);
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
      {ouvert && <FicheChef key={ouvert.v.id + ouvert.mode} visiteur={ouvert.v} mode={ouvert.mode} fermer={() => setOuvert(null)} apres={() => { setOuvert(null); charger(); window.dispatchEvent(new Event('m2-etat')); }} />}
      {test && <TesterCode key={test.id} visiteur={test} fermer={() => setTest(null)} />}
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
                    {v.manquants.length > 0
                      ? <button className="btn danger petit" type="button" onClick={() => setOuvert({ v, mode: 'completer' })}>Compléter</button>
                      : <button className="btn principal petit" type="button" onClick={() => setOuvert({ v, mode: 'modifier' })}>Modifier</button>}
                    {v.statut === 'valide'
                      ? <button className="btn petit" type="button" onClick={() => statut(v, 'en-attente')}>Suspendre</button>
                      : <button className="btn principal petit" type="button" onClick={() => statut(v, 'valide')}>Valider</button>}
                    <button className="btn petit" type="button" onClick={() => { setTest(v); window.scrollTo(0, 0); }}>Tester un code</button>
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
