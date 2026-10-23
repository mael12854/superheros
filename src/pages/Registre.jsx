import { useEffect, useState } from 'react';
import Page from '../composants/Page.jsx';
import { api } from '../lib/api.js';

function aujourdhui() {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
}

export default function Registre() {
  const [date, setDate] = useState(aujourdhui());
  const [lignes, setLignes] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    setLignes(null);
    api(`registre?date=${date}`).then((r) => setLignes(r.lignes)).catch((e) => setErreur(e.message));
  }, [date]);

  return (
    <Page numero="OUTIL · PRIORITÉ" titre="Registre des visiteurs" intro="Qui est entré, qui est sorti, à quelle heure.">
      <label className="etiquette" style={{ maxWidth: 260 }}>
        <span>Date</span>
        <input className="champ mono" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </label>
      {erreur && <p className="erreur">{erreur}</p>}
      {lignes && lignes.length === 0 && <div className="carte"><p>Personne n'est passé ce jour-là.</p></div>}
      {lignes && lignes.length > 0 && (
        <div className="defile">
          <table className="tableau">
            <thead><tr><th>HEURE</th><th>AGENT</th><th>MOUVEMENT</th><th>DÉTAILS</th></tr></thead>
            <tbody>
              {[...lignes].reverse().map((l, i) => (
                <tr key={i}>
                  <td className="mono">{l.heure}</td>
                  <td style={{ fontWeight: 700 }}>{l.nomHeros}{l.visiteur && <span className="pastille jaune" style={{ marginLeft: 8 }}>VISITEUR</span>}</td>
                  <td>{l.type === 'entree' ? <span className="pastille vert">ENTRÉE</span> : <span className="pastille bleu">SORTIE</span>}</td>
                  <td>{l.type === 'sortie' && l.destination ? <>{l.destination} · retour <span className="mono">{l.retour}</span></> : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
