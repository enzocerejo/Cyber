# Chapitre 4 · Le bot et ses commandes

## Évolution version par version

| Version | Date (2026) | Contenu principal |
|---|---|---|
| v1.0 | 25 octobre | 20 premières commandes : modération, informations, rôles, sondages, embeds. Bienvenue, rôle automatique, salon de logs. `/pingip` refuse les adresses privées. |
| v1.1 | 25 octobre | « De quoi remplacer tous les autres bots » : niveaux et XP, automod, tickets, giveaways, vérification anti-raid, suggestions, tags, vocaux temporaires, `/rappel`, `/afk`, `/snipe`, outils réseau, menu `/aide`. |
| v1.2 | 26 octobre | Tableau de bord façon MEE6 avec connexion Discord, nouveau logo, `/userinfo` complet, `/blague`, lancement du site. |
| v1.3 | 26 octobre | Les deux **modules** (Communauté, Académie) ; 47 fiches CCNA, `/quiz`, `/glossaire`, défi du jour, `/ia`. |
| v1.4 | 26 octobre | Choix des modules à l'arrivée sur un serveur, aperçus fidèles à Discord dans le panel, simulateur d'automod, serveur de support. |
| v1.5 | 26 octobre | Académie enrichie : 498 questions, séries de 5 par sujet, fiches réécrites, 92 termes de glossaire ; correction des réponses en double. |
| v1.6 | 27-28 octobre | Hébergement via GitHub privé, audit de sécurité, `/mesdonnees`, effacement automatique 30 jours après le retrait, sauvegardes quotidiennes, pages légales. |
| v1.7 | 28 octobre | Panel refait (brouillon + Réinitialiser, onglets Sécurité et Modules publics), bibliothèque automod, 123 modèles de tickets, vocaux « Join to Create », défi du jour privé avec classement, messages en **Components V2**. |
| v1.7+ | 29 octobre (nuit) | Vérification avec rôles « Non vérifié » / « Membre » donnés et retirés automatiquement, éditeur de règlement avec 17 modèles dans le panel. |
| v1.8 | 29 octobre | **Bot bilingue français / anglais** (`/langue`, `/config langue`, 860 textes traduits, noms anglais des commandes), automod qui démasque les lettres déguisées, **panel ouvert à tous**, stockage **SQLite**, page d'attente avec mini-jeu. |
| v1.9 | 30 octobre | **Noms de commandes en anglais pour tous** (`/help`, `/learn`…), **langue par salon** (français, anglais ou les deux), Académie devenue **module optionnel** (Communauté + Sécurité d'office), Modules publics avec notes et recherche, sous-rubriques dans le menu du panel, boosts dans l'aperçu, règlement avancé façon Discohook. |

## Les modules

Depuis la v1.9, **Communauté + Sécurité** est la base, active dès l'arrivée. Les autres modules s'installent depuis l'onglet **Modules publics** du panel.

**Communauté + Sécurité** : modération, automod, niveaux et XP, tickets, giveaways, vérification anti-raid, suggestions, tags, rôles à boutons, vocaux temporaires, fun et utilitaires.

**Académie**, module optionnel fait par passion (niveau CCNA, cursus ITN / SRWE / ENSA) :

- `/apprendre` : 47 fiches de cours détaillées, avec exemples et commandes Cisco ;
- `/quiz` : 498 questions, séries de 5 par sujet, points, séries de victoires et classement ;
- `/defi` : un quiz chaque jour dans un salon dédié, joué en privé, avec un classement publié tous les jours ;
- `/glossaire` (92 termes), `/osi`, `/port`, `/cisco` ;
- `/ia` : questions d'informatique à l'IA d'Anthropic, limitée à 5 par heure et par membre et 50 par jour et par serveur ;
- outils réseau : `/sousreseau`, `/dns`, `/convertir`, `/pingip`.

Jusqu'à la v1.8, Cyber demandait à l'arrivée de choisir Communauté, Académie ou les deux (image ci-dessous). Depuis la v1.9, ce choix a disparu : Communauté + Sécurité est actif tout de suite, et le message d'accueil donne seulement les liens du tableau de bord, du site et du support.

![Ancien choix des modules dans le panel (jusqu'à la v1.8)](images/panel-premiere-config.jpg)

## Cyber parle français et anglais (v1.8)

Demande du 29 octobre : « que les utilisateurs choisissent la langue du bot, dans toutes les commandes, et n'oublie pas d'actualiser les prochaines commandes en anglais / français ».

- **Langue du serveur** : `/config langue` ou l'onglet Général du panel. Elle sert aux messages publics (bienvenue, logs, tickets…).
- **Langue de chaque membre** : `/langue`. Les réponses, boutons et formulaires qu'il reçoit suivent son choix.
- **Noms anglais dans le menu « / »** quand Discord est en anglais (`/help`, `/learn`…).
- **Fonctionnement** : un dossier `src/i18n/` associe chaque texte français à sa traduction (860 textes). La traduction se fait au moment de l'envoi, juste avant la conversion en Components V2. Le code des commandes n'a donc presque pas changé.
- **Règle pour la suite** : toute nouvelle commande doit être traduite, et `check.js` bloque la livraison s'il manque un nom ou une description en anglais.
- Les cours de l'Académie restent en français pour l'instant.

**Depuis la v1.9 (30 octobre)** :

- **Les commandes s'appellent en anglais pour tout le monde** (`/help`, `/learn`, `/config language`…), avec leur description en français si Discord est en français. C'est plus standard, et un même nom marche partout. Le code, lui, garde les noms français : le bot les renomme à la réception.
- **Langue par salon** : un serveur peut être en français, en anglais, ou **les deux** ; dans ce dernier cas, l'admin choisit les salons ou catégories où Cyber écrit en anglais (`/config language` ou panel). Le choix personnel `/language` d'un membre reste prioritaire.

## Fonctionnement interne

- **Une commande = un fichier** dans `src/commands/<catégorie>/`. Chaque fichier exporte sa définition (`data`), son exécution (`execute`) et, si besoin, la gestion de ses boutons et de son autocomplétion.
- **Routage des boutons** par préfixe : un bouton dont l'identifiant commence par `ticket:` est envoyé au fichier de la commande `/ticket`.
- **Planificateur** (`scheduler.js`) : rappels, fin des giveaways, défi du jour, sauvegardes. Un verrou empêche deux exécutions simultanées.
- **Components V2** : depuis la v1.7, un module convertit automatiquement chaque embed envoyé en conteneur Components V2, le format le plus récent de Discord, avec un repli en embed classique si le message est trop long.
- **Stockage SQLite** (depuis le 29 octobre) : les données passent de fichiers JSON réécrits en entier toutes les 2 secondes à une base `cyber.db` qui ne modifie que les lignes changées. Elle utilise le SQLite intégré à Node.js (aucun module à télécharger), importe toute seule les anciens JSON au premier démarrage et retombe sur l'ancien stockage si Node.js est trop ancien.
- **Vérification automatique** : `node src/check.js` contrôle toutes les commandes (noms, options, limites de Discord) avant chaque livraison.

## Statut et bio automatiques

- **Statut fixe** « 🌐 cyberbot.fr · /help », réappliqué toutes les 10 minutes et après chaque reconnexion (il remplace une rotation de 5 statuts).
- **Bio « À propos de moi » vivante** : toutes les 30 minutes, si les chiffres ont changé, le bot met à jour sa propre description avec le nombre de serveurs, de membres et de commandes (400 caractères maximum).

![Profil Discord du bot (illustration)](images/profil-discord.jpg)

## Liste complète des 61 commandes

Noms en anglais depuis la v1.9 (le nom français d'origine reste dans le code).


### 🧰 Utilitaires (17)

| Commande | Description | Réservée au staff |
|---|---|---|
| `/afk` | Indique que tu es absent (Cyber répond quand on te mentionne) |  |
| `/help` | Liste de toutes les commandes de Cyber |  |
| `/avatar` | Affiche l'avatar d'un membre en grand |  |
| `/banner` | Affiche la bannière de profil d'un membre |  |
| `/botinfo` | Informations sur le bot |  |
| `/calc` | Calculatrice (+ - * / ^ %, sqrt, sin, cos, log, pi…) |  |
| `/emoji` | Agrandit un émoji personnalisé |  |
| `/language` | Choisis la langue dans laquelle Cyber te répond |  |
| `/members` | Statistiques des membres du serveur |  |
| `/mydata` (voir, effacer) | Voir ou effacer les données que Cyber garde sur toi |  |
| `/ping` | Latence du bot |  |
| `/remind` | Cyber te rappelle quelque chose plus tard (en MP) |  |
| `/roleinfo` | Informations sur un rôle |  |
| `/server` | Informations sur le serveur |  |
| `/snipe` | Affiche le dernier message supprimé du salon | oui |
| `/poll` | Crée un sondage avec réactions |  |
| `/userinfo` | Informations détaillées sur un compte |  |

### 🎓 Académie (8)

| Commande | Description | Réservée au staff |
|---|---|---|
| `/learn` | Fiche de cours réseau / cybersécurité (niveau CCNA) |  |
| `/cisco` | Mémo des commandes Cisco IOS |  |
| `/challenge` (activer, desactiver, maintenant) | Défi du jour : un quiz réseau / cyber chaque jour, avec classement | oui |
| `/glossary` | Définition détaillée d'un terme réseau / cybersécurité |  |
| `/ai` | Pose une question d'informatique à l'IA de Cyber |  |
| `/osi` | Le modèle OSI, couche par couche |  |
| `/port` | Quel service utilise ce port ? (ou l'inverse) |  |
| `/quiz` (jouer, classement, stats) | Quiz réseau / cybersécurité niveau CCNA |  |

### 🌐 Outils réseau (4)

| Commande | Description | Réservée au staff |
|---|---|---|
| `/convert` | Convertit un nombre (décimal, binaire, hexa, octal) |  |
| `/dns` | Interroge le DNS d'un nom de domaine public |  |
| `/pingip` | Ping une adresse IP publique ou un nom de domaine |  |
| `/subnet` | Calculateur de sous-réseau IPv4 |  |

### 📈 Niveaux (4)

| Commande | Description | Réservée au staff |
|---|---|---|
| `/leaderboard` | Top 10 des membres les plus actifs |  |
| `/rank` | Ton niveau et ton XP |  |
| `/reward` (ajouter, retirer, liste) | Rôles donnés automatiquement à un niveau | oui |
| `/xp` (ajouter, retirer, reset) | Gérer l'XP des membres | oui |

### ⚙️ Systèmes (7)

| Commande | Description | Réservée au staff |
|---|---|---|
| `/automod` (activer, filtre, mot, autoriser, exempter, sanction, voir) | Modération automatique | oui |
| `/giveaway` (lancer, terminer, reroll) | Concours avec tirage au sort | oui |
| `/suggest` | Propose une idée pour le serveur |  |
| `/tag` (voir, creer, supprimer, liste) | Réponses enregistrées (règles, liens, FAQ…) |  |
| `/ticket` (panel, fermer, ajouter, retirer) | Système de tickets de support |  |
| `/verification` | Panneau de vérification anti-bots (bouton qui donne un rôle) | oui |
| `/voice` (renommer, limite, statut, panneau) | Règle ton salon vocal temporaire |  |

### 🛡️ Modération (9)

| Commande | Description | Réservée au staff |
|---|---|---|
| `/ban` | Bannit un utilisateur | oui |
| `/clear` | Supprime des messages dans ce salon | oui |
| `/kick` | Expulse un membre | oui |
| `/mute` | Rend un membre muet temporairement (timeout) | oui |
| `/nickname` | Change le pseudo d'un membre sur le serveur | oui |
| `/channel` (verrouiller, deverrouiller, slowmode) | Gestion du salon actuel | oui |
| `/unban` | Débannit un utilisateur via son ID | oui |
| `/unmute` | Retire le mute d'un membre | oui |
| `/warn` (ajouter, liste, effacer) | Gestion des avertissements | oui |

### 🎭 Rôles (2)

| Commande | Description | Réservée au staff |
|---|---|---|
| `/rolepanel` | Crée un panneau où les membres choisissent leurs rôles avec des boutons | oui |
| `/role` (donner, retirer) | Donner ou retirer un rôle | oui |

### 🎲 Fun (7)

| Commande | Description | Réservée au staff |
|---|---|---|
| `/joke` | Une blague ou une devinette au hasard |  |
| `/choose` | Choisit au hasard parmi plusieurs options |  |
| `/compatibility` | Taux de compatibilité entre deux membres |  |
| `/dice` | Lance un ou plusieurs dés |  |
| `/rate` | Cyber note n'importe quoi sur 10 |  |
| `/rps` | Pierre, feuille, ciseaux contre Cyber |  |
| `/coinflip` | Lance une pièce |  |

### 🔧 Admin (3)

| Commande | Description | Réservée au staff |
|---|---|---|
| `/config` (bienvenue, logs, autorole, niveaux, vocal, suggestions, giveaways, langue, voir) | Configuration du bot sur ce serveur | oui |
| `/embed` | Crée un message embed personnalisé (annonce, règlement…) | oui |
| `/modules` | Activer ou désactiver les modules de Cyber sur ce serveur | oui |
