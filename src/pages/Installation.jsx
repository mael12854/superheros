import { useEffect, useState } from 'react';
import Page from '../composants/Page.jsx';
import FormAgent from '../composants/FormAgent.jsx';
import { api, ecrireSession } from '../lib/api.js';

export default function Installation() {
  const [etat, setEtat] = useState(null);
  useEffect(() => { api('etat').then(setEtat).catch(() => setEtat({})); }, []);
  return (
    <Page numero="PREMIÈRE INSTALLATION" titre="Installer le QG" intro="Crée le premier chef. Ensuite, c'est lui qui inscrit tous les autres agents.">
      {!etat ? <p>Chargement…</p> : etat.installe ? (
        <div className="carte"><p>Le QG est déjà installé. <a href="/chef">Connecte-toi comme chef</a>.</p></div>
      ) : (
        <FormAgent route="installation" installation apres={(r) => r.jeton && ecrireSession({ jeton: r.jeton, nomHeros: r.agent.nomHeros })} />
      )}
    </Page>
  );
}
