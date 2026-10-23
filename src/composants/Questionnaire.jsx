import { useEffect, useRef, useState } from 'react';
import { Champ, ChampCode } from './Champs.jsx';

// Un écran par question, comme dans la charte (sections 06 et 07).
// - niveau « max » : barre jaune, pas de retour en arrière, réponse seulement à la fin.
// - niveau « normal » : barre bleue, chaque étape est vérifiée tout de suite (verifierEtape).
export default function Questionnaire({ questions, niveau, verifierEtape, terminer, desactive }) {
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState({});
  const [valeur, setValeur] = useState('');
  const [message, setMessage] = useState('');
  const [faux, setFaux] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const champRef = useRef(null);

  const q = questions[index];
  const derniere = index === questions.length - 1;
  const max = niveau === 'max';

  useEffect(() => {
    champRef.current?.focus();
  }, [index]);

  const valide = q.type === 'code' ? valeur.length >= 4
    : q.type === 'date' ? valeur.replace(/\D/g, '').length === 8
    : q.type === 'heure' ? valeur.replace(/\D/g, '').length === 4
    : valeur.trim().length > 0;

  async function suivant(e) {
    e?.preventDefault();
    if (!valide || occupe || desactive) return;
    const nouvelles = { ...reponses, [q.cle]: valeur };
    setOccupe(true);
    setMessage('');
    try {
      if (verifierEtape) {
        const r = await verifierEtape(index + 1, nouvelles);
        if (r.recommencer) {
          setReponses({});
          setIndex(0);
          setValeur('');
          setMessage(r.message);
          return;
        }
        if (r.acces !== 'OUI') {
          setFaux(true);
          setMessage(r.message || 'Ce n\'est pas ça. Réessaie.');
          if (q.type === 'code') setValeur('');
          return;
        }
      }
      setFaux(false);
      setReponses(nouvelles);
      if (derniere) {
        await terminer(nouvelles);
      } else {
        setIndex(index + 1);
        setValeur('');
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setOccupe(false);
    }
  }

  const couleur = max ? 'var(--jaune)' : 'var(--bleu)';
  return (
    <form className="etape" onSubmit={suivant}>
      <div className="etape-haut">
        <div className="etape-infos">
          <span>ÉTAPE {index + 1} / {questions.length}</span>
          <span style={{ color: max ? 'var(--rouge)' : 'var(--bleu)' }}>● NIVEAU {max ? 'MAX' : 'NORMAL'}</span>
        </div>
        <div className="progres" aria-hidden="true">
          {questions.map((_, i) => <i key={i} style={i <= index ? { background: couleur } : undefined} />)}
        </div>
      </div>
      <div className="etape-corps">
        <label className="etape-question" htmlFor="reponse">{q.question}</label>
        {q.type === 'code' ? (
          <ChampCode valeur={valeur} onChange={(v) => { setValeur(v); setFaux(false); }} autoFocus />
        ) : (
          <Champ
            id="reponse"
            ref={champRef}
            type={q.type}
            valeur={valeur}
            faux={faux}
            autoFocus
            maxLength={q.type === 'nombre' ? 5 : 120}
            onChange={(v) => { setValeur(v); setFaux(false); }}
          />
        )}
        <div className="etape-message" role="status" style={{ color: faux ? 'var(--rouge)' : 'var(--nuit)' }}>{message}</div>
        <button className="btn principal large" type="submit" disabled={!valide || occupe || desactive}>
          {occupe ? '…' : derniere ? 'Vérifier' : 'Suivant →'}
        </button>
      </div>
    </form>
  );
}
