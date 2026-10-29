# Chapitre 11 · Problèmes rencontrés et leçons apprises

Le carnet de bord (chapitre 2) raconte les problèmes dans l'ordre où ils sont arrivés. Ce chapitre les regroupe par type pour en tirer des leçons.

## Problèmes techniques

| Problème | Cause | Solution | Leçon |
|---|---|---|---|
| Commande `/panelroles` refusée par Discord | Option obligatoire placée après une option facultative | Ordre corrigé, règle vérifiée par `check.js` | Automatiser les vérifications qu'on a déjà ratées une fois |
| Commandes visibles sur un seul serveur | Enregistrement sur un identifiant de serveur fixe | Enregistrement automatique sur tous les serveurs du bot | Ce qui marche en test ne passe pas forcément à l'échelle |
| Images du site absentes en ligne | Dossier `assets` jamais envoyé sur GitHub | `PUBLIER.bat` publie tout le dossier avec Git | Publier avec un outil, pas à la main |
| Nouveau HTML avec l'ancien CSS | Cache du navigateur | Versions « anti-cache » ajoutées automatiquement | Penser au cache dès qu'une mise à jour « ne marche pas » |
| `redirect_uri` OAuth2 non valide | `index.html` dans l'adresse et « Cyber » contre « cyber » | Adresse normalisée | Une URL de redirection doit correspondre au caractère près |
| Page anglaise sans tous les onglets | Menu de la version anglaise écrit à part | Menu aligné sur la version française | Une traduction se vérifie page par page |
| Changements bloqués pendant des heures | PC éteint ou en veille, donc rien à installer | Paquets prêts et testés à l'avance, PR pour le site | Préparer pendant l'absence, installer en une fois au retour |
| Dossier du site en retard sur GitHub | Des PR fusionnées en ligne pendant que le PC était éteint | `SYNCHRONISER-SITE.bat` (met de côté puis aligne sur GitHub) | Deux façons de publier = penser à se resynchroniser |
| Chaque commande répondait deux fois | Plusieurs copies du bot tournaient (PC + hébergeur, ou anciennes fenêtres) | Instance unique par port local, fermeture des anciennes copies au démarrage | Un service doit savoir qu'il est seul |
| Panel injoignable chez l'hébergeur | Nom passant par Cloudflare, puis **aucun port entrant** sur la machine | Tunnel Cloudflare sortant | Une connexion sortante passe là où l'entrante est bloquée |
| Mélange HTTPS / HTTP | Site en HTTPS, panel en HTTP | Domaine + tunnel = panel en HTTPS | Le navigateur bloque le « contenu mixte » |
| Erreur DNS sur le sous-domaine | Route pas encore créée, domaine en attente, cache DNS de Windows | Créer la route, attendre l'activation, `ipconfig /flushdns` | La propagation DNS et les caches font perdre du temps : vérifier dans l'ordre |
| Erreur 1033 | Aucun `cloudflared` connecté (serveur supprimé ou bot éteint) | Relancer le tunnel depuis une machine allumée | Lire le code d'erreur avant de paniquer |
| Tunnel bloqué au démarrage | Empreinte SHA-256 de la version Linux utilisée sur Windows | Empreinte de la bonne version | La vérification d'intégrité fonctionne, et elle dépend de l'OS |
| « Bad gateway » | Ancien port + `localhost` traduit en IPv6 `::1` | `http://127.0.0.1:3000` | Toujours préciser IPv4 quand le service n'écoute qu'en IPv4 |
| Données perdues | Serveur supprimé, aucune sauvegarde | Sauvegardes quotidiennes, copie dans un salon Discord privé, `RESTAURER.bat` | Une donnée qui n'existe qu'à un endroit n'existe pas |
| Sauvegarde jamais envoyée | Envoi seulement à la création, avant que le salon soit configuré | Renvoi tant que la sauvegarde n'est pas arrivée | Tester le cas « configuré après coup » |
| Bannière rose en petite vue | Image générée semi-transparente | Version opaque, texte dans la zone sûre | Vérifier les images dans tous les affichages |
| Quotas des IA d'images | Limites gratuites quotidiennes | Production étalée dans le temps | Planifier avec les contraintes de ses outils |
| Python absent du PC | Script de build en Python | Build reproduit à la main, puis installation conseillée | Lister les prérequis d'un projet |

## Problèmes humains et d'organisation

Ce projet a aussi été une découverte : je ne code pas, et j'ai dû apprendre à piloter un projet technique, comprendre ce qu'on me proposait et faire moi-même toute la configuration (Discord, GitHub, OVH, Cloudflare, hébergeur).

| Situation | Ce qui s'est passé | Ce que j'en retiens |
|---|---|---|
| Images et IA | Je demandais un logo à une IA qui ne génère pas d'images | Lui faire écrire un prompt pour une IA d'images : chaque outil a sa spécialité |
| Token collé dans la conversation | « Personne n'aura la conversation », donc je ne l'ai pas changé | Un secret qui a circulé est compromis : tout a été régénéré le 28 octobre |
| Idée reçue sur GitHub | Je pensais héberger le bot sur GitHub comme mon portfolio | GitHub Pages ne sert que des pages statiques : le bot a besoin d'une machine allumée |
| Conversation trop longue | Je voulais l'exporter pour aller plus vite | Un résumé à jour (`CONTEXTE-CLAUDE.md`) vaut mieux que tout l'historique |
| Plusieurs chantiers sur les mêmes fichiers | Automod, version bilingue et audit prêts en même temps pour le même bot | Un ordre d'installation clair, une sauvegarde et une comparaison à chaque étape |
| Un fil pour chaque chose | La demande « bot bilingue » a hésité entre deux fils | Une règle de routage écrite et appliquée sans exception |
| Peur de la facture | « Je ne veux pas dépenser mes tokens » pour une IA dans l'automod | Toujours demander le coût réel et commencer par la solution gratuite |
| Copier un jeu connu | Je voulais le jeu du dino de Google aux couleurs de Cyber | On ne copie pas une création protégée : un jeu original fait aussi bien l'affaire |
| Vocabulaire nouveau | Token du bot ou jeton GitHub ? PR, merge, branche, ruleset, CNAME, TOTP… | Demander sans gêne « c'est quoi ? » : chaque réponse m'a fait progresser |
| Où mettre les secrets | J'ai demandé où mettre le token sur GitHub | Un secret ne va **jamais** dans un dépôt, même privé |
| Trop de validations | Me demander « ok » à chaque étape ralentissait tout | Fixer une règle claire : réversible = on fait, irréversible = on me demande |
| Interfaces qui changent | Menus Cloudflare réorganisés, onglets introuvables | Une capture d'écran vaut mieux qu'une longue description |
| Outil de connexion au PC | Je ne trouvais pas « Remote Control » | Donner un accès simple et ciblé (un seul dossier, `Cyber`) |
| Malentendu | « J'ai rien changé, tu racontes quoi ? » | Vérifier l'état réel avant d'affirmer qu'une étape est faite, et le dire franchement en cas d'erreur |
| Informations à corriger | Prix des mini PC d'abord sous-estimés, besoin réel (Pi pour mon père, 8 Go pour moi) précisé en cours de route | Donner tout le contexte dès le début, et accepter qu'un conseil soit corrigé |
| Budget étudiant | Le neuf est trop cher | Le reconditionné et l'occasion offrent un excellent rapport qualité-prix, avec les bonnes questions à poser au vendeur |
| Hébergeur gratuit | Serveur supprimé sans explication, attente d'une réponse du support | Ne pas dépendre d'un service gratuit pour quelque chose d'important : prévoir un plan B |
| Garder le fil | Beaucoup de sujets en parallèle (panel, site, audit, visuels, matériel) | Un fil par sujet, un fil unique pour les audits, et un fichier de contexte toujours à jour |
| Journée très longue | Plus de 15 heures de travail le 28 octobre | Découper en lots et noter où on s'arrête (ex. « reprise au prompt 19 ») |

## Ce que je referais pareil

- Tester chaque version sur mes propres serveurs avant d'aller plus loin.
- Faire un audit de sécurité **avant** chaque étape importante (hébergement, mise en ligne, vérification).
- Garder une sauvegarde de chaque fichier modifié.
- Ne jamais montrer un secret, même dans une capture (je masquais les valeurs avant d'envoyer).

## Ce que je ferais différemment

- Mettre en place les **sauvegardes dès le premier jour** d'hébergement.
- Choisir un hébergement dont je comprends les règles (ports, tunnels autorisés) avant d'y installer quoi que ce soit.
- Installer les prérequis (Python, Git) au début du projet.
- Prévoir dès le départ un document de suivi comme celui-ci, plutôt que de le reconstituer après.
