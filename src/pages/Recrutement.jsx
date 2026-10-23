import { useState } from 'react';
import Page from '../composants/Page.jsx';
import Reponse from '../composants/Reponse.jsx';

// Quiz sur la charte : il faut au moins 6 bonnes réponses sur 8.
const QUIZ = [
  { q: 'Que veut dire M² ?', choix: ['Maël + Marin', 'Mission Mystère', 'Méga Monstre'], bon: 0 },
  { q: 'De quelle couleur est l\'écran quand l\'accès est autorisé ?', choix: ['Rouge', 'Vert', 'Jaune'], bon: 1 },
  { q: 'Combien de questions au contrôle d\'entrée ?', choix: ['8', '12', '16'], bon: 2 },
  { q: 'Que se passe-t-il après 3 NON de suite ?', choix: ['Rien', 'L\'alarme sonne', 'On gagne un bonbon'], bon: 1 },
  { q: 'Peut-on montrer son code secret à un copain ?', choix: ['Oui', 'Seulement le mardi', 'Jamais'], bon: 2 },
  { q: 'Quelle est la couleur de Maël ?', choix: ['Bleu Circuit', 'Rouge Alerte', 'Vert Accès'], bon: 0 },
  { q: 'Le logo M² peut-il être penché ?', choix: ['Oui, c\'est plus joli', 'Non, interdit'], bon: 1 },
  { q: 'Combien de chiffres dans un code secret ?', choix: ['3', '4', '6'], bon: 1 },
];

export default function Recrutement() {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const fini = i >= QUIZ.length;
  const reussi = score >= 6;

  function repondre(k) {
    if (k === QUIZ[i].bon) setScore((s) => s + 1);
    setI(i + 1);
  }

  return (
    <Page numero="OUTIL · BONUS" titre="Test de recrutement" intro="Réponds aux 8 questions. Il faut au moins 6 bonnes réponses pour devenir agent.">
      {fini ? (
        <Reponse oui={reussi} titre={reussi ? 'Test réussi !' : 'Test raté'} message={`${score} bonnes réponses sur ${QUIZ.length}.`}>
          {reussi ? (
            <>
              <span>Va voir Maël ou Marin : ils vont remplir ta fiche d'inscription.</span>
              <a className="btn principal" href="/inscription">Fiche d'inscription</a>
            </>
          ) : (
            <button className="btn principal" type="button" onClick={() => { setI(0); setScore(0); }}>Réessayer</button>
          )}
        </Reponse>
      ) : (
        <div className="etape">
          <div className="etape-haut">
            <div className="etape-infos"><span>QUESTION {i + 1} / {QUIZ.length}</span><span style={{ color: 'var(--jaune)' }}>● RECRUTEMENT</span></div>
            <div className="progres">{QUIZ.map((_, k) => <i key={k} style={k <= i ? { background: 'var(--jaune)' } : undefined} />)}</div>
          </div>
          <div className="etape-corps">
            <div className="etape-question">{QUIZ[i].q}</div>
            {QUIZ[i].choix.map((c, k) => (
              <button key={c} type="button" className="btn large" onClick={() => repondre(k)}>{c}</button>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
