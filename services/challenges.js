const CHALLENGES_FR = [
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
  { theme: 'Les Jeux Vidéo', consigne: "Sont-ils une forme d'art ?" },
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

const CHALLENGES_EN = [
  // 🏛️ Society & Current Events
  { theme: 'Remote Work', consigne: 'Is this the end of the physical office?' },
  { theme: 'Social Media', consigne: 'Has it become too toxic?' },
  { theme: 'Ecology', consigne: 'What small habit do you practice daily?' },
  { theme: 'The 4-Day Work Week', consigne: 'For or against?' },
  { theme: 'Artificial Intelligence', consigne: 'Will it replace artists?' },
  { theme: 'The Healthcare System', consigne: "What's the number one priority?" },
  { theme: 'Public Transport', consigne: 'Why is it essential?' },
  { theme: 'Junk Food', consigne: 'Should sugar be taxed more heavily?' },
  { theme: 'The Right to Vote', consigne: 'Should it be mandatory?' },
  { theme: 'Inflation', consigne: 'How are you adapting your budget?' },

  // 📺 Media & Entertainment
  { theme: 'Streaming vs Cinema', consigne: 'Which one will win?' },
  { theme: 'Podcasts', consigne: 'Why has this format taken off?' },
  { theme: 'Reality TV', consigne: 'Guilty pleasure or waste of time?' },
  { theme: 'A Film That Stayed With You', consigne: 'Why did it hit so hard?' },
  { theme: 'Influencers', consigne: 'Do they have too much power over young people?' },
  { theme: 'Video Games', consigne: 'Are they a legitimate art form?' },
  { theme: 'Print Journalism', consigne: 'Is it dying?' },
  { theme: 'YouTube', consigne: 'Is it the new television?' },
  { theme: 'Sports on TV', consigne: 'Why does the world go crazy for it?' },
  { theme: 'Advertising', consigne: 'Is it manipulating us too much?' },

  // 💡 Concepts & Objects
  { theme: 'The Butterfly', consigne: 'Describe its transformation.' },
  { theme: 'Coffee', consigne: 'Why is it a social ritual?' },
  { theme: 'The Smartphone', consigne: 'Could you go a full day without it?' },
  { theme: 'Winter', consigne: 'What you love (or hate) about this season.' },
  { theme: 'Books', consigne: 'Paper or digital?' },
  { theme: 'Music', consigne: 'Which genre defines your personality?' },
  { theme: 'Travel', consigne: 'Your dream destination.' },
  { theme: 'Cycling', consigne: 'Is it the future of cities?' },
  { theme: 'Friendship', consigne: 'What is the most important quality in a friend?' },
  { theme: 'Sleep', consigne: 'Why is it so underrated today?' },

  // 🎤 Quick Take
  { theme: 'Money', consigne: 'Does money buy happiness?' },
  { theme: 'City or Countryside?', consigne: 'Where would you rather live, and why?' },
  { theme: 'The Best Age of Your Life', consigne: 'Which is it, and why?' },
  { theme: 'Success', consigne: 'What does it mean to you?' },
  { theme: 'The Truth', consigne: 'Should you always tell it?' },
  { theme: 'Learning a Language', consigne: 'How important is it really?' },
  { theme: 'A Childhood Memory', consigne: 'Tell your most vivid one.' },
  { theme: 'Animals', consigne: 'Why do we love them so much?' },
  { theme: 'Intelligence vs Luck', consigne: 'What truly determines success?' },
  { theme: 'Humanity in 100 Years', consigne: 'What will our future look like?' },
];

// Day 1 = Jan 1 2025. Challenge ID increases every day forever (like Wordle).
const LAUNCH_MS = new Date('2026-03-17').getTime();

export function getDailyChallenge(lang = 'fr') {
  const challenges = lang === 'en' ? CHALLENGES_EN : CHALLENGES_FR;
  const daysSinceLaunch = Math.floor((Date.now() - LAUNCH_MS) / (1000 * 60 * 60 * 24));
  const index = daysSinceLaunch % challenges.length;
  return { ...challenges[index], challengeId: daysSinceLaunch + 1 };
}

export function getTomorrowChallenge(lang = 'fr') {
  const challenges = lang === 'en' ? CHALLENGES_EN : CHALLENGES_FR;
  const daysSinceLaunch = Math.floor((Date.now() - LAUNCH_MS) / (1000 * 60 * 60 * 24)) + 1;
  const index = daysSinceLaunch % challenges.length;
  return { ...challenges[index], challengeId: daysSinceLaunch + 1 };
}

export function getRandomChallenge(lang = 'fr') {
  const challenges = lang === 'en' ? CHALLENGES_EN : CHALLENGES_FR;
  return challenges[Math.floor(Math.random() * challenges.length)];
}
