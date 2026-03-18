export const translations = {
  fr: {
    // Landing
    tagline:        'Maîtrisez votre voix, un jour à la fois.',
    desc:           'Un défi d\'élocution unique de 30 secondes chaque jour.\nPas de fillers, pas d\'hésitation.\nJuste de l\'impact.\n\nUne seule chance. Pas de replay.',
    play_btn:       'Jouer',
    played_btn:     'Voir mon résultat',
    login_btn:      'Se connecter',
    streak_days:    n => `${n} jour${n > 1 ? 's' : ''} de série`,

    // Home
    challenge_prefix:   'Challenge',
    ready_hint:         'Prêt pour le défi ?',
    start_btn:          'Commencer',
    theme_label:        'THÈME',
    ready_btn:          'Je suis prêt',
    preparing:          'Préparez-vous…',
    speak_now:          'Parlez maintenant',
    step_transcription: 'Transcription audio…',
    step_evaluation:    'Évaluation du discours…',
    done_title:         'Défi du jour terminé !',
    done_subtitle:      'Reviens demain pour le prochain défi.',
    next_label:         'PROCHAIN DÉFI DANS',
    mic_denied:         'Permission microphone refusée.',

    // Result
    feedback_label:  'RETOUR',
    detail_label:    'DÉTAIL',
    fillers_label:   'MOTS PARASITES',
    theme_label_r:   'THÈME',
    history_label:   'HISTORIQUE',
    transcript_label:'TRANSCRIPTION',
    fluidity:        'FLUIDITÉ',
    fillers:         'MOTS PARASITES',
    relevance:       'PERTINENCE',
    filler_none:     'AUCUN',
    filler_few:      'QUELQUES-UNS',
    filler_too_many: 'TROP',
    grade_excellent: 'EXCELLENT',
    grade_correct:   'CORRECT',
    grade_rework:    'À RETRAVAILLER',
    btn_listen:      'Écouter',
    btn_pause:       'Pause',
    btn_resume:      'Reprendre',
    btn_share:       'Partager',
    btn_replay:      'Rejouer',

    // Auth
    ph_username:       "Nom d'utilisateur",
    ph_email:          'Email',
    ph_password:       'Mot de passe',
    submit_login:      'Se connecter',
    submit_signup:     'Créer le compte',
    toggle_to_signup:  "Pas encore de compte — S'inscrire",
    toggle_to_login:   'Déjà un compte — Se connecter',
    err_generic:       'Une erreur est survenue.',
    err_email_used:    'Email déjà utilisé.',
    err_wrong_pass:    'Email ou mot de passe incorrect.',
    err_weak_pass:     'Mot de passe trop court (6 caractères min).',
    err_invalid_email: 'Adresse email invalide.',
    err_network:       'Erreur réseau. Vérifie ta connexion.',

    // Onboarding slides
    slide1_sub:      'Swipe pour découvrir →',
    slide2_title:    'CHAQUE JOUR, UN NOUVEAU THÈME',
    slide2_sub:      'Tout le monde répond au même défi.',
    slide3_title:    '30 SECONDES POUR CONVAINCRE',
    slide3_sub:      'Sans fillers. Sans hésitation.',
    slide4_title:    "L'IA T'ÉVALUE EN TEMPS RÉEL",
    slide4_sub:      'Fluidité · Pertinence · Mots parasites',
    slide5_title:    'UNE SEULE CHANCE PAR JOUR',
    slide5_sub:      'Bats tes amis. Construis ta série.',
    slide5_share:    'Partage tes résultats sur les réseaux sociaux.',

    // Landing demo
    demo_step1:      'THÈME DU JOUR',
    demo_theme:      'Le Télétravail',
    demo_consigne:   'Est-ce la fin des bureaux physiques ?',
    demo_step2:      'TU PARLES',
    demo_step2_sub:  '30 secondes, sans fillers',
    demo_step3:      'TON SCORE',
    demo_feedback:   '"Bonne fluidité, mais évite les «euh»."',
    demo_rule:       'Une seule chance. Pas de replay. Bats tes amis.',

    // Podium
    podium_title:    'PODIUM DU JOUR',
    podium_empty:    'Aucun ami n\'a encore joué aujourd\'hui.',
    no_friends:      'Aucun ami pour l\'instant.',
    no_requests:     'Aucune demande en attente.',
    search_placeholder: 'Rechercher un joueur…',

    // GuestGate
    gate_feed_title:       'FEED',
    gate_feed_sub:         'Connecte-toi pour voir\nles scores de tes amis en temps réel.',
    gate_friends_title:    'AMIS',
    gate_friends_sub:      'Connecte-toi pour ajouter des amis\net comparer vos scores.',
    gate_profile_title:    'PROFIL',
    gate_profile_sub:      'Crée un compte pour sauvegarder\nton historique et rejoindre la communauté.',

    // Share
    share_text: (id, score, fillers, streak) =>
      `Glossia #Challenge${id}\n\n🎤 Score : ${score}/100\n🚫 Filler words : ${fillers}\n🔥 Streak : ${streak} jour${streak > 1 ? 's' : ''}\n\nhttps://glossia.app`,

    // First session
    first_reassure:   'Pas de pression — parle comme tu parles à un ami.',
    first_avg:        score => `La moyenne des joueurs est 61. Tu es à ${score} dès ta première fois.`,
    tomorrow_label:   'DEMAIN',
    tomorrow_sub:     'Reviens pour le relever.',

    // Ranks
    ranks: ['Novice', 'Apprenti', 'Régulier', 'Assidu', 'Éloquent', 'Expert', 'Maître', 'Virtuose', 'Légende', 'Icône'],

    // GPT
    gpt_system_first: (duration) =>
      `Tu es l'arbitre d'un jeu d'éloquence. C'est la première fois que cet utilisateur joue — sois bienveillant et encourageant. Commence TOUJOURS ton feedback par ce qui s'est bien passé avant d'aborder les axes d'amélioration. Reçois la transcription d'un discours de ${duration} secondes. Évalue sur 3 critères : fluidité (30pts max), absence de mots parasites comme "euh", "alors", "donc", "voilà", "genre", "en fait", "bah" (30pts max), pertinence par rapport au thème (40pts max). Le score total est la somme des 3. Retourne UNIQUEMENT un JSON valide : {"score": number, "fluidity": number, "fillers_score": number, "relevance": number, "feedback": string, "fillers_count": number}. Rédige le feedback en français.`,
    gpt_system: (duration) =>
      `Tu es l'arbitre d'un jeu d'éloquence. Reçois la transcription d'un discours de ${duration} secondes. Évalue sur 3 critères : fluidité (30pts max), absence de mots parasites comme "euh", "alors", "donc", "voilà", "genre", "en fait", "bah" (30pts max), pertinence par rapport au thème (40pts max). Le score total est la somme des 3. Retourne UNIQUEMENT un JSON valide avec exactement cette structure : {"score": number, "fluidity": number, "fillers_score": number, "relevance": number, "feedback": string, "fillers_count": number}. Rédige le feedback en français.`,
    gpt_user: (theme, transcript) => `Thème : "${theme}"\nTranscription : "${transcript}"`,
    whisper_lang: 'fr',
  },

  en: {
    // Landing
    tagline:     'Master your voice, one day at a time.',
    desc:        'A unique 30-second speaking challenge every day.\nNo fillers, no hesitation.\nJust impact.\n\nOne shot. No retakes.',
    play_btn:    'Play',
    played_btn:  'View my result',
    login_btn:   'Log in',
    streak_days: n => `${n}-day streak`,

    // Home
    challenge_prefix:   'Challenge',
    ready_hint:         "Ready for today's challenge?",
    start_btn:          'Start',
    theme_label:        'THEME',
    ready_btn:          "I'm ready",
    preparing:          'Get ready…',
    speak_now:          'Speak now',
    step_transcription: 'Transcribing audio…',
    step_evaluation:    'Evaluating speech…',
    done_title:         "Today's challenge complete!",
    done_subtitle:      'Come back tomorrow for the next challenge.',
    next_label:         'NEXT CHALLENGE IN',
    mic_denied:         'Microphone permission denied.',

    // Result
    feedback_label:  'FEEDBACK',
    detail_label:    'BREAKDOWN',
    fillers_label:   'FILLER WORDS',
    theme_label_r:   'THEME',
    history_label:   'HISTORY',
    transcript_label:'TRANSCRIPT',
    fluidity:        'FLUENCY',
    fillers:         'FILLER WORDS',
    relevance:       'RELEVANCE',
    filler_none:     'NONE',
    filler_few:      'A FEW',
    filler_too_many: 'TOO MANY',
    grade_excellent: 'EXCELLENT',
    grade_correct:   'GOOD',
    grade_rework:    'NEEDS WORK',
    btn_listen:      'Listen',
    btn_pause:       'Pause',
    btn_resume:      'Resume',
    btn_share:       'Share',
    btn_replay:      'Try Again',

    // Auth
    ph_username:       'Username',
    ph_email:          'Email',
    ph_password:       'Password',
    submit_login:      'Log in',
    submit_signup:     'Create account',
    toggle_to_signup:  "Don't have an account — Sign up",
    toggle_to_login:   'Already have an account — Log in',
    err_generic:       'An error occurred. Please try again.',
    err_email_used:    'This email is already registered.',
    err_wrong_pass:    'Invalid email or password.',
    err_weak_pass:     'Password is too weak (minimum 6 characters).',
    err_invalid_email: 'Invalid email address.',
    err_network:       'Network error. Please check your connection.',

    // Onboarding slides
    slide1_sub:      'Swipe to discover →',
    slide2_title:    'A NEW THEME EVERY DAY',
    slide2_sub:      'Everyone answers the same challenge.',
    slide3_title:    '30 SECONDS TO CONVINCE',
    slide3_sub:      'No fillers. No hesitation.',
    slide4_title:    'AI SCORES YOU IN REAL TIME',
    slide4_sub:      'Fluency · Relevance · Filler words',
    slide5_title:    'ONE SHOT PER DAY',
    slide5_sub:      'Beat your friends. Build your streak.',
    slide5_share:    'Share your results on social media.',

    // Landing demo
    demo_step1:      "TODAY'S THEME",
    demo_theme:      'Remote Work',
    demo_consigne:   'Is this the end of the physical office?',
    demo_step2:      'YOU SPEAK',
    demo_step2_sub:  '30 seconds, no fillers',
    demo_step3:      'YOUR SCORE',
    demo_feedback:   '"Good fluency, but watch the filler words."',
    demo_rule:       'One shot. No retakes. Beat your friends.',

    // Podium
    podium_title:    'PODIUM OF THE DAY',
    podium_empty:    'No friends have played yet today.',
    no_friends:      'No friends yet.',
    no_requests:     'No pending requests.',
    search_placeholder: 'Search a player…',

    // GuestGate
    gate_feed_title:    'FEED',
    gate_feed_sub:      "Log in to see\nyour friends' scores in real time.",
    gate_friends_title: 'FRIENDS',
    gate_friends_sub:   'Log in to add friends\nand compare your scores.',
    gate_profile_title: 'PROFILE',
    gate_profile_sub:   'Create an account to save\nyour history and join the community.',

    // Share
    share_text: (id, score, fillers, streak) =>
      `Glossia #Challenge${id}\n\n🎤 Score: ${score}/100\n🚫 Filler words: ${fillers}\n🔥 Streak: ${streak} day${streak !== 1 ? 's' : ''}\n\nhttps://glossia.app`,

    // First session
    first_reassure:   'No pressure — just talk like you would to a friend.',
    first_avg:        score => `The player average is 61. You scored ${score} on your very first try.`,
    tomorrow_label:   'TOMORROW',
    tomorrow_sub:     'Come back to take it on.',

    // Ranks
    ranks: ['Novice', 'Apprentice', 'Regular', 'Consistent', 'Eloquent', 'Expert', 'Master', 'Virtuoso', 'Legend', 'Icon'],

    // GPT
    gpt_system_first: (duration) =>
      `You are the judge of a public speaking game. This is the user's first time playing — be kind and encouraging. ALWAYS start your feedback with what went well before addressing areas for improvement. You receive the transcription of a ${duration}-second speech. Evaluate on 3 criteria: fluency (30pts max), absence of filler words like "um", "uh", "so", "like", "you know", "basically", "right" (30pts max), relevance to the theme (40pts max). The total score is the sum of the 3. Return ONLY valid JSON: {"score": number, "fluidity": number, "fillers_score": number, "relevance": number, "feedback": string, "fillers_count": number}. Write the feedback in English.`,
    gpt_system: (duration) =>
      `You are the judge of a public speaking game. You receive the transcription of a ${duration}-second speech. Evaluate on 3 criteria: fluency (30pts max), absence of filler words like "um", "uh", "so", "like", "you know", "basically", "right" (30pts max), relevance to the theme (40pts max). The total score is the sum of the 3. Return ONLY valid JSON with exactly this structure: {"score": number, "fluidity": number, "fillers_score": number, "relevance": number, "feedback": string, "fillers_count": number}. Write the feedback in English.`,
    gpt_user: (theme, transcript) => `Theme: "${theme}"\nTranscript: "${transcript}"`,
    whisper_lang: 'en',
  },
};
