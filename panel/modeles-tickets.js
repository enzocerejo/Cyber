// Catalogue des modèles de tickets prêts à l'emploi (modifiables dans le panel après ajout).
// Utilisé par le panel (galerie « Voir tous les modèles ») et par le bot (validation).
// Question : « Libellé » = réponse courte, « ¶Libellé » = réponse longue, « ?» à la fin = facultative.
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.CYBER_TICKETS = fabrique();
}(typeof self !== 'undefined' ? self : this, () => {
  // [catégorie, emoji, [[id, emoji, nom, description, préfixe du salon, questions]]]
  const BRUT = [
    ['Support', '🛟', [
      ['support', '🎫', 'Support général', 'Une question ou un souci ? L\'équipe t\'aide.', 'support', ['¶Explique ta demande']],
      ['question', '❓', 'Question', 'Pose une question à l\'équipe.', 'question', ['¶Ta question']],
      ['technique', '🛠️', 'Problème technique', 'Quelque chose ne marche pas comme prévu.', 'tech', ['Sur quoi ? (appareil, appli, jeu)', '¶Que se passe-t-il ?', 'Depuis quand ??']],
      ['bug-bot', '🤖', 'Bug d\'un bot', 'Un bot du serveur se comporte mal.', 'bug', ['Quel bot et quelle commande ?', '¶Que s\'est-il passé ?']],
      ['role-manquant', '🏷️', 'Problème de rôle', 'Un rôle manque ou est en trop.', 'role', ['Quel rôle ?', '¶Pourquoi devrais-tu l\'avoir ?']],
      ['acces-salon', '🔐', 'Accès à un salon', 'Tu ne vois pas un salon que tu devrais voir.', 'acces', ['Quel salon ?', '¶Pourquoi en as-tu besoin ??']],
      ['debutant', '🌱', 'Aide pour débuter', 'Nouveau sur le serveur ? On te guide.', 'aide', ['¶Sur quoi as-tu besoin d\'aide ?']],
      ['infos', 'ℹ️', 'Demande d\'informations', 'Obtenir des informations sur le serveur ou un projet.', 'infos', ['¶Quelles informations cherches-tu ?']],
      ['avis', '💬', 'Avis et retours', 'Donne ton avis sur le serveur.', 'avis', ['Note sur 10', '¶Ton avis']],
      ['contact-staff', '📨', 'Contacter le staff', 'Parler en privé avec l\'équipe.', 'staff', ['¶Ton message']],
      ['urgence', '🚨', 'Urgence', 'Problème grave à traiter tout de suite.', 'urgent', ['¶Que se passe-t-il ?']],
      ['autre', '📁', 'Autre demande', 'Tout ce qui ne rentre dans aucune case.', 'demande', ['Sujet', '¶Détails']],
    ]],
    ['Plaintes et signalements', '🚩', [
      ['plainte', '⚠️', 'Plainte contre un membre', 'Signaler le comportement d\'un membre.', 'plainte', ['Pseudo ou ID du membre', '¶Que s\'est-il passé ?', 'Preuves (liens, captures) ?']],
      ['harcelement', '🛑', 'Harcèlement', 'Tu es harcelé·e ou tu en es témoin.', 'harcelement', ['Qui est concerné ?', '¶Raconte ce qui se passe', 'Preuves ?']],
      ['arnaque', '🎣', 'Arnaque', 'Faux Nitro, faux cadeau, vol de compte…', 'arnaque', ['Pseudo de l\'arnaqueur', '¶Comment ça s\'est passé ?', 'Lien ou capture ?']],
      ['nsfw', '🔞', 'Contenu choquant', 'Contenu NSFW ou choquant posté sur le serveur.', 'signalement', ['Dans quel salon ?', '¶Description (sans reposter le contenu)']],
      ['appel-sanction', '⚖️', 'Contester une sanction', 'Tu penses avoir été sanctionné à tort.', 'appel', ['Quelle sanction ? (mute, warn, ban)', '¶Pourquoi la contester ?']],
      ['appel-ban', '🔓', 'Demande de débannissement', 'Demander une seconde chance.', 'unban', ['Ton pseudo au moment du ban', '¶Pourquoi as-tu été banni ?', '¶Pourquoi te débannir ?']],
      ['plainte-staff', '👮', 'Plainte contre un staff', 'Signaler un abus d\'un membre de l\'équipe.', 'plainte-staff', ['Pseudo du staff', '¶Que s\'est-il passé ?', 'Preuves ?']],
      ['raid', '🌪️', 'Raid ou spam', 'Le serveur est attaqué par des comptes.', 'raid', ['Dans quel salon ?', '¶Ce que tu as vu']],
      ['usurpation', '🎭', 'Usurpation d\'identité', 'Quelqu\'un se fait passer pour un autre.', 'usurpation', ['Pseudo du faux compte', 'Qui est imité ?', '¶Détails ?']],
      ['pub-mp', '📢', 'Pub en messages privés', 'Un membre t\'envoie de la pub en MP.', 'pub-mp', ['Pseudo ou ID', 'Capture du message ?']],
      ['litige', '🤝', 'Litige entre membres', 'Un désaccord à régler avec l\'aide du staff.', 'litige', ['Avec qui ?', '¶Explique le désaccord']],
      ['faille', '🕳️', 'Faille ou abus d\'un bug', 'Quelqu\'un exploite un bug du serveur ou d\'un jeu.', 'faille', ['¶Quel bug, et comment ?']],
    ]],
    ['Recrutement', '🧑‍💼', [
      ['candidature-staff', '🛡️', 'Candidature staff', 'Rejoindre l\'équipe du serveur.', 'candidature', ['Âge', 'Disponibilités par semaine', '¶Expérience de modération', '¶Pourquoi toi ?']],
      ['candidature-modo', '🔨', 'Candidature modérateur', 'Devenir modérateur.', 'modo', ['Âge', 'Disponibilités', '¶Comment gérerais-tu un conflit ?', '¶Expérience ?']],
      ['candidature-helper', '🙋', 'Candidature helper', 'Aider les nouveaux membres.', 'helper', ['Âge', 'Disponibilités', '¶Pourquoi veux-tu aider ?']],
      ['candidature-animateur', '🎉', 'Candidature animateur', 'Organiser des animations et événements.', 'animateur', ['Âge', '¶Quelles animations proposerais-tu ?', 'Disponibilités']],
      ['candidature-dev', '💻', 'Candidature développeur', 'Développer des bots, sites ou outils.', 'dev', ['Langages maîtrisés', 'Lien GitHub ou portfolio ?', '¶Projets réalisés']],
      ['candidature-graphiste', '🎨', 'Candidature graphiste', 'Logos, bannières, miniatures…', 'graphiste', ['Logiciels utilisés', 'Lien vers ton portfolio', '¶Ton expérience']],
      ['candidature-monteur', '🎬', 'Candidature monteur vidéo', 'Montage de vidéos et de clips.', 'monteur', ['Logiciels utilisés', 'Exemple de montage (lien)', 'Disponibilités']],
      ['candidature-cm', '📣', 'Candidature community manager', 'Gérer les réseaux et l\'image du serveur.', 'cm', ['Réseaux maîtrisés', '¶Ton expérience', '¶Une idée pour nous ?']],
      ['candidature-redacteur', '✍️', 'Candidature rédacteur', 'Écrire des annonces, articles ou guides.', 'redacteur', ['¶Ton expérience d\'écriture', 'Exemple de texte (lien) ?']],
      ['candidature-traducteur', '🌍', 'Candidature traducteur', 'Traduire le contenu du serveur.', 'traducteur', ['Langues parlées', 'Niveau dans chaque langue', '¶Expérience ?']],
      ['candidature-recruteur', '🧲', 'Candidature recruteur', 'Faire grandir la communauté.', 'recruteur', ['Âge', '¶Comment trouverais-tu de nouveaux membres ?']],
      ['candidature-testeur', '🧪', 'Candidature testeur bêta', 'Tester les nouveautés avant tout le monde.', 'testeur', ['Appareils disponibles', '¶Pourquoi veux-tu tester ?']],
      ['candidature-createur', '📹', 'Candidature créateur de contenu', 'Streamers, youtubeurs, tiktokeurs.', 'createur', ['Lien de ta chaîne', 'Nombre d\'abonnés', '¶Type de contenu']],
      ['candidature-partenariat', '🤝', 'Candidature chargé de partenariats', 'Trouver et gérer les partenaires.', 'charge-partenariat', ['Âge', '¶Expérience en partenariats ?']],
      ['benevole', '💛', 'Bénévolat', 'Donner un coup de main ponctuel.', 'benevole', ['¶Comment veux-tu aider ?', 'Disponibilités']],
    ]],
    ['Partenariats', '🤝', [
      ['partenariat', '🤝', 'Partenariat de serveur', 'Proposer un partenariat entre serveurs.', 'partenariat', ['Nom du serveur', 'Nombre de membres', 'Lien d\'invitation permanent', '¶Thème et présentation']],
      ['partenariat-createur', '⭐', 'Partenariat créateur', 'Collaboration avec un créateur de contenu.', 'partenariat-createur', ['Lien de ta chaîne', 'Abonnés', '¶Ce que tu proposes']],
      ['sponsoring', '💼', 'Sponsoring', 'Proposer un sponsor ou un financement.', 'sponsor', ['Entreprise ou marque', '¶Ta proposition', 'Contact professionnel ?']],
      ['collab-evenement', '🎪', 'Collaboration d\'événement', 'Organiser un événement ensemble.', 'collab', ['Nom de ta communauté', '¶Idée d\'événement', 'Date envisagée ?']],
      ['echange-pub', '🔁', 'Échange de publicité', 'Échange de pub entre communautés.', 'pub', ['Nom du serveur', 'Nombre de membres', 'Lien d\'invitation']],
      ['partenariat-marque', '🏷️', 'Partenariat de marque', 'Une marque souhaite travailler avec nous.', 'marque', ['Nom de la marque', 'Site web', '¶Ta proposition']],
      ['affiliation', '🔗', 'Demande d\'affiliation', 'Rejoindre notre réseau de serveurs.', 'affiliation', ['Nom du serveur', 'Lien d\'invitation', '¶Pourquoi nous rejoindre ?']],
      ['projet', '🚀', 'Proposition de projet', 'Présenter un projet à l\'équipe.', 'projet', ['Nom du projet', '¶Description', 'Lien ?']],
    ]],
    ['Boutique et commandes', '🛒', [
      ['commande', '🛍️', 'Passer une commande', 'Commander un produit ou un service.', 'commande', ['Produit ou service', 'Quantité ou options', '¶Précisions ?']],
      ['suivi-commande', '📦', 'Suivi de commande', 'Où en est ta commande ?', 'suivi', ['Numéro de commande', 'Date de la commande']],
      ['remboursement', '💸', 'Demande de remboursement', 'Être remboursé d\'un achat.', 'remboursement', ['Numéro de commande', '¶Pourquoi le remboursement ?']],
      ['paiement', '💳', 'Problème de paiement', 'Le paiement a échoué ou a été débité deux fois.', 'paiement', ['Moyen de paiement', 'Montant', '¶Que s\'est-il passé ?']],
      ['devis', '🧾', 'Demande de devis', 'Recevoir un prix pour un travail.', 'devis', ['Type de travail', '¶Description du besoin', 'Budget ?', 'Délai souhaité ?']],
      ['commission', '🖌️', 'Commande artistique', 'Commander un dessin, un logo, une musique…', 'commission', ['Type d\'œuvre', '¶Description détaillée', 'Budget', 'Délai ?']],
      ['grade-vip', '👑', 'Achat de grade ou VIP', 'Acheter un grade ou un avantage.', 'vip', ['Grade souhaité', 'Pseudo en jeu ?']],
      ['reclamation', '📮', 'Réclamation produit', 'Produit abîmé, incomplet ou non conforme.', 'reclamation', ['Numéro de commande', '¶Le problème', 'Photo (lien) ?']],
      ['sav', '🔧', 'Service après-vente', 'Aide après un achat.', 'sav', ['Produit concerné', '¶Ta demande']],
      ['facture', '📑', 'Demande de facture', 'Obtenir une facture.', 'facture', ['Numéro de commande', 'Nom ou entreprise à indiquer']],
      ['code-promo', '🏷️', 'Code promo', 'Un code ne fonctionne pas.', 'promo', ['Code utilisé', '¶Le message d\'erreur ?']],
      ['revendeur', '🏪', 'Devenir revendeur', 'Vendre nos produits.', 'revendeur', ['Nom de ta boutique', '¶Ta proposition']],
    ]],
    ['Jeux vidéo', '🎮', [
      ['rejoindre-equipe', '🛡️', 'Rejoindre l\'équipe ou le clan', 'Postuler pour entrer dans la team.', 'team', ['Pseudo en jeu', 'Rang ou niveau', 'Disponibilités', '¶Pourquoi nous ?']],
      ['esport', '🏆', 'Recrutement e-sport', 'Intégrer le roster compétitif.', 'esport', ['Jeu', 'Rang et rôle', 'Lien tracker ?', '¶Expérience compétitive']],
      ['tournoi', '🎯', 'Inscription à un tournoi', 'Inscrire ton équipe ou toi-même.', 'tournoi', ['Nom de l\'équipe', 'Pseudos des joueurs', 'Capitaine']],
      ['tricheur', '🕵️', 'Signaler un tricheur', 'Un joueur triche en jeu.', 'triche', ['Pseudo en jeu', 'Quand ?', 'Preuve vidéo (lien)']],
      ['serveur-jeu', '🧱', 'Problème sur le serveur de jeu', 'Lag, crash, connexion impossible…', 'serveur-jeu', ['Pseudo en jeu', '¶Le problème', 'Heure du problème ?']],
      ['whitelist', '📜', 'Demande de whitelist', 'Accéder au serveur de jeu privé.', 'whitelist', ['Pseudo en jeu exact', 'Âge', '¶Pourquoi nous rejoindre ?']],
      ['objets-perdus', '🎒', 'Objets perdus en jeu', 'Récupérer un objet perdu à cause d\'un bug.', 'objets', ['Pseudo en jeu', '¶Objets perdus', 'Comment ?']],
      ['unban-jeu', '🔓', 'Débannissement en jeu', 'Contester un ban sur le serveur de jeu.', 'unban-jeu', ['Pseudo en jeu', 'Raison du ban', '¶Ta défense']],
      ['match', '⚔️', 'Organiser un match', 'Proposer un match amical.', 'match', ['Équipe adverse', 'Jeu et mode', 'Date et heure']],
      ['scrim', '🧠', 'Demande de scrim', 'Entraînement contre une autre équipe.', 'scrim', ['Équipe', 'Niveau', 'Créneaux possibles']],
      ['coaching', '🎓', 'Coaching', 'Progresser avec un coach.', 'coaching', ['Jeu', 'Rang actuel', '¶Ce que tu veux améliorer']],
      ['bug-jeu', '🐛', 'Bug en jeu', 'Signaler un bug du jeu ou du serveur.', 'bug-jeu', ['Où se trouve le bug ?', '¶Comment le reproduire ?']],
      ['recompense-jeu', '🎁', 'Récompense non reçue', 'Tu n\'as pas reçu une récompense gagnée.', 'recompense', ['Pseudo en jeu', 'Récompense attendue', 'Pour quel événement ?']],
      ['role-jeu', '🕹️', 'Rôle de jeu', 'Obtenir le rôle d\'un jeu ou d\'un rang.', 'role-jeu', ['Jeu', 'Rang (capture si besoin)']],
    ]],
    ['Roleplay', '🎭', [
      ['candidature-rp', '📝', 'Candidature roleplay', 'Rejoindre le serveur RP (whitelist).', 'candidature-rp', ['Âge', 'Expérience RP', 'Nom du personnage', '¶Histoire du personnage']],
      ['personnage', '🧬', 'Création de personnage', 'Valider un nouveau personnage.', 'personnage', ['Nom et prénom', 'Âge du personnage', '¶Histoire', 'Métier envisagé ?']],
      ['plainte-rp', '🚓', 'Plainte RP (hors règles)', 'Freekill, metagaming, powergaming…', 'plainte-rp', ['Pseudo du joueur', 'Règle enfreinte', '¶Déroulé', 'Preuve vidéo ?']],
      ['metier-rp', '💼', 'Demande de métier ou faction', 'Rejoindre un métier, un gang ou une faction.', 'metier', ['Personnage', 'Métier ou faction', '¶Motivation RP']],
      ['mort-rp', '⚰️', 'Mort RP (dossier)', 'Déclarer la mort d\'un personnage.', 'mort-rp', ['Personnage', '¶Circonstances']],
      ['entreprise-rp', '🏢', 'Création d\'entreprise RP', 'Ouvrir une entreprise en jeu.', 'entreprise', ['Nom de l\'entreprise', 'Activité', '¶Projet']],
      ['remboursement-rp', '💰', 'Remboursement RP', 'Perte due à un bug ou une erreur.', 'rembourse-rp', ['Personnage', 'Montant ou objets', '¶Que s\'est-il passé ?']],
      ['sanction-rp', '⚖️', 'Contester une sanction RP', 'Faire appel d\'une sanction RP.', 'appel-rp', ['Sanction reçue', '¶Ta version des faits']],
    ]],
    ['Études et Académie', '🎓', [
      ['devoirs', '📚', 'Aide aux devoirs', 'Besoin d\'aide sur un exercice.', 'devoirs', ['Matière', 'Niveau (classe)', '¶L\'exercice']],
      ['question-cours', '🧑‍🏫', 'Question de cours', 'Une notion à éclaircir.', 'cours', ['Matière ou module', '¶Ta question']],
      ['correction', '✅', 'Correction d\'exercice', 'Faire vérifier ton travail.', 'correction', ['Matière', 'Lien vers ton travail', 'Points à vérifier ?']],
      ['tutorat', '🤓', 'Tutorat', 'Être suivi régulièrement.', 'tutorat', ['Matière', 'Niveau', 'Disponibilités']],
      ['ressources', '🗂️', 'Demande de ressources', 'Cours, fiches, liens utiles.', 'ressources', ['Sujet', '¶Ce que tu cherches']],
      ['orientation', '🧭', 'Orientation', 'Conseils sur les études et les métiers.', 'orientation', ['Niveau actuel', '¶Tes questions']],
      ['projet-groupe', '👥', 'Projet de groupe', 'Trouver des partenaires de projet.', 'projet-groupe', ['Matière', '¶Le projet', 'Échéance']],
      ['revision-ccna', '🌐', 'Révision CCNA / réseau', 'Préparer un examen réseau ou cybersécurité.', 'ccna', ['Module (ITN, SRWE, ENSA…)', 'Date de l\'examen', '¶Points difficiles']],
    ]],
    ['Événements', '🎉', [
      ['proposer-event', '💡', 'Proposer un événement', 'Une idée d\'animation pour le serveur.', 'idee-event', ['Nom de l\'événement', '¶Déroulement', 'Date idéale ?']],
      ['inscription-event', '🗓️', 'Inscription à un événement', 'S\'inscrire à un événement à venir.', 'inscription', ['Événement', 'Pseudo(s)']],
      ['giveaway-lot', '🎁', 'Réclamer un lot de giveaway', 'Tu as gagné : récupère ton lot.', 'lot', ['Giveaway gagné', 'Lien du message ?']],
      ['concours', '🏅', 'Participer à un concours', 'Envoyer ta participation.', 'concours', ['Concours', 'Lien vers ta création']],
      ['animation', '🎤', 'Demande d\'animation', 'Demander une animation pour un groupe.', 'animation', ['Type d\'animation', 'Date et heure', 'Nombre de participants']],
      ['probleme-event', '🧯', 'Problème pendant un événement', 'Un souci lors d\'un événement.', 'probleme-event', ['Événement', '¶Le problème']],
      ['soiree', '🌙', 'Soirée ou rencontre', 'Organiser une soirée jeux ou une rencontre.', 'soiree', ['Activité', 'Date', '¶Détails ?']],
      ['anniversaire', '🎂', 'Anniversaire', 'Faire souhaiter un anniversaire.', 'anniversaire', ['Qui ?', 'Date']],
    ]],
    ['Créateurs et contenu', '📸', [
      ['mise-en-avant', '🌟', 'Mise en avant', 'Faire partager ton contenu.', 'mise-en-avant', ['Lien du contenu', '¶Présentation']],
      ['verif-createur', '✔️', 'Vérification créateur', 'Obtenir le badge de créateur vérifié.', 'verif-createur', ['Lien de ta chaîne', 'Abonnés', 'Preuve que c\'est toi']],
      ['soumettre', '📤', 'Soumettre une création', 'Envoyer un dessin, une vidéo, un projet.', 'creation', ['Titre', 'Lien', '¶Description ?']],
      ['droits-auteur', '©️', 'Droits d\'auteur', 'Ton contenu a été repris sans accord.', 'droits', ['Contenu concerné', 'Où a-t-il été repris ?', 'Preuve que tu es l\'auteur']],
      ['role-createur', '🎥', 'Rôle créateur', 'Obtenir le rôle streamer, youtubeur…', 'role-createur', ['Plateforme', 'Lien de ta chaîne']],
      ['collab-video', '🎞️', 'Collaboration vidéo', 'Proposer une vidéo à plusieurs.', 'collab-video', ['Ta chaîne', '¶L\'idée']],
      ['interview', '🎙️', 'Demande d\'interview', 'Interviewer un membre de l\'équipe.', 'interview', ['Média', '¶Sujet de l\'interview']],
      ['feedback-contenu', '🗣️', 'Avis sur mon contenu', 'Recevoir des conseils.', 'feedback', ['Lien du contenu', '¶Ce sur quoi tu veux un avis']],
    ]],
    ['Communauté', '🏘️', [
      ['demande-role', '🎖️', 'Demande de rôle', 'Obtenir un rôle particulier.', 'role', ['Rôle souhaité', '¶Pourquoi ?']],
      ['pseudo', '📝', 'Changement de pseudo', 'Faire modifier ton pseudo sur le serveur.', 'pseudo', ['Nouveau pseudo']],
      ['nouveau-salon', '➕', 'Demande de salon', 'Proposer un nouveau salon.', 'salon', ['Nom du salon', '¶À quoi servirait-il ?']],
      ['suggestion', '💡', 'Suggestion', 'Une idée pour améliorer le serveur.', 'suggestion', ['Titre', '¶Ton idée']],
      ['vocal', '🎧', 'Problème en vocal', 'Un souci dans un salon vocal.', 'vocal', ['Salon vocal', '¶Le problème']],
      ['donnees', '🗑️', 'Mes données (RGPD)', 'Voir ou supprimer tes données.', 'donnees', ['Ce que tu demandes (voir / effacer)']],
      ['remerciement', '💐', 'Remerciements', 'Dire merci à l\'équipe ou à un membre.', 'merci', ['¶Ton message']],
      ['parler-admin', '👑', 'Parler à un administrateur', 'Une demande réservée aux admins.', 'admin', ['¶Ton message']],
      ['verification-age', '🪪', 'Vérification d\'âge', 'Accéder aux salons réservés aux majeurs.', 'age', ['Âge']],
      ['retour-membre', '👋', 'Retour sur le serveur', 'Tu reviens après une absence ou un départ.', 'retour', ['Ancien pseudo', '¶Message ?']],
    ]],
    ['Informatique et sécurité', '🖥️', [
      ['support-info', '🖥️', 'Support informatique', 'Aide sur un ordinateur ou un logiciel.', 'info', ['Système (Windows, macOS…)', '¶Le problème']],
      ['reseau', '📡', 'Réseau et Internet', 'Box, Wi-Fi, ports, IP…', 'reseau', ['Matériel', '¶Le problème']],
      ['dev-api', '🧩', 'Développement et API', 'Question de code ou d\'API.', 'dev', ['Langage', '¶Ton code ou ta question']],
      ['hebergement', '☁️', 'Hébergement', 'Serveur, VPS, site web.', 'hebergement', ['Service concerné', '¶Ta demande']],
      ['compte-pirate', '🔑', 'Compte piraté', 'Ton compte a été volé ou utilisé par quelqu\'un.', 'pirate', ['Compte concerné', '¶Que s\'est-il passé ?']],
      ['demande-acces', '🗝️', 'Demande d\'accès', 'Accès à un outil, un serveur ou un dépôt.', 'acces', ['Outil ou service', '¶Pourquoi ?']],
      ['vulnerabilite', '🐞', 'Signaler une faille de sécurité', 'Divulgation responsable d\'une vulnérabilité.', 'faille', ['Service touché', '¶Description', 'Gravité estimée ?']],
      ['integration-bot', '🔌', 'Ajouter un bot', 'Demander l\'ajout d\'un bot ou d\'une intégration.', 'bot', ['Nom du bot', 'Lien', '¶Utilité']],
    ]],
  ];

  // « Preuves ? », « Lien ? » : champ facultatif. Une vraie question (« Que s'est-il passé ? ») reste obligatoire.
  // « ?? » à la fin force le facultatif en gardant le point d'interrogation (« Depuis quand ?? »).
  const QUESTION = /^(que|qu'|quel|quelle|quels|quelles|pourquoi|comment|où|qui|quand|depuis|sur quoi|avec qui|dans quel|ce que|combien)/i;
  const questions = (liste) => liste.map((q) => {
    let label = q;
    const long = label.startsWith('¶');
    if (long) label = label.slice(1);
    let requis = true;
    if (label.endsWith('??')) { label = label.slice(0, -1); requis = false; } else if (label.endsWith(' ?') && !QUESTION.test(label)) { label = label.slice(0, -2); requis = false; }
    return { label: label.slice(0, 45), long, requis };
  });

  const MODELES = [];
  const CATEGORIES = [];
  for (const [cat, emoji, liste] of BRUT) {
    CATEGORIES.push({ nom: cat, emoji, nombre: liste.length });
    for (const [id, e, nom, desc, prefixe, qs] of liste) {
      MODELES.push({ id, cat, emoji: e, nom, desc, prefixe, questions: questions(qs), message: null });
    }
  }
  return { MODELES, CATEGORIES };
}));
