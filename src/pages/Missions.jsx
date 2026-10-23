import { useEffect, useState } from 'react';
import Page, { useSession } from '../composants/Page.jsx';
import { api } from '../lib/api.js';

const COULEUR = { 'réussie': 'vert', 'ratée': 'rouge', 'en cours': 'jaune' };
const vide = { nom: '', date: '', resultat: 'en cours', agents: '', notes: '' };

export default function Missions() {
  const session = useSession();
  const [missions, setMissions] = useState([]);
  const [form, setForm] = useState(vide);
  const [erreur, setErreur] = useState('');

  const charger = () => api('missions').then((r) => setMissions(r.missions)).catch((e) => setErreur(e.message));
  useEffect(() => { charger(); }, []);

  async function enregistrer(e) {
    e.preventDefault();
    setErreur('');
    try {
      await api('missions', { methode: 'POST', corps: { ...form, agents: form.agents.split(',').map((s) => s.trim()).filter(Boolean) } });
      setForm(vide);
      charger();
    } catch (err) { setErreur(err.message); }
  }

  async function changer(m, resultat) {
    await api('missions', { methode: 'POST', corps: { ...m, resultat } });
    charger();
  }

  async function effacer(m) {
    if (!window.confirm(`Effacer la mission « ${m.nom} » ?`)) return;
    await api(`missions?id=${m.id}`, { methode: 'DELETE' });
    charger();
  }

  return (
    <Page numero="OUTIL · BONUS" titre="Journal de mission" intro="Chaque mission : nom, date, agents et résultat.">
      {session && (
        <form className="carte" onSubmit={enregistrer}>
          <h3>Nouvelle mission</h3>
          <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label className="etiquette"><span>Nom de la mission</span><input className="champ" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required /></label>
            <label className="etiquette"><span>Date</span><input className="champ mono" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label className="etiquette"><span>Agents (séparés par des virgules)</span><input className="champ" value={form.agents} onChange={(e) => setForm({ ...form, agents: e.target.value })} /></label>
            <label className="etiquette"><span>Résultat</span>
              <select className="champ" value={form.resultat} onChange={(e) => setForm({ ...form, resultat: e.target.value })}>
                <option>en cours</option><option>réussie</option><option>ratée</option>
              </select>
            </label>
          </div>
          <label className="etiquette"><span>Notes</span><textarea className="champ" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {erreur && <div className="erreur">{erreur}</div>}
          <div><button className="btn principal" type="submit">Ajouter</button></div>
        </form>
      )}
      {!session && <p>Seuls les chefs peuvent écrire dans le journal. <a href="/chef">Accès chef</a></p>}
      <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {missions.map((m) => (
          <div key={m.id} className="carte ombre">
            <div className="rangee" style={{ justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 14 }}>{m.date.split('-').reverse().join('/')}</span>
              <span className={`pastille ${COULEUR[m.resultat]}`}>{m.resultat.toUpperCase()}</span>
            </div>
            <h3>{m.nom}</h3>
            {m.agents.length > 0 && <span style={{ fontSize: 15 }}><b>Agents :</b> {m.agents.join(', ')}</span>}
            {m.notes && <p style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{m.notes}</p>}
            {session && (
              <div className="rangee">
                {['réussie', 'ratée', 'en cours'].filter((r) => r !== m.resultat).map((r) => (
                  <button key={r} type="button" className="btn petit" onClick={() => changer(m, r)}>{r}</button>
                ))}
                <button type="button" className="btn petit danger" onClick={() => effacer(m)}>Effacer</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {missions.length === 0 && <div className="carte"><p>Aucune mission pour l'instant.</p></div>}
    </Page>
  );
}
