const CHALLENGES = [
  // 🏛️ Société & Actualité
  { theme: 'Le Télétravail', consigne: 'Est-ce la fin des bureaux physiques ?' },
  { theme: 'Les Réseaux Sociaux', consigne: 'Sont-ils devenus trop toxiques ?' },
  { theme: "L'Écologie", consigne: 'Quel petit geste fais-tu au quotidien ?' },
  { theme: 'La Semaine de 4 Jours', consigne: 'Pour ou contre ?' },
  { theme: "L'Intelligence Artificielle", consigne: 'Va-t-elle remplacer les artistes ?' },
  { theme: 'Le Système de Santé', consigne: 'Quelle est la priorité n°1 ?' },
  { theme: 'Les Transports en Commun', consigne: 'Pourquoi sont-ils essentiels ?' },
  { theme: 'La Malbouffe', consigne: 'Faut-il taxer davantage le sucre ?' },
  { theme: 'Le Droit de Vote', consigne: 'Doit-il être obligatoire ?' },
  { theme: "L'Inflation", consigne: 'Comment adaptes-tu ton budget ?' },

  // 📺 Médias & Divertissement
  { theme: 'Netflix vs Cinéma', consigne: 'Lequel va gagner ?' },
  { theme: 'Les Podcasts', consigne: 'Pourquoi ce format cartonne-t-il ?' },
  { theme: 'La Télé-réalité', consigne: 'Un plaisir coupable ou une perte de temps ?' },
  { theme: 'Le Dernier Film Marquant', consigne: "Pourquoi l'as-tu aimé ?" },
  { theme: 'Les Influenceurs', consigne: 'Ont-ils trop de pouvoir sur les jeunes ?' },
  { theme: 'Les Jeux Vidéo', consigne: 'Sont-ils une forme d\'art ?' },
  { theme: 'La Presse Papier', consigne: 'Va-t-elle disparaître ?' },
  { theme: 'YouTube', consigne: 'Est-ce la nouvelle télévision ?' },
  { theme: 'Le Sport à la Télé', consigne: 'Pourquoi cet engouement mondial ?' },
  { theme: 'La Publicité', consigne: 'Nous manipule-t-elle trop ?' },

  // 💡 Concepts & Objets
  { theme: 'Le Papillon', consigne: 'Décris sa transformation.' },
  { theme: 'Le Café', consigne: "Pourquoi est-ce un rituel social ?" },
  { theme: 'Le Smartphone', consigne: 'Peux-tu passer une journée sans lui ?' },
  { theme: "L'Hiver", consigne: 'Ce que tu aimes (ou détestes) dans cette saison.' },
  { theme: 'Le Livre', consigne: 'Papier ou numérique ?' },
  { theme: 'La Musique', consigne: 'Quel genre définit ta personnalité ?' },
  { theme: 'Le Voyage', consigne: 'Ta destination de rêve.' },
  { theme: 'Le Vélo', consigne: "Est-ce le futur de la ville ?" },
  { theme: "L'Amitié", consigne: "Quelle est la qualité principale d'un ami ?" },
  { theme: 'Le Sommeil', consigne: "Pourquoi est-ce négligé aujourd'hui ?" },

  // 🎤 Réflexion Rapide
  { theme: "L'Argent", consigne: "L'argent fait-il le bonheur ?" },
  { theme: 'Ville ou Campagne ?', consigne: 'Où préfères-tu vivre et pourquoi ?' },
  { theme: "Le Meilleur Âge de la Vie", consigne: 'Quel est-il et pourquoi ?' },
  { theme: 'Le Succès', consigne: "C'est quoi pour toi ?" },
  { theme: 'La Vérité', consigne: 'Faut-il toujours la dire ?' },
  { theme: "Apprendre une Langue", consigne: "Quelle est son importance ?" },
  { theme: "Un Souvenir d'Enfance", consigne: 'Raconte ton souvenir le plus net.' },
  { theme: 'Les Animaux', consigne: 'Pourquoi les aimons-nous autant ?' },
  { theme: 'Intelligence vs Chance', consigne: "Qu'est-ce qui détermine le succès ?" },
  { theme: "L'Humanité dans 100 Ans", consigne: 'Quel sera notre futur ?' },
];

/**
 * Returns a random challenge each call.
 */
export function getRandomChallenge() {
  return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
}
