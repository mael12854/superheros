import { useEffect, useState } from 'react';
import Page, { useSession } from '../composants/Page.jsx';
import { ChampCode } from '../composants/Champs.jsx';
import { api } from '../lib/api.js';

// Un visiteur (famille, copain…) crée son compte. Un chef doit ensuite le valider.
function Formulaire() {
  const [f, setF] = useState({ prenom: '', nom: '', lien: '' });
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
        <p>Maël ou Marin doit maintenant valider ton compte. Ensuite, au contrôle d'entrée, choisis « Je suis un visiteur » et tape ton prénom, ton nom et ton code secret.</p>
        <div><a className="btn" href="/">Retour au QG</a></div>
      </div>
    );
  }

  const ch = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="carte ombre" style={{ maxWidth: 640 }} onSubmit={envoyer}>
      <span className="mono" style={{ fontSize: 13, color: 'var(--bleu)' }}>NOUVEAU COMPTE VISITEUR</span>
      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <label className="etiquette"><span>Ton prénom</span><input className="champ" value={f.prenom} onChange={ch('prenom')} required maxLength={60} /></label>
        <label className="etiquette"><span>Ton nom de famille</span><input className="champ" value={f.nom} onChange={ch('nom')} required maxLength={60} /></label>
        <label className="etiquette"><span>Tu es qui pour l'Agence ?</span><input className="champ" value={f.lien} onChange={ch('lien')} placeholder="Grand-mère, copain, voisin…" required maxLength={60} /></label>
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

function PanneauChef() {
  const [liste, setListe] = useState(null);
  const charger = () => api('visiteurs').then((r) => setListe(r.visiteurs)).catch(() => {});
  useEffect(() => { charger(); }, []);

  async function statut(v, s) { await api('visiteurs/statut', { methode: 'POST', corps: { id: v.id, statut: s } }); charger(); }
  async function effacer(v) {
    if (!window.confirm(`Effacer le compte de ${v.prenom} ${v.nom} ?`)) return;
    await api(`visiteurs?id=${v.id}`, { methode: 'DELETE' });
    charger();
  }

  return (
    <section className="pile">
      <div className="surtitre">POUR LES CHEFS</div>
      <h2>Comptes visiteurs</h2>
      {liste?.length === 0 && <p>Aucun compte visiteur.</p>}
      {liste?.length > 0 && (
        <div className="defile">
          <table className="tableau">
            <thead><tr><th>VISITEUR</th><th>LIEN</th><th>ÉTAT</th><th /></tr></thead>
            <tbody>
              {liste.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 700 }}>{v.prenom} {v.nom}</td>
                  <td>{v.lien}</td>
                  <td>{v.statut === 'valide' ? <span className="pastille vert">VALIDÉ</span> : <span className="pastille jaune">EN ATTENTE</span>}</td>
                  <td className="rangee">
                    {v.statut === 'valide'
                      ? <button className="btn petit" type="button" onClick={() => statut(v, 'en-attente')}>Suspendre</button>
                      : <button className="btn principal petit" type="button" onClick={() => statut(v, 'valide')}>Valider</button>}
                    <button className="btn petit danger" type="button" onClick={() => effacer(v)}>Effacer</button>
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
      <Formulaire />
      {session && <PanneauChef />}
    </Page>
  );
}
