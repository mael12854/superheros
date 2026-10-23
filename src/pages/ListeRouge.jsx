import { useEffect, useState } from 'react';
import Page from '../composants/Page.jsx';
import { ReserveChef } from '../composants/Chef.jsx';
import { api } from '../lib/api.js';

function Liste() {
  const [liste, setListe] = useState([]);
  const [nom, setNom] = useState('');
  const [raison, setRaison] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => { api('liste-rouge').then((r) => setListe(r.liste)).catch((e) => setErreur(e.message)); }, []);

  async function sauver(l) {
    try { setListe((await api('liste-rouge', { methode: 'PUT', corps: { liste: l } })).liste); } catch (e) { setErreur(e.message); }
  }

  return (
    <div className="pile">
      <form className="carte alerte" onSubmit={(e) => { e.preventDefault(); if (nom.trim()) { sauver([...liste, { nom, raison }]); setNom(''); setRaison(''); } }}>
        <div className="grille" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <label className="etiquette"><span>Nom, prénom ou nom de héros</span><input className="champ" value={nom} onChange={(e) => setNom(e.target.value)} /></label>
          <label className="etiquette"><span>Pourquoi ?</span><input className="champ" value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="A mangé tous les biscuits" /></label>
        </div>
        <div><button className="btn danger" type="submit">Ajouter à la liste rouge</button></div>
      </form>
      {erreur && <p className="erreur">{erreur}</p>}
      <div className="grille">
        {liste.map((p, i) => (
          <div key={i} className="carte alerte">
            <span className="pastille rouge" style={{ alignSelf: 'flex-start' }}>INTERDIT</span>
            <h3>{p.nom}</h3>
            {p.raison && <span>{p.raison}</span>}
            <div><button className="btn petit" type="button" onClick={() => sauver(liste.filter((_, k) => k !== i))}>Retirer</button></div>
          </div>
        ))}
      </div>
      {liste.length === 0 && <p>La liste rouge est vide.</p>}
    </div>
  );
}

export default function ListeRouge() {
  return (
    <Page numero="OUTIL · BONUS" titre="Liste rouge" intro="Personnes interdites au QG (petite sœur, chat…). Au contrôle d'entrée : accès refusé direct.">
      <ReserveChef><Liste /></ReserveChef>
    </Page>
  );
}
