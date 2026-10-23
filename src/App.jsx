import { useEffect } from 'react';
import { useChemin, surLien } from './lib/routeur.js';
import Accueil from './pages/Accueil.jsx';
import Entree from './pages/Entree.jsx';
import Sortie from './pages/Sortie.jsx';
import Inscription from './pages/Inscription.jsx';
import Installation from './pages/Installation.jsx';
import Code from './pages/Code.jsx';
import Registre from './pages/Registre.jsx';
import Badge from './pages/Badge.jsx';
import Presents from './pages/Presents.jsx';
import Alarme from './pages/Alarme.jsx';
import MotDuJour from './pages/MotDuJour.jsx';
import Messages from './pages/Messages.jsx';
import Missions from './pages/Missions.jsx';
import Anniversaires from './pages/Anniversaires.jsx';
import Menu from './pages/Menu.jsx';
import Recrutement from './pages/Recrutement.jsx';
import Diplome from './pages/Diplome.jsx';
import Gadgets from './pages/Gadgets.jsx';
import ListeRouge from './pages/ListeRouge.jsx';
import Chrono from './pages/Chrono.jsx';
import Chef from './pages/Chef.jsx';
import Agents from './pages/Agents.jsx';
import Visiteurs from './pages/Visiteurs.jsx';
import Page from './composants/Page.jsx';

const PAGES = {
  '/': Accueil,
  '/entree': Entree,
  '/sortie': Sortie,
  '/inscription': Inscription,
  '/installation': Installation,
  '/code': Code,
  '/registre': Registre,
  '/badge': Badge,
  '/presents': Presents,
  '/alarme': Alarme,
  '/mot-du-jour': MotDuJour,
  '/messages': Messages,
  '/missions': Missions,
  '/anniversaires': Anniversaires,
  '/menu': Menu,
  '/recrutement': Recrutement,
  '/diplome': Diplome,
  '/gadgets': Gadgets,
  '/liste-rouge': ListeRouge,
  '/chrono': Chrono,
  '/chef': Chef,
  '/agents': Agents,
  '/visiteurs': Visiteurs,
};

function Introuvable() {
  return (
    <Page titre="Page introuvable" intro="Cette porte du QG n'existe pas.">
      <div><a className="btn principal" href="/">Retour au QG</a></div>
    </Page>
  );
}

export default function App() {
  const chemin = useChemin();
  useEffect(() => {
    document.addEventListener('click', surLien);
    return () => document.removeEventListener('click', surLien);
  }, []);
  const Composant = PAGES[chemin.replace(/\/+$/, '') || '/'] || Introuvable;
  return <Composant key={chemin} />;
}
