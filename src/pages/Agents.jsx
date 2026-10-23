import { useState } from 'react';
import Page from '../composants/Page.jsx';
import { ReserveChef } from '../composants/Chef.jsx';
import { useAgents } from '../composants/ChoixAgent.jsx';
import { ChampCode } from '../composants/Champs.jsx';
import { api } from '../lib/api.js';

function NouveauCode({ agent, fermer }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  async function tirer() { setCode((await api('code/nouveau', { methode: 'POST', corps: {} })).code); }
  async function enregistrer() {
    try {
      await api('agents/code', { methode: 'POST', corps: { id: agent.id, code } });
      setMsg(`Nouveau code de ${agent.nomHeros} : ${code}. Dis-le-lui, puis ferme.`);
    } catch (e) { setMsg(e.message); }
  }
  return (
    <div className="carte nuit">
      <b style={{ fontFamily: 'var(--titre)' }}>Nouveau code pour {agent.nomHeros}</b>
      <ChampCode valeur={code} onChange={setCode} sombre montrer />
      <div className="rangee">
        <button className="btn petit" type="button" onClick={tirer}>Au hasard</button>
        <button className="btn principal petit" type="button" disabled={code.length < 4} onClick={enregistrer}>Enregistrer</button>
        <button className="btn petit" type="button" onClick={fermer}>Fermer</button>
      </div>
      {msg && <span style={{ color: 'var(--jaune)' }}>{msg}</span>}
    </div>
  );
}

function Liste() {
  const { agents, erreur, charger } = useAgents();
  const [ouvert, setOuvert] = useState(null);
  async function retirer(a) {
    if (!window.confirm(`Retirer ${a.nomHeros} de l'Agence ? Sa fiche et sa photo seront effacées.`)) return;
    try { await api(`agents?id=${a.id}`, { methode: 'DELETE' }); charger(); } catch (e) { window.alert(e.message); }
  }
  return (
    <div className="pile">
      {erreur && <p className="erreur">{erreur}</p>}
      <div><a className="btn principal" href="/inscription">+ Nouvel agent</a></div>
      <div className="defile">
        <table className="tableau">
          <thead><tr><th>N°</th><th>HÉROS</th><th>VRAI NOM</th><th>NÉ LE</th><th>VILLE</th><th>RÔLE</th><th /></tr></thead>
          <tbody>
            {agents?.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.numero}</td>
                <td style={{ fontWeight: 700 }}>{a.nomHeros}</td>
                <td>{a.prenom} {a.nom}</td>
                <td className="mono">{a.dateNaissance.split('-').reverse().join('/')}</td>
                <td>{a.ville}</td>
                <td><span className={`pastille ${a.role === 'chef' ? 'rouge' : 'bleu'}`}>{a.role.toUpperCase()}</span></td>
                <td className="rangee">
                  <a className="btn petit" href={`/badge?id=${a.id}`}>Badge</a>
                  <button className="btn petit" type="button" onClick={() => setOuvert(a)}>Code</button>
                  <button className="btn petit danger" type="button" onClick={() => retirer(a)}>Retirer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ouvert && <NouveauCode agent={ouvert} fermer={() => setOuvert(null)} />}
    </div>
  );
}

export default function Agents() {
  return (
    <Page numero="CHEFS" titre="Les agents" intro="Toutes les fiches. Les codes secrets ne s'affichent jamais : on peut seulement en donner un nouveau.">
      <ReserveChef><Liste /></ReserveChef>
    </Page>
  );
}
