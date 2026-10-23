import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';
import { api, ecrireSession, lireSession } from '../lib/api.js';

export function useSession() {
  const [session, setSession] = useState(lireSession);
  useEffect(() => {
    const maj = () => setSession(lireSession());
    window.addEventListener('m2-session', maj);
    return () => window.removeEventListener('m2-session', maj);
  }, []);
  return session;
}

// Alerte en haut de chaque page quand un visiteur n'a pas toutes ses données.
function AlerteVisiteurs() {
  const [nb, setNb] = useState(0);
  useEffect(() => {
    const charger = () => api('etat').then((e) => setNb(e.visiteursIncomplets || 0)).catch(() => {});
    charger();
    window.addEventListener('m2-etat', charger);
    return () => window.removeEventListener('m2-etat', charger);
  }, []);
  if (!nb) return null;
  return (
    <div className="bandeau-alarme pas-imprimer" role="alert">
      <span>⚠ IL MANQUE DES DONNÉES À {nb > 1 ? `${nb} VISITEURS` : 'UN VISITEUR'}</span>
      <a href="/visiteurs#chefs">Un chef doit compléter sa fiche</a>
    </div>
  );
}

export function Barre() {
  const session = useSession();
  return (
    <>
    <header className="barre pas-imprimer">
      <div className="barre-int">
        <a href="/" className="barre-marque">
          <Logo taille={40} fond="nuit" />
          <span>QG Agence M²</span>
        </a>
        <div className="barre-chef">
          {session ? (
            <>
              <span>CHEF : {session.nomHeros}</span>
              <button type="button" onClick={() => ecrireSession(null)}>Déconnexion</button>
            </>
          ) : (
            <a href="/chef">Accès chef</a>
          )}
        </div>
      </div>
    </header>
    <AlerteVisiteurs />
    </>
  );
}

export default function Page({ numero, titre, intro, children }) {
  useEffect(() => {
    document.title = `${titre} · QG Agence M²`;
  }, [titre]);
  return (
    <>
      <Barre />
      <main className="contenu">
        <div className="entete">
          {numero && <div className="surtitre pas-imprimer">{numero}</div>}
          <h1 className="pas-imprimer">{titre}</h1>
          {intro && <p className="pas-imprimer">{intro}</p>}
        </div>
        {children}
      </main>
    </>
  );
}
