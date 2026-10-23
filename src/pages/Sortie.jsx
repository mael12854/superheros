import { useEffect, useState } from 'react';
import Questionnaire from '../composants/Questionnaire.jsx';
import Reponse from '../composants/Reponse.jsx';
import { Barre } from '../composants/Page.jsx';
import ChoixQui from '../composants/ChoixQui.jsx';
import { api } from '../lib/api.js';
import { sonNon, sonOui } from '../lib/son.js';

// Section 07 de la charte : 8 questions, vérifiées une par une, 1 faute acceptée.
const QUESTIONS_SORTIE = [
  { cle: 'nomHeros', question: 'Ton nom de super-héros ?' },
  { cle: 'dateNaissance', question: 'Ta date de naissance ?', type: 'date' },
  { cle: 'ville', question: 'Ta ville ?' },
  { cle: 'plat', question: 'Ton plat préféré ?' },
  { cle: 'couleur', question: 'Ta couleur préférée ?' },
  { cle: 'destination', question: 'Où vas-tu ?' },
  { cle: 'retour', question: 'Tu rentres à quelle heure ?', type: 'heure' },
  { cle: 'code', question: 'Ton code secret ?', type: 'code' },
];

const QUESTIONS_VISITEUR = [
  { cle: 'prenom', question: 'Ton prénom ?' },
  { cle: 'nom', question: 'Ton nom de famille ?' },
  { cle: 'code', question: 'Ton code secret ?', type: 'code' },
];

export default function Sortie() {
  const [qui, setQui] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [tour, setTour] = useState(0);

  useEffect(() => { document.title = 'Sortie · QG Agence M²'; }, []);

  async function verifierVisiteur(etape, reponses) {
    if (etape < 3) return { acces: 'OUI' };
    const r = await api('visiteurs/sortie', { methode: 'POST', corps: { reponses } });
    if (r.acces === 'OUI') setResultat(r); else sonNon();
    return r;
  }

  async function verifierEtape(etape, reponses) {
    const r = await api('sortie/etape', { methode: 'POST', corps: { etape, reponses } });
    if (r.acces !== 'OUI') sonNon();
    if (etape === 8 && r.acces === 'OUI') setResultat(r);
    return r;
  }

  return (
    <div className="borne">
      <Barre />
      <div className="borne-centre">
        {resultat ? (
          <Reponse oui titre="Sortie autorisée" message={resultat.message}>
            <button className="btn principal" type="button" autoFocus onClick={() => { setResultat(null); setQui(null); setTour((t) => t + 1); }}>Agent suivant</button>
          </Reponse>
        ) : !qui ? (
          <ChoixQui sens="sortie" onChoix={setQui} />
        ) : (
          <Questionnaire key={tour} questions={qui === 'visiteur' ? QUESTIONS_VISITEUR : QUESTIONS_SORTIE} niveau="normal" verifierEtape={qui === 'visiteur' ? verifierVisiteur : verifierEtape} terminer={() => sonOui()} />
        )}
      </div>
    </div>
  );
}
