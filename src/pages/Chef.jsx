import Page, { useSession } from '../composants/Page.jsx';
import { ConnexionChef } from '../composants/Chef.jsx';
import { OUTILS } from '../outils.js';

export default function Chef() {
  const session = useSession();
  return (
    <Page numero="ACCÈS CHEF" titre={session ? `Bonjour, ${session.nomHeros}` : 'Accès chef'} intro={session ? 'Tu as accès à tous les outils réservés aux chefs.' : 'Réservé à Maël et Marin.'}>
      {session ? (
        <div className="grille">
          {[...OUTILS.filter((o) => o.chef), { chemin: '/agents', nom: 'Les agents', texte: 'Liste, codes, retirer un agent.' }, { chemin: '/visiteurs', nom: 'Comptes visiteurs', texte: 'Valider ou refuser les comptes.' }].map((o) => (
            <a key={o.chemin} className="tuile" href={o.chemin}><b>{o.nom}</b><span>{o.texte}</span></a>
          ))}
        </div>
      ) : <ConnexionChef />}
    </Page>
  );
}
