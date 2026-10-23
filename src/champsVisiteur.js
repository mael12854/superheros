// Les données d'un visiteur : ce sont les réponses du contrôle d'entrée (14 questions).
export const CHAMPS_VISITEUR = [
  { cle: 'prenom', label: 'Ton prénom' },
  { cle: 'nom', label: 'Ton nom de famille' },
  { cle: 'dateNaissance', label: 'Ta date de naissance', type: 'date' },
  { cle: 'adresse', label: 'Ton adresse' },
  { cle: 'codePostal', label: 'Ton code postal', type: 'nombre', maxLength: 5 },
  { cle: 'ville', label: 'Ta ville' },
  { cle: 'entree', label: 'Ton entrée préférée' },
  { cle: 'plat', label: 'Ton plat préféré' },
  { cle: 'dessert', label: 'Ton dessert préféré' },
  { cle: 'couleur', label: 'Ta couleur préférée' },
  { cle: 'pouvoir', label: 'Ton pouvoir' },
  { cle: 'chef', label: 'Le nom de ton chef' },
  { cle: 'lien', label: 'Tu es qui pour l\'Agence ?', placeholder: 'Grand-mère, copain, voisin…' },
];

export const NOMS_CHAMPS = Object.fromEntries([...CHAMPS_VISITEUR.map((c) => [c.cle, c.label.replace(/^(Ton |Ta |Le nom de ton )/, '')]), ['code', 'code secret']]);
