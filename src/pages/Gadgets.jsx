import { useEffect, useState } from 'react';
import Page, { useSession } from '../composants/Page.jsx';
import { api } from '../lib/api.js';

function aujourdhui() {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
}

export default function Gadgets() {
  const session = useSession();
  const [gadgets, setGadgets] = useState([]);
  const [nouveau, setNouveau] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => { api('gadgets').then((r) => setGadgets(r.gadgets)).catch((e) => setErreur(e.message)); }, []);

  async function sauver(liste) {
    setErreur('');
    try {
      setGadgets((await api('gadgets', { methode: 'PUT', corps: { gadgets: liste } })).gadgets);
    } catch (e) { setErreur(e.message); }
  }

  const modifier = (i, champ, v) => setGadgets(gadgets.map((g, k) => (k === i ? { ...g, [champ]: v } : g)));
  const jour = aujourdhui();

  return (
    <Page numero="OUTIL · BONUS" titre="Inventaire des gadgets" intro="Les objets du QG : qui les a empruntés et quand il faut les rendre.">
      {!session && <p>Seuls les chefs peuvent modifier l'inventaire. <a href="/chef">Accès chef</a></p>}
      <div className="defile">
        <table className="tableau">
          <thead><tr><th>GADGET</th><th>EMPRUNTÉ PAR</th><th>À RENDRE LE</th>{session && <th />}</tr></thead>
          <tbody>
            {gadgets.map((g, i) => {
              const enRetard = g.emprunteur && g.retour && g.retour < jour;
              return (
                <tr key={g.id || i}>
                  <td style={{ fontWeight: 700 }}>{g.nom}</td>
                  <td>{session ? <input className="champ" value={g.emprunteur} placeholder="au QG" onChange={(e) => modifier(i, 'emprunteur', e.target.value)} onBlur={() => sauver(gadgets)} /> : (g.emprunteur || <span className="pastille vert">AU QG</span>)}</td>
                  <td>
                    {session ? <input className="champ mono" type="date" value={g.retour} onChange={(e) => modifier(i, 'retour', e.target.value)} onBlur={() => sauver(gadgets)} />
                      : g.retour && <span className="mono">{g.retour.split('-').reverse().join('/')}</span>}
                    {enRetard && <span className="pastille rouge" style={{ marginLeft: 8 }}>EN RETARD</span>}
                  </td>
                  {session && (
                    <td className="rangee">
                      <button className="btn petit" type="button" onClick={() => sauver(gadgets.map((x, k) => (k === i ? { ...x, emprunteur: '', retour: '' } : x)))}>Rendu</button>
                      <button className="btn petit danger" type="button" onClick={() => sauver(gadgets.filter((_, k) => k !== i))}>✕</button>
                    </td>
                  )}
                </tr>
              );
            })}
            {gadgets.length === 0 && <tr><td colSpan={4}>Aucun gadget.</td></tr>}
          </tbody>
        </table>
      </div>
      {session && (
        <form className="rangee" onSubmit={(e) => { e.preventDefault(); if (nouveau.trim()) { sauver([...gadgets, { nom: nouveau.trim(), emprunteur: '', retour: '' }]); setNouveau(''); } }}>
          <input className="champ" style={{ maxWidth: 320 }} placeholder="Talkie-walkie, lampe torche…" value={nouveau} onChange={(e) => setNouveau(e.target.value)} />
          <button className="btn principal" type="submit">Ajouter</button>
        </form>
      )}
      {erreur && <p className="erreur">{erreur}</p>}
    </Page>
  );
}
