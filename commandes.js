// Généré automatiquement à partir du code du bot
window.CYBER_COMMANDES = [
 {
  "id": "utilitaires",
  "emoji": "🧰",
  "label": "Utilitaires",
  "commands": [
   {
    "name": "afk",
    "desc": "Indique que tu es absent (Cyber répond quand on te mentionne)",
    "subs": [],
    "staff": false
   },
   {
    "name": "aide",
    "desc": "Liste de toutes les commandes de Cyber",
    "subs": [],
    "staff": false
   },
   {
    "name": "avatar",
    "desc": "Affiche l'avatar d'un membre en grand",
    "subs": [],
    "staff": false
   },
   {
    "name": "banniere",
    "desc": "Affiche la bannière de profil d'un membre",
    "subs": [],
    "staff": false
   },
   {
    "name": "botinfo",
    "desc": "Informations sur le bot",
    "subs": [],
    "staff": false
   },
   {
    "name": "calcul",
    "desc": "Calculatrice (+ - * / ^ %, sqrt, sin, cos, log, pi…)",
    "subs": [],
    "staff": false
   },
   {
    "name": "emoji",
    "desc": "Agrandit un émoji personnalisé",
    "subs": [],
    "staff": false
   },
   {
    "name": "membres",
    "desc": "Statistiques des membres du serveur",
    "subs": [],
    "staff": false
   },
   {
    "name": "mesdonnees",
    "desc": "Voir ou effacer les données que Cyber garde sur toi",
    "subs": [
     {
      "name": "voir",
      "desc": "Reçois en privé une copie de tes données (fichier JSON)"
     },
     {
      "name": "effacer",
      "desc": "Efface tes données (niveaux, scores, AFK, rappels…) sur tous les serveurs"
     }
    ],
    "staff": false
   },
   {
    "name": "ping",
    "desc": "Latence du bot",
    "subs": [],
    "staff": false
   },
   {
    "name": "rappel",
    "desc": "Cyber te rappelle quelque chose plus tard (en MP)",
    "subs": [],
    "staff": false
   },
   {
    "name": "roleinfo",
    "desc": "Informations sur un rôle",
    "subs": [],
    "staff": false
   },
   {
    "name": "serveur",
    "desc": "Informations sur le serveur",
    "subs": [],
    "staff": false
   },
   {
    "name": "snipe",
    "desc": "Affiche le dernier message supprimé du salon",
    "subs": [],
    "staff": true
   },
   {
    "name": "sondage",
    "desc": "Crée un sondage avec réactions",
    "subs": [],
    "staff": false
   },
   {
    "name": "userinfo",
    "desc": "Informations détaillées sur un compte",
    "subs": [],
    "staff": false
   }
  ]
 },
 {
  "id": "academie",
  "emoji": "🎓",
  "label": "Académie",
  "commands": [
   {
    "name": "apprendre",
    "desc": "Fiche de cours réseau / cybersécurité (niveau CCNA)",
    "subs": [],
    "staff": false
   },
   {
    "name": "cisco",
    "desc": "Mémo des commandes Cisco IOS",
    "subs": [],
    "staff": false
   },
   {
    "name": "defi",
    "desc": "Défi du jour : un quiz réseau / cyber chaque jour, avec classement",
    "subs": [
     {
      "name": "activer",
      "desc": "Publier un quiz chaque jour (salon créé automatiquement si besoin)"
     },
     {
      "name": "desactiver",
      "desc": "Arrêter le défi du jour"
     },
     {
      "name": "maintenant",
      "desc": "Clôturer le quiz en cours et en publier un nouveau tout de suite"
     }
    ],
    "staff": true
   },
   {
    "name": "glossaire",
    "desc": "Définition détaillée d'un terme réseau / cybersécurité",
    "subs": [],
    "staff": false
   },
   {
    "name": "ia",
    "desc": "Pose une question d'informatique à l'IA de Cyber",
    "subs": [],
    "staff": false
   },
   {
    "name": "osi",
    "desc": "Le modèle OSI, couche par couche",
    "subs": [],
    "staff": false
   },
   {
    "name": "port",
    "desc": "Quel service utilise ce port ? (ou l'inverse)",
    "subs": [],
    "staff": false
   },
   {
    "name": "quiz",
    "desc": "Quiz réseau / cybersécurité niveau CCNA",
    "subs": [
     {
      "name": "jouer",
      "desc": "Une question au hasard, ou une série de 5 sur un sujet"
     },
     {
      "name": "classement",
      "desc": "Les meilleurs du serveur"
     },
     {
      "name": "stats",
      "desc": "Tes statistiques (ou celles d'un membre)"
     }
    ],
    "staff": false
   }
  ]
 },
 {
  "id": "reseau",
  "emoji": "🌐",
  "label": "Outils réseau",
  "commands": [
   {
    "name": "convertir",
    "desc": "Convertit un nombre (décimal, binaire, hexa, octal)",
    "subs": [],
    "staff": false
   },
   {
    "name": "dns",
    "desc": "Interroge le DNS d'un nom de domaine public",
    "subs": [],
    "staff": false
   },
   {
    "name": "pingip",
    "desc": "Ping une adresse IP publique ou un nom de domaine",
    "subs": [],
    "staff": false
   },
   {
    "name": "sousreseau",
    "desc": "Calculateur de sous-réseau IPv4",
    "subs": [],
    "staff": false
   }
  ]
 },
 {
  "id": "niveaux",
  "emoji": "📈",
  "label": "Niveaux",
  "commands": [
   {
    "name": "classement",
    "desc": "Top 10 des membres les plus actifs",
    "subs": [],
    "staff": false
   },
   {
    "name": "rang",
    "desc": "Ton niveau et ton XP",
    "subs": [],
    "staff": false
   },
   {
    "name": "recompense",
    "desc": "Rôles donnés automatiquement à un niveau",
    "subs": [
     {
      "name": "ajouter",
      "desc": "Donne un rôle quand on atteint un niveau"
     },
     {
      "name": "retirer",
      "desc": "Supprime la récompense d'un niveau"
     },
     {
      "name": "liste",
      "desc": "Liste des récompenses"
     }
    ],
    "staff": true
   },
   {
    "name": "xp",
    "desc": "Gérer l'XP des membres",
    "subs": [
     {
      "name": "ajouter",
      "desc": "Ajoute de l'XP"
     },
     {
      "name": "retirer",
      "desc": "Retire de l'XP"
     },
     {
      "name": "reset",
      "desc": "Remet l'XP d'un membre à zéro"
     }
    ],
    "staff": true
   }
  ]
 },
 {
  "id": "systemes",
  "emoji": "⚙️",
  "label": "Systèmes",
  "commands": [
   {
    "name": "automod",
    "desc": "Modération automatique",
    "subs": [
     {
      "name": "activer",
      "desc": "Active ou désactive l'automod"
     },
     {
      "name": "filtre",
      "desc": "Active ou désactive un filtre"
     },
     {
      "name": "mot",
      "desc": "Ajoute ou retire un mot interdit"
     },
     {
      "name": "autoriser",
      "desc": "Ajoute ou retire un mot toujours autorisé (même s'il est dans la bibliothèque)"
     },
     {
      "name": "exempter",
      "desc": "Ajoute ou retire un rôle ignoré par l'automod"
     },
     {
      "name": "sanction",
      "desc": "Nombre d'infractions avant un mute de 10 min"
     },
     {
      "name": "voir",
      "desc": "Affiche la configuration de l'automod"
     }
    ],
    "staff": true
   },
   {
    "name": "giveaway",
    "desc": "Concours avec tirage au sort",
    "subs": [
     {
      "name": "lancer",
      "desc": "Lance un giveaway"
     },
     {
      "name": "terminer",
      "desc": "Termine un giveaway maintenant"
     },
     {
      "name": "reroll",
      "desc": "Retire au sort de nouveaux gagnants"
     }
    ],
    "staff": true
   },
   {
    "name": "suggestion",
    "desc": "Propose une idée pour le serveur",
    "subs": [],
    "staff": false
   },
   {
    "name": "tag",
    "desc": "Réponses enregistrées (règles, liens, FAQ…)",
    "subs": [
     {
      "name": "voir",
      "desc": "Affiche un tag"
     },
     {
      "name": "creer",
      "desc": "Crée ou modifie un tag (staff)"
     },
     {
      "name": "supprimer",
      "desc": "Supprime un tag (staff)"
     },
     {
      "name": "liste",
      "desc": "Liste des tags"
     }
    ],
    "staff": false
   },
   {
    "name": "ticket",
    "desc": "Système de tickets de support",
    "subs": [
     {
      "name": "panel",
      "desc": "Publie le bouton « Ouvrir un ticket » (admin)"
     },
     {
      "name": "fermer",
      "desc": "Ferme le ticket actuel"
     },
     {
      "name": "ajouter",
      "desc": "Ajoute un membre au ticket"
     },
     {
      "name": "retirer",
      "desc": "Retire un membre du ticket"
     }
    ],
    "staff": false
   },
   {
    "name": "verification",
    "desc": "Panneau de vérification anti-bots (bouton qui donne un rôle)",
    "subs": [],
    "staff": true
   },
   {
    "name": "vocal",
    "desc": "Règle ton salon vocal temporaire",
    "subs": [
     {
      "name": "renommer",
      "desc": "Change le nom de ton vocal"
     },
     {
      "name": "limite",
      "desc": "Nombre maximum de personnes (0 = illimité)"
     },
     {
      "name": "statut",
      "desc": "Texte affiché sous le nom du salon"
     },
     {
      "name": "panneau",
      "desc": "Renvoie le panneau de contrôle dans le chat du vocal"
     }
    ],
    "staff": false
   }
  ]
 },
 {
  "id": "moderation",
  "emoji": "🛡️",
  "label": "Modération",
  "commands": [
   {
    "name": "ban",
    "desc": "Bannit un utilisateur",
    "subs": [],
    "staff": true
   },
   {
    "name": "clear",
    "desc": "Supprime des messages dans ce salon",
    "subs": [],
    "staff": true
   },
   {
    "name": "kick",
    "desc": "Expulse un membre",
    "subs": [],
    "staff": true
   },
   {
    "name": "mute",
    "desc": "Rend un membre muet temporairement (timeout)",
    "subs": [],
    "staff": true
   },
   {
    "name": "pseudo",
    "desc": "Change le pseudo d'un membre sur le serveur",
    "subs": [],
    "staff": true
   },
   {
    "name": "salon",
    "desc": "Gestion du salon actuel",
    "subs": [
     {
      "name": "verrouiller",
      "desc": "Empêche @everyone d'écrire"
     },
     {
      "name": "deverrouiller",
      "desc": "Autorise de nouveau @everyone à écrire"
     },
     {
      "name": "slowmode",
      "desc": "Mode lent"
     }
    ],
    "staff": true
   },
   {
    "name": "unban",
    "desc": "Débannit un utilisateur via son ID",
    "subs": [],
    "staff": true
   },
   {
    "name": "unmute",
    "desc": "Retire le mute d'un membre",
    "subs": [],
    "staff": true
   },
   {
    "name": "warn",
    "desc": "Gestion des avertissements",
    "subs": [
     {
      "name": "ajouter",
      "desc": "Avertit un membre"
     },
     {
      "name": "liste",
      "desc": "Liste les avertissements d'un membre"
     },
     {
      "name": "effacer",
      "desc": "Efface tous les avertissements d'un membre"
     }
    ],
    "staff": true
   }
  ]
 },
 {
  "id": "roles",
  "emoji": "🎭",
  "label": "Rôles",
  "commands": [
   {
    "name": "panelroles",
    "desc": "Crée un panneau où les membres choisissent leurs rôles avec des boutons",
    "subs": [],
    "staff": true
   },
   {
    "name": "role",
    "desc": "Donner ou retirer un rôle",
    "subs": [
     {
      "name": "donner",
      "desc": "Donne un rôle à un membre"
     },
     {
      "name": "retirer",
      "desc": "Retire un rôle à un membre"
     }
    ],
    "staff": true
   }
  ]
 },
 {
  "id": "fun",
  "emoji": "🎲",
  "label": "Fun",
  "commands": [
   {
    "name": "blague",
    "desc": "Une blague ou une devinette au hasard",
    "subs": [],
    "staff": false
   },
   {
    "name": "choisir",
    "desc": "Choisit au hasard parmi plusieurs options",
    "subs": [],
    "staff": false
   },
   {
    "name": "compatibilite",
    "desc": "Taux de compatibilité entre deux membres",
    "subs": [],
    "staff": false
   },
   {
    "name": "de",
    "desc": "Lance un ou plusieurs dés",
    "subs": [],
    "staff": false
   },
   {
    "name": "note",
    "desc": "Cyber note n'importe quoi sur 10",
    "subs": [],
    "staff": false
   },
   {
    "name": "pfc",
    "desc": "Pierre, feuille, ciseaux contre Cyber",
    "subs": [],
    "staff": false
   },
   {
    "name": "pileouface",
    "desc": "Lance une pièce",
    "subs": [],
    "staff": false
   }
  ]
 },
 {
  "id": "admin",
  "emoji": "🔧",
  "label": "Admin",
  "commands": [
   {
    "name": "config",
    "desc": "Configuration du bot sur ce serveur",
    "subs": [
     {
      "name": "bienvenue",
      "desc": "Salon et message de bienvenue"
     },
     {
      "name": "logs",
      "desc": "Salon des logs de modération"
     },
     {
      "name": "autorole",
      "desc": "Rôle donné automatiquement aux nouveaux"
     },
     {
      "name": "niveaux",
      "desc": "Système de niveaux / XP"
     },
     {
      "name": "vocal",
      "desc": "Salon vocal « Rejoindre pour créer » (salons temporaires)"
     },
     {
      "name": "suggestions",
      "desc": "Salon où arrivent les /suggestion"
     },
     {
      "name": "giveaways",
      "desc": "Combien de temps garder un giveaway terminé (pour /giveaway reroll)"
     },
     {
      "name": "voir",
      "desc": "Affiche la configuration actuelle"
     }
    ],
    "staff": true
   },
   {
    "name": "embed",
    "desc": "Crée un message embed personnalisé (annonce, règlement…)",
    "subs": [],
    "staff": true
   },
   {
    "name": "modules",
    "desc": "Activer ou désactiver les modules de Cyber sur ce serveur",
    "subs": [],
    "staff": true
   }
  ]
 }
];
