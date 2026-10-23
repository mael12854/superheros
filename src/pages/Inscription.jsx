import Page from '../composants/Page.jsx';
import FormAgent from '../composants/FormAgent.jsx';
import { ReserveChef } from '../composants/Chef.jsx';

export default function Inscription() {
  return (
    <Page numero="OUTIL · PRIORITÉ" titre="Fiche d'inscription" intro="Crée un nouvel agent. Toutes les réponses serviront au contrôle d'entrée : écris-les exactement comme l'agent les dira.">
      <ReserveChef><FormAgent /></ReserveChef>
    </Page>
  );
}
