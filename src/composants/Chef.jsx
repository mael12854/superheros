import { useState } from 'react';
import { api, ecrireSession } from '../lib/api.js';
import { useSession } from './Page.jsx';
import { Champ, ChampCode } from './Champs.jsx';

export function ConnexionChef({ apres }) {
  const [admin, setAdmin] = useState(false);
  const [nomHeros, setNom] = useState('');
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);

  async function envoyer(e) {
    e?.preventDefault();
    if ((!admin && !nomHeros.trim()) || code.length < 4) return;
    setOccupe(true);
    setErreur('');
    try {
      const r = await api('chef/connexion', { methode: 'POST', corps: admin ? { admin: true, code } : { nomHeros, code } });
      if (r.ok) {
        ecrireSession({ jeton: r.jeton, nomHeros: r.nomHeros });
        apres?.();
      } else {
        setErreur(r.message || 'Refusé.');
        setCode('');
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setOccupe(false);
    }
  }

  return (
    <form className="carte nuit ombre" style={{ maxWidth: 460 }} onSubmit={envoyer}>
      <span className="mono" style={{ fontSize: 13, color: 'var(--jaune)' }}>ACCÈS RÉSERVÉ · MAËL ET MARIN</span>
      <h2 style={{ fontSize: 26 }}>{admin ? 'Code admin' : 'Identification du chef'}</h2>
      <div className="rangee">
        <button type="button" className={`btn petit${!admin ? ' principal' : ''}`} onClick={() => { setAdmin(false); setCode(''); }}>Chef</button>
        <button type="button" className={`btn petit${admin ? ' principal' : ''}`} onClick={() => { setAdmin(true); setCode(''); }}>Code admin</button>
      </div>
      {!admin && (
        <label className="etiquette">
          <span>Nom de super-héros du chef</span>
          <Champ valeur={nomHeros} onChange={setNom} />
        </label>
      )}
      <div className="etiquette">
        <span>{admin ? 'Code admin' : 'Code secret'}</span>
        <ChampCode valeur={code} onChange={setCode} sombre onValider={envoyer} />
      </div>
      {erreur && <div className="erreur" style={{ color: '#ff8a7d' }} role="alert">{erreur}</div>}
      <button className="btn principal" type="submit" disabled={occupe || code.length < 4 || (!admin && !nomHeros.trim())}>
        {occupe ? '…' : 'Entrer'}
      </button>
    </form>
  );
}

// Affiche le contenu seulement si un chef est connecté.
export function ReserveChef({ children }) {
  const session = useSession();
  if (!session) {
    return (
      <div className="pile">
        <p>Cet outil est réservé aux chefs de l'Agence.</p>
        <ConnexionChef />
      </div>
    );
  }
  return children;
}
