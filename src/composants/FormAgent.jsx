import { useState } from 'react';
import { api } from '../lib/api.js';
import { Champ, ChampCode } from './Champs.jsx';

export const CHAMPS_FICHE = [
  { cle: 'nomHeros', label: 'Nom de super-héros' },
  { cle: 'prenom', label: 'Vrai prénom' },
  { cle: 'nom', label: 'Nom de famille' },
  { cle: 'dateNaissance', label: 'Date de naissance', type: 'date' },
  { cle: 'adresse', label: 'Adresse' },
  { cle: 'codePostal', label: 'Code postal', type: 'nombre', maxLength: 5 },
  { cle: 'ville', label: 'Ville' },
  { cle: 'entree', label: 'Entrée préférée' },
  { cle: 'plat', label: 'Plat préféré' },
  { cle: 'dessert', label: 'Dessert préféré' },
  { cle: 'couleur', label: 'Couleur préférée' },
  { cle: 'pouvoir', label: 'Pouvoir' },
  { cle: 'chef', label: 'Nom de son chef' },
];

// Réduit la photo à 480 px (JPEG) avant l'envoi.
function reduirePhoto(fichier) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cote = Math.min(img.width, img.height);
      const taille = Math.min(480, cote);
      const canvas = document.createElement('canvas');
      canvas.width = taille;
      canvas.height = taille;
      canvas.getContext('2d').drawImage(img, (img.width - cote) / 2, (img.height - cote) / 2, cote, cote, 0, 0, taille, taille);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('Image illisible.'));
    img.src = URL.createObjectURL(fichier);
  });
}

export default function FormAgent({ route = 'agents', installation = false, apres }) {
  const [fiche, setFiche] = useState({});
  const [role, setRole] = useState(installation ? 'chef' : 'agent');
  const [code, setCode] = useState('');
  const [voirCode, setVoirCode] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [codeAdmin, setCodeAdmin] = useState('');
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [cree, setCree] = useState(null);

  const maj = (cle) => (v) => setFiche((f) => ({ ...f, [cle]: v }));

  async function tirerCode() {
    setErreur('');
    try {
      const r = await api('code/nouveau', { methode: 'POST', corps: {} });
      setCode(r.code);
      setVoirCode(true);
    } catch (e) {
      setErreur(e.message);
    }
  }

  async function choisirPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setPhoto(await reduirePhoto(f));
    } catch (err) {
      setErreur(err.message);
    }
  }

  async function envoyer(e) {
    e.preventDefault();
    setErreur('');
    setOccupe(true);
    try {
      const r = await api(route, { methode: 'POST', corps: { ...fiche, code, role, photo, codeAdmin } });
      setCree({ ...r.agent, code });
      apres?.(r);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setOccupe(false);
    }
  }

  if (cree) {
    return (
      <div className="carte ombre" style={{ maxWidth: 560, background: 'var(--vert)', color: '#fff' }}>
        <span className="mono" style={{ fontSize: 13 }}>AGENT N° {cree.numero} ENREGISTRÉ</span>
        <h2>{cree.nomHeros}</h2>
        <p>Son code secret est <b className="mono" style={{ fontSize: 24, letterSpacing: 4 }}>{cree.code}</b>. Dis-le-lui à l'oreille, puis ferme cet écran : le QG ne pourra plus jamais l'afficher.</p>
        <div className="rangee">
          <a className="btn principal" href={`/badge?id=${cree.id}`}>Imprimer son badge</a>
          {!installation && <button className="btn" type="button" onClick={() => { setCree(null); setFiche({}); setCode(''); setPhoto(null); }}>Nouvel agent</button>}
          {installation && <a className="btn" href="/">Aller au QG</a>}
        </div>
      </div>
    );
  }

  return (
    <form className="pile" onSubmit={envoyer}>
      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {CHAMPS_FICHE.map((c) => (
          <label key={c.cle} className="etiquette">
            <span>{c.label}</span>
            <Champ type={c.type} valeur={fiche[c.cle] || ''} onChange={maj(c.cle)} maxLength={c.maxLength || 120} required />
          </label>
        ))}
        {!installation && (
          <label className="etiquette">
            <span>Rôle</span>
            <select className="champ" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="agent">Agent</option>
              <option value="chef">Chef</option>
            </select>
          </label>
        )}
      </div>

      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="carte">
          <span className="mono" style={{ fontSize: 13 }}>PHOTO</span>
          <div style={{ width: 160, border: '3px solid var(--nuit)', borderRadius: 12, overflow: 'hidden' }}>
            {photo ? <img src={photo} alt="Photo de l'agent" style={{ width: '100%', display: 'block' }} /> : <div className="photo-vide">photo</div>}
          </div>
          <label className="btn petit" style={{ alignSelf: 'flex-start' }}>
            {photo ? 'Changer la photo' : 'Prendre ou choisir une photo'}
            <input type="file" accept="image/*" capture="user" onChange={choisirPhoto} style={{ display: 'none' }} />
          </label>
        </div>
        <div className="carte nuit">
          <span className="mono" style={{ fontSize: 13, color: 'var(--jaune)' }}>CODE SECRET (4 À 6 CHIFFRES)</span>
          <ChampCode valeur={code} onChange={setCode} sombre montrer={voirCode} />
          <div className="rangee">
            <button className="btn principal petit" type="button" onClick={tirerCode}>Tirer un code au hasard</button>
            <button className="btn petit" type="button" onClick={() => setVoirCode(!voirCode)}>{voirCode ? 'Cacher' : 'Montrer'}</button>
          </div>
          <span style={{ fontSize: 15 }}>Pas de 1234, 0000 ou 1111. Le QG le hache : après l'inscription, plus personne ne peut le relire.</span>
        </div>
      </div>

      {installation && (
        <div className="etiquette" style={{ maxWidth: 420 }}>
          <span>Code admin</span>
          <ChampCode valeur={codeAdmin} onChange={setCodeAdmin} />
        </div>
      )}

      {erreur && <div className="erreur" role="alert">{erreur}</div>}
      <div>
        <button className="btn principal" type="submit" disabled={occupe || code.length < 4}>
          {occupe ? 'Enregistrement…' : installation ? 'Créer le premier chef' : 'Enregistrer l\'agent'}
        </button>
      </div>
    </form>
  );
}
