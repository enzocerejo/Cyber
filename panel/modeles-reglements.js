// Modèles de règlement prêts à l'emploi, pour le message de vérification (bot + panel).
// Variables : {serveur} = nom du serveur, {#nom} = lien vers le premier salon dont le nom contient « nom ».
// Mise en forme Discord : # titre, ### section, **gras**, -# petit texte, [texte](lien).
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.CYBER_REGLEMENTS = fabrique();
}(typeof self !== 'undefined' ? self : this, () => {
  const R = (id, cat, emoji, nom, desc, titre, bouton, sections) => ({
    id, cat, emoji, nom, desc, titre, bouton, message: sections.map(([t, c]) => (t ? `### ${t}\n${c}` : c)).join('\n\n'),
  });

  const RESPECT = 'Pas d\'insultes, de harcèlement, de moqueries ni de propos racistes, sexistes, homophobes ou discriminatoires. On peut ne pas être d\'accord, sans attaquer la personne.';
  const SPAM = 'Pas de spam, de flood, de mentions inutiles ni de messages en majuscules. Aucune publicité, ni dans les salons ni en messages privés aux membres.';
  const NSFW = 'Aucun contenu NSFW, choquant, violent ou illégal, y compris dans les pseudos, avatars et statuts.';
  const SECU = 'Ne partage jamais ton mot de passe, ton code de double authentification ou ton token. Le staff ne te les demandera jamais. Méfie-toi des faux cadeaux Nitro et des liens étranges.';
  const PRIVE = 'Ne publie jamais les informations personnelles de quelqu\'un (nom, adresse, photos, numéro…), même pour rire.';
  const SANCTIONS = 'Selon la gravité : avertissement, exclusion temporaire, expulsion ou bannissement. Le staff peut sanctionner un comportement nuisible même s\'il n\'est pas listé ici.';
  const DISCORD = 'Tu dois respecter les [Conditions d\'utilisation](https://discord.com/terms) et les [Lignes directrices](https://discord.com/guidelines) de Discord, dont l\'âge minimum.';

  const MODELES = [
    R('support', 'Support', '🛠️', 'Serveur de support', 'Pour le support d\'un bot, d\'une appli ou d\'un projet (modèle du serveur Cyber).',
      '📜 Règlement de {serveur}', 'J\'accepte le règlement', [
        [null, 'Bienvenue sur le serveur de support de **{serveur}** !\nLis ces règles, puis clique sur le bouton tout en bas pour débloquer le serveur.'],
        ['🤝 1. Respect', RESPECT],
        ['🚫 2. Contenu interdit', 'Aucun contenu NSFW, choquant ou illégal. Pas de triche, de comptes volés, de logiciels piratés ni de fuites de données.'],
        ['📢 3. Spam et publicité', `${SPAM} Les partenariats se demandent par ticket.`],
        ['🎫 4. Obtenir de l\'aide', '• Question publique : {#entraide}. Une question par message, avec la commande utilisée, l\'erreur et une capture si possible.\n• Problème privé : ouvre un ticket dans {#ticket}.\n• Pas de messages privés au staff. L\'équipe est bénévole, reste patient et poli.'],
        ['🔐 5. Sécurité', SECU],
        ['🗂️ 6. Vie privée', PRIVE],
        ['⚖️ 7. Sanctions', `${SANCTIONS} Pour contester, ouvre un ticket calmement.`],
        ['📘 8. Règles de Discord', DISCORD],
      ]),
    R('communaute', 'Général', '🌍', 'Communauté générale', 'Le règlement classique, adapté à la plupart des serveurs.',
      '📜 Règlement de {serveur}', 'J\'accepte le règlement', [
        [null, 'Bienvenue sur **{serveur}** ! Pour que tout le monde passe un bon moment, merci de lire et d\'accepter ces règles.'],
        ['🤝 Respect', RESPECT],
        ['💬 Salons', 'Utilise chaque salon pour ce à quoi il sert. Reste sur le sujet, et va dans {#general} pour discuter de tout et de rien.'],
        ['📢 Spam et pub', SPAM],
        ['🔞 Contenu', NSFW],
        ['🗂️ Vie privée', PRIVE],
        ['👮 Staff', 'Les décisions du staff s\'appliquent. Un désaccord ? Parles-en calmement en privé avec un modérateur, pas en public.'],
        ['⚖️ Sanctions', SANCTIONS],
        ['📘 Discord', DISCORD],
      ]),
    R('court', 'Général', '⚡', 'Règlement court', 'Cinq règles, pour un serveur entre amis ou une petite communauté.',
      '📜 Les règles', 'C\'est compris !', [
        [null, '**1.** Sois respectueux avec tout le monde.\n**2.** Pas de spam ni de pub.\n**3.** Pas de contenu choquant ou NSFW.\n**4.** Pas d\'infos perso sur les autres.\n**5.** Écoute le staff.\n\nBonne ambiance sur **{serveur}** ! 🎉'],
      ]),
    R('strict', 'Général', '🛡️', 'Règlement complet et strict', 'Pour les grands serveurs : règles détaillées et sanctions graduées.',
      '📜 Règlement officiel de {serveur}', 'J\'ai lu et j\'accepte', [
        [null, 'En rejoignant **{serveur}**, tu acceptes ce règlement. L\'ignorer n\'est pas une excuse.'],
        ['1. Comportement', `${RESPECT} Les provocations, le « troll » et les débats politiques ou religieux enflammés sont interdits.`],
        ['2. Messages', 'Écris lisiblement, sans flood ni majuscules. Pas de messages en double dans plusieurs salons. Pas de ghost ping.'],
        ['3. Contenu', `${NSFW} Les spoilers doivent être cachés avec ||ceci||.`],
        ['4. Publicité', 'Toute publicité est interdite sans accord écrit du staff : liens d\'invitation, chaînes, ventes, en salon comme en MP.'],
        ['5. Pseudos et profils', 'Pseudo lisible et mentionnable, sans insulte ni usurpation (staff, célébrité, autre membre).'],
        ['6. Vocaux', 'Pas de cris, de soundboards abusifs ni de musique sans accord. Pas d\'enregistrement sans l\'accord de tous.'],
        ['7. Sécurité', `${SECU} Comptes multiples interdits pour contourner une sanction.`],
        ['8. Sanctions', '1ʳᵉ fois : avertissement.\n2ᵉ fois : exclusion 1 h à 24 h.\n3ᵉ fois : exclusion 7 jours ou expulsion.\nFaute grave (haine, NSFW, doxxing, raid) : bannissement direct.'],
        ['9. Discord', DISCORD],
      ]),
    R('gaming', 'Jeux vidéo', '🎮', 'Gaming', 'Pour une communauté de joueurs : fair-play, recrutement, vocaux.',
      '🎮 Règlement de {serveur}', 'Prêt à jouer !', [
        [null, 'Bienvenue joueur ! Avant de lancer une partie, lis ces règles.'],
        ['🤝 Fair-play', 'Pas de toxicité, de rage ni d\'insultes, même après une défaite. On joue pour s\'amuser.'],
        ['🚫 Triche', 'Aucun cheat, hack, macro interdite, vente ou partage de comptes. Le boosting payant est interdit.'],
        ['🎧 Vocaux', 'Coupe ton micro quand tu ne parles pas en partie. Pas de cris ni de soundboard abusif.'],
        ['🔎 Recherche de joueurs', 'Utilise {#recherche} pour trouver des coéquipiers. Indique le jeu, la plateforme et ton niveau.'],
        ['📢 Spam et pub', SPAM],
        ['🔞 Contenu', NSFW],
        ['⚖️ Sanctions', SANCTIONS],
      ]),
    R('minecraft', 'Jeux vidéo', '⛏️', 'Serveur de jeu (Minecraft, GTA RP…)', 'Pour le Discord d\'un serveur de jeu : règles en jeu et sur Discord.',
      '⛏️ Règlement de {serveur}', 'J\'accepte et je joue', [
        [null, 'Ce règlement s\'applique **en jeu et sur le Discord**.'],
        ['🤝 Respect', RESPECT],
        ['🚫 Triche', 'Aucun client modifié, x-ray, duplication, bug abuse ni macro. Un bug trouvé se signale dans {#bug}.'],
        ['🏠 Constructions', 'Pas de grief, de vol ni de constructions offensantes. Respecte les zones des autres joueurs.'],
        ['💰 Économie', 'Les ventes contre de l\'argent réel sont interdites. Les arnaques entre joueurs sont sanctionnées.'],
        ['📢 Pub', SPAM],
        ['🎫 Aide', 'Un problème en jeu ? Ouvre un ticket dans {#ticket} avec ton pseudo en jeu et des captures.'],
        ['⚖️ Sanctions', `${SANCTIONS} Les bannissements en jeu et sur le Discord peuvent être liés.`],
      ]),
    R('esport', 'Jeux vidéo', '🏆', 'Équipe e-sport', 'Pour une équipe ou une structure compétitive.',
      '🏆 Règlement de {serveur}', 'Je rejoins l\'équipe', [
        [null, 'Bienvenue dans la structure **{serveur}** !'],
        ['🤝 Esprit d\'équipe', 'Respect des coéquipiers, des adversaires et du staff. Pas de rage en public ni après un match.'],
        ['📅 Engagement', 'Préviens à l\'avance si tu ne peux pas venir à un entraînement ou à un match ({#absences}).'],
        ['🔒 Confidentialité', 'Les stratégies, compositions et échanges internes ne sortent pas du serveur.'],
        ['🚫 Triche', 'Toute triche, smurf interdit ou partage de compte entraîne une exclusion de l\'équipe.'],
        ['📢 Image', 'Tu représentes l\'équipe : pas de comportement toxique sur les réseaux ou en jeu.'],
        ['⚖️ Sanctions', SANCTIONS],
      ]),
    R('roleplay', 'Roleplay', '🎭', 'Roleplay', 'Pour un serveur RP : HRP, personnages, consentement.',
      '🎭 Règlement de {serveur}', 'J\'entre dans l\'histoire', [
        [null, 'Bienvenue dans l\'univers de **{serveur}** !'],
        ['🎭 RP et HRP', 'Les salons RP sont réservés à l\'histoire. Pour parler hors personnage, utilise {#hrp} ou mets tes messages entre (( parenthèses )).'],
        ['🧙 Personnages', 'Une fiche validée par le staff est obligatoire avant de jouer. Pas de personnage tout-puissant.'],
        ['🚫 Powergaming et métagaming', 'Ne contrôle pas le personnage des autres et n\'utilise pas en RP ce que ton personnage ne peut pas savoir.'],
        ['🤝 Consentement', 'Les scènes sensibles (violence, mort d\'un personnage) se font avec l\'accord des joueurs concernés.'],
        ['🔞 Contenu', NSFW],
        ['⚖️ Sanctions', SANCTIONS],
      ]),
    R('etudes', 'Études', '📚', 'Études et entraide scolaire', 'Pour une classe, une promo ou un serveur d\'entraide.',
      '📚 Règlement de {serveur}', 'J\'accepte et je révise', [
        [null, 'Ici, on s\'entraide pour réussir. Merci de respecter ces règles.'],
        ['🤝 Bienveillance', 'Aucune question n\'est bête. Pas de moqueries, explique avec patience.'],
        ['✏️ Entraide, pas triche', 'On aide à comprendre, on ne fait pas les devoirs des autres. Pas de partage de sujets d\'examen ni de réponses pendant une épreuve.'],
        ['❓ Poser une question', 'Va dans {#entraide}. Indique la matière, le niveau et ce que tu as déjà essayé.'],
        ['📁 Documents', 'Partage seulement tes propres documents ou des ressources libres. Pas de PDF piratés.'],
        ['📢 Spam et pub', SPAM],
        ['🗂️ Vie privée', PRIVE],
        ['⚖️ Sanctions', SANCTIONS],
      ]),
    R('informatique', 'Informatique', '💻', 'Informatique et cybersécurité', 'Pour un serveur tech, dev, réseau ou cyber (éthique incluse).',
      '💻 Règlement de {serveur}', 'J\'accepte le règlement', [
        [null, 'Bienvenue sur **{serveur}**, un espace pour apprendre et partager autour de l\'informatique.'],
        ['🤝 Respect', 'Tout le monde a été débutant. Pas de mépris ni de « RTFM » sec : aide ou passe ton chemin.'],
        ['🧑‍💻 Poser une question', 'Utilise {#entraide}. Donne ton code dans un bloc ```, le message d\'erreur complet et ce que tu as essayé.'],
        ['🛡️ Éthique', 'On apprend la sécurité pour **se défendre**. Aucune aide pour attaquer un système, un compte ou un réseau qui n\'est pas à toi ou sans autorisation écrite.'],
        ['🚫 Interdit', 'Pas de malwares, de logiciels piratés, de bases de données volées ni de services de DDoS.'],
        ['🔐 Sécurité', SECU],
        ['📢 Spam et pub', `${SPAM} Tes projets open source sont les bienvenus dans {#projets}.`],
        ['⚖️ Sanctions', SANCTIONS],
      ]),
    R('createur', 'Créateurs', '🎥', 'Communauté d\'un créateur', 'Pour la communauté d\'un streamer, youtubeur ou artiste.',
      '🎥 Bienvenue dans la communauté !', 'J\'accepte et je rejoins', [
        [null, 'Ravi de te voir sur **{serveur}** ! Quelques règles pour garder une bonne ambiance.'],
        ['🤝 Respect', `${RESPECT} Ça vaut aussi envers le créateur et les autres créateurs.`],
        ['🔔 Annonces', 'Les lives et vidéos sont annoncés dans {#annonces}. Pas besoin de mentionner le créateur pour demander quand il revient.'],
        ['📢 Pub', 'Pas d\'autopromotion en dehors de {#pub} (si le salon existe). Pas de pub en MP.'],
        ['🔞 Contenu', NSFW],
        ['🚫 Spoilers', 'Cache les spoilers avec ||ceci|| pendant au moins une semaine.'],
        ['⚖️ Sanctions', SANCTIONS],
      ]),
    R('art', 'Créateurs', '🎨', 'Art et création', 'Pour un serveur de dessin, d\'écriture, de musique ou de photo.',
      '🎨 Règlement de {serveur}', 'J\'accepte et je crée', [
        [null, 'Bienvenue aux artistes de **{serveur}** !'],
        ['🖌️ Tes créations', 'Partage seulement ce que tu as créé toi-même, ou crédite clairement l\'auteur.'],
        ['🚫 Vol et IA', 'Pas de vol d\'œuvres ni de retouche sans accord. Les créations générées par IA doivent être indiquées comme telles.'],
        ['💬 Critiques', 'Les critiques sont constructives et bienveillantes, et seulement si la personne en demande.'],
        ['💰 Commissions', 'Les commandes payantes se font dans {#commissions}, à tes risques. Le staff ne gère pas les litiges.'],
        ['🔞 Contenu', NSFW],
        ['⚖️ Sanctions', SANCTIONS],
      ]),
    R('boutique', 'Boutique', '🛒', 'Boutique et vente', 'Pour une boutique, des services ou une marketplace entre membres.',
      '🛒 Conditions de {serveur}', 'J\'accepte les conditions', [
        [null, 'Bienvenue sur la boutique **{serveur}**. Lis ces conditions avant tout achat.'],
        ['🧾 Commandes', 'Toute commande passe par un ticket dans {#ticket}. Aucun achat n\'est valable en message privé.'],
        ['💳 Paiements', 'Seuls les moyens de paiement annoncés par le staff sont acceptés. Le staff ne demandera jamais un paiement en MP.'],
        ['↩️ Remboursements', 'Les conditions de remboursement sont indiquées pour chaque produit. Un litige se règle par ticket, calmement.'],
        ['🚫 Arnaques', 'Toute tentative d\'arnaque, de chargeback abusif ou d\'usurpation du staff entraîne un bannissement.'],
        ['🤝 Respect', RESPECT],
        ['📢 Pub', SPAM],
      ]),
    R('entraide', 'Communauté', '💞', 'Entraide et bien-être', 'Pour un serveur d\'écoute, de soutien ou une safe place.',
      '💞 Règles de {serveur}', 'Je m\'engage à être bienveillant', [
        [null, 'Ce serveur est un espace sûr. Chacun doit pouvoir s\'y sentir écouté.'],
        ['💛 Bienveillance', 'Écoute sans juger. Pas de moqueries, de minimisation ni de conseils agressifs.'],
        ['⚠️ Sujets sensibles', 'Préviens avec un avertissement (TW) avant un sujet difficile, et cache les détails avec ||ceci||.'],
        ['🆘 Urgence', 'Nous ne remplaçons pas un professionnel. En danger immédiat, appelle le **112**. En France : **3114** (prévention du suicide), 24 h/24, gratuit.'],
        ['🗂️ Confidentialité', 'Ce qui est confié ici ne sort pas d\'ici. Pas de captures d\'écran partagées ailleurs.'],
        ['🚫 Interdit', `${NSFW} Pas de démarchage, de vente ou de « coaching » payant.`],
        ['⚖️ Sanctions', SANCTIONS],
      ]),
    R('evenements', 'Événements', '🎉', 'Événements et giveaways', 'Pour un serveur centré sur les concours, tournois et animations.',
      '🎉 Règlement de {serveur}', 'J\'accepte et je participe', [
        [null, 'Bienvenue ! Ici on organise des événements, concours et giveaways.'],
        ['🎁 Giveaways', 'Un seul compte par personne. Les comptes multiples sont exclus et bannis. Les gagnants ont 48 h pour répondre.'],
        ['🏆 Tournois', 'Inscription dans {#inscriptions}. Sois à l\'heure, respecte les adversaires et les décisions des arbitres.'],
        ['🤝 Respect', RESPECT],
        ['📢 Spam et pub', SPAM],
        ['⚖️ Sanctions', `${SANCTIONS} Une triche à un événement exclut de tous les suivants.`],
      ]),
    R('international', 'Communauté', '🌐', 'Bilingue français / anglais', 'Règlement court en deux langues pour un serveur international.',
      '📜 Règlement / Rules', 'J\'accepte / I agree', [
        ['🇫🇷 Français', '**1.** Respecte tout le monde.\n**2.** Pas de spam ni de pub.\n**3.** Pas de contenu NSFW ou choquant.\n**4.** Pas d\'infos personnelles sur les autres.\n**5.** Écoute le staff.'],
        ['🇬🇧 English', '**1.** Be respectful to everyone.\n**2.** No spam or advertising.\n**3.** No NSFW or shocking content.\n**4.** No personal information about others.\n**5.** Listen to the staff.'],
        [null, '-# [Discord Terms](https://discord.com/terms) · [Guidelines](https://discord.com/guidelines)'],
      ]),
    R('verification', 'Général', '🤖', 'Vérification simple (sans règlement)', 'Juste un bouton anti-robots, si ton règlement est ailleurs.',
      '🛡️ Vérification', 'Je ne suis pas un robot', [
        [null, 'Pour protéger **{serveur}** des robots et des raids, clique sur le bouton ci-dessous pour accéder au serveur.'],
      ]),
  ];

  const ordre = [...new Set(MODELES.map((m) => m.cat))];
  const CATEGORIES = ordre.map((nom) => ({ nom, nombre: MODELES.filter((m) => m.cat === nom).length }));
  return { MODELES, CATEGORIES };
}));
