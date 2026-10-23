import { useState } from 'react';
import Page from '../composants/Page.jsx';

// Code César : chaque lettre avance de « decalage » places dans l'alphabet.
export function cesar(texte, decalage) {
  const d = ((decalage % 26) + 26) % 26;
  return texte
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[a-z]/gi, (c) => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + d) % 26) + base);
    });
}

export default function Messages() {
  const [texte, setTexte] = useState('');
  const [decalage, setDecalage] = useState(3);
  const [sens, setSens] = useState('coder');
  const resultat = cesar(texte, sens === 'coder' ? decalage : -decalage);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <Page numero="OUTIL · BONUS" titre="Messages secrets" intro="Le code César : chaque lettre avance dans l'alphabet. Avec un décalage de 3, A devient D, B devient E…">
      <div className="rangee">
        <button type="button" className={`btn${sens === 'coder' ? ' principal' : ''}`} onClick={() => setSens('coder')}>Coder</button>
        <button type="button" className={`btn${sens === 'decoder' ? ' principal' : ''}`} onClick={() => setSens('decoder')}>Décoder</button>
        <div className="rangee" style={{ marginLeft: 8 }}>
          <span style={{ fontWeight: 700 }}>Décalage</span>
          <button type="button" className="btn petit" onClick={() => setDecalage((d) => (d + 25) % 26)} aria-label="Moins">−</button>
          <span className="mono" style={{ fontSize: 28, fontWeight: 800, minWidth: 40, textAlign: 'center' }}>{decalage}</span>
          <button type="button" className="btn petit" onClick={() => setDecalage((d) => (d + 1) % 26)} aria-label="Plus">+</button>
        </div>
      </div>
      <div className="carte nuit mono" style={{ fontSize: 15, overflowX: 'auto', whiteSpace: 'nowrap', gap: 4 }}>
        <div>{alphabet.split('').join(' ')}</div>
        <div style={{ color: 'var(--jaune)' }}>{cesar(alphabet, decalage).split('').join(' ')}</div>
      </div>
      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <label className="etiquette">
          <span>{sens === 'coder' ? 'Message en clair' : 'Message codé'}</span>
          <textarea className="champ" value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Rendez-vous au QG à 17 h" />
        </label>
        <div className="etiquette">
          <span>{sens === 'coder' ? 'Message codé' : 'Message en clair'}</span>
          <div className="champ mono" style={{ minHeight: 100, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{resultat}</div>
        </div>
      </div>
      <div><button type="button" className="btn" onClick={() => navigator.clipboard?.writeText(resultat)}>Copier</button></div>
    </Page>
  );
}
