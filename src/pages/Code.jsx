import { useState } from 'react';
import Page from '../composants/Page.jsx';
import { ReserveChef } from '../composants/Chef.jsx';
import { api } from '../lib/api.js';

export default function Code() {
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [occupe, setOccupe] = useState(false);

  async function tirer() {
    setOccupe(true);
    setErreur('');
    try {
      setCode((await api('code/nouveau', { methode: 'POST', corps: {} })).code);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setOccupe(false);
    }
  }

  return (
    <Page numero="OUTIL · PRIORITÉ" titre="Générateur de code secret" intro="Tire 4 chiffres au hasard. Le QG refuse les codes trop faciles (1234, 0000, 1111…) et ceux déjà pris.">
      <ReserveChef>
        <div className="carte nuit ombre" style={{ maxWidth: 520, alignItems: 'center', textAlign: 'center', gap: 20 }}>
          <span className="mono" style={{ fontSize: 13, color: 'var(--jaune)' }}>NOUVEAU CODE</span>
          <div className="mono" style={{ fontSize: 72, fontWeight: 800, letterSpacing: 16, minHeight: 90 }}>{code ? code.split('').join(' ') : '_ _ _ _'}</div>
          <button className="btn principal" type="button" onClick={tirer} disabled={occupe}>{occupe ? 'Recherche…' : 'Tirer un code'}</button>
          {erreur && <div className="erreur" style={{ color: '#ff8a7d' }}>{erreur}</div>}
          <span style={{ fontSize: 15 }}>Note-le sur la fiche d'inscription. Ce code n'est enregistré nulle part tant que l'agent n'est pas créé.</span>
        </div>
      </ReserveChef>
    </Page>
  );
}
