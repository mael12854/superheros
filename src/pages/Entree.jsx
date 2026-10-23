import { useCallback, useEffect, useState } from 'react';
import Questionnaire from '../composants/Questionnaire.jsx';
import Reponse from '../composants/Reponse.jsx';
import EcranAlarme from '../composants/Alarme.jsx';
import { Barre } from '../composants/Page.jsx';
import ChoixQui from '../composants/ChoixQui.jsx';
import { api } from '../lib/api.js';
import { sonNon, sonOui } from '../lib/son.js';

// Section 06 de la charte : 16 questions, tout tapé au clavier, réponse à la fin.
export const QUESTIONS_ENTREE = [
  { cle: 'nomHeros', question: 'Ton nom de super-héros ?' },
  { cle: 'prenom', question: 'Ton vrai prénom ?' },
  { cle: 'nom', question: 'Ton nom de famille ?' },
  { cle: 'dateNaissance', question: 'Ta date de naissance ?', type: 'date' },
  { cle: 'age', question: 'Ton âge ?', type: 'nombre' },
  { cle: 'adresse', question: 'Ton adresse ?' },
  { cle: 'codePostal', question: 'Ton code postal ?', type: 'nombre' },
  { cle: 'ville', question: 'Ta ville ?' },
  { cle: 'entree', question: 'Ton entrée préférée ?' },
  { cle: 'plat', question: 'Ton plat préféré ?' },
  { cle: 'dessert', question: 'Ton dessert préféré ?' },
  { cle: 'couleur', question: 'Ta couleur préférée ?' },
  { cle: 'pouvoir', question: 'Ton pouvoir ?' },
  { cle: 'chef', question: 'Le nom de ton chef ?' },
  { cle: 'lettres', question: 'Question piège : combien de lettres dans ton nom de héros ?', type: 'nombre' },
  { cle: 'code', question: 'Ton code secret ?', type: 'code' },
];

const QUESTIONS_VISITEUR = [
  { cle: 'prenom', question: 'Ton prénom ?' },
  { cle: 'nom', question: 'Ton nom de famille ?' },
  { cle: 'code', question: 'Ton code secret ?', type: 'code' },
];

export default function Entree() {
  const [qui, setQui] = useState(null);
  const [resultat, setResultat] = useState(null);
  const [bloqueJusqua, setBloque] = useState(0);
  const [alarmeActive, setAlarmeActive] = useState(false);
  const [tour, setTour] = useState(0);

  const chargerEtat = useCallback(() => {
    api('etat').then((e) => {
      setBloque(e.bloqueJusqua || 0);
      setAlarmeActive(Boolean(e.alarme?.active));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    document.title = 'Entrée · QG Agence M²';
    chargerEtat();
  }, [chargerEtat]);

  async function terminer(reponses) {
    const r = await api(qui === 'visiteur' ? 'visiteurs/entree' : 'entree', { methode: 'POST', corps: { reponses } });
    if (r.bloque) {
      setBloque(r.bloqueJusqua);
      setAlarmeActive(Boolean(r.alarme) || alarmeActive);
      setResultat(null);
      return;
    }
    if (r.acces === 'OUI') sonOui(); else sonNon();
    setResultat(r);
  }

  const recommencer = () => { setResultat(null); setQui(null); setTour((t) => t + 1); };
  const finBlocage = useCallback(() => { setBloque(0); setTour((t) => t + 1); chargerEtat(); }, [chargerEtat]);

  return (
    <div className="borne">
      <Barre />
      {alarmeActive && (
        <div className="bandeau-alarme"><span>⚠ ALARME ACTIVE</span><a href="/alarme">Un chef doit l'arrêter</a></div>
      )}
      {bloqueJusqua > Date.now() && <EcranAlarme jusqua={bloqueJusqua} onFin={finBlocage} />}
      <div className="borne-centre">
        {resultat ? (
          <Reponse
            oui={resultat.acces === 'OUI'}
            titre={resultat.acces === 'OUI' ? 'Accès autorisé' : 'Accès refusé'}
            message={resultat.message}
          >
            <button className="btn principal" type="button" onClick={recommencer} autoFocus>
              {resultat.acces === 'OUI' ? 'Agent suivant' : 'Réessayer'}
            </button>
          </Reponse>
        ) : !qui ? (
          <ChoixQui sens="entree" onChoix={setQui} />
        ) : (
          <Questionnaire key={tour} questions={qui === 'visiteur' ? QUESTIONS_VISITEUR : QUESTIONS_ENTREE} niveau="max" terminer={terminer} desactive={bloqueJusqua > Date.now()} />
        )}
      </div>
    </div>
  );
}
