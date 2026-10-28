# Chapitre 2 · Carnet de bord

Ce chapitre est le compte rendu chronologique du projet : ce qui a été fait, **les problèmes rencontrés** (techniques comme humains), comment ils ont été résolus et ce que j'en ai retenu. Les heures sont en heure de Paris.

> Légende : 🛠️ réalisation · ⚠️ problème · 💡 solution ou décision · 🧠 ce que j'ai appris

![Chronologie du projet](images/chronologie.jpg)

---

## Jours 1 et 2 · 25 et 26 octobre : naissance de Cyber

Le bot est né dans une première conversation avec Claude, intitulée « Bot Discord personnalisé ». En deux jours, il passe de la v1.0 à la v1.5 :

- 🛠️ **v1.0** : 20 commandes (modération, informations, rôles, sondages, embeds), bienvenue, rôle automatique, salon de logs. Dès le début, `/pingip` refuse les adresses privées pour ne pas pouvoir scanner mon propre réseau.
- 🛠️ **v1.1** : l'objectif « remplacer tous les autres bots » prend forme avec les niveaux, l'automod, les tickets, les giveaways, la vérification, les vocaux temporaires et les outils réseau.
- 🛠️ **v1.2** : le tableau de bord avec connexion Discord, le logo, et le site vitrine sur GitHub Pages.
- 🛠️ **v1.3 à v1.5** : les modules Communauté et Académie, puis une Académie beaucoup plus riche (47 fiches, 498 questions, 92 termes de glossaire).
- ⚠️ **Réponses en double** : certaines commandes répondaient deux fois. 💡 Plusieurs copies du bot tournaient en même temps sans que je le voie. Le bot réserve maintenant un port local (instance unique) et `DEMARRER.bat` ferme les anciennes copies.
- 🛠️ Pour ne rien perdre d'une conversation à l'autre, un fichier **`CONTEXTE-CLAUDE.md`** résume tout le projet (règles, structure, recettes). Il suffit de le faire lire au début d'une nouvelle session.

🧠 Un bon fichier de contexte vaut de l'or : sans lui, il faudrait tout réexpliquer à chaque fois.

---

## Nuit du 26 au 27 octobre : premier hébergement et premier audit

**23 h 59** · Je reprends le projet avec le fichier de contexte. Le bot est en v1.5 (58 commandes) et tourne seulement quand mon PC est allumé.

**00 h 04** · 💡 Idée : utiliser **Teoheberg**, un hébergeur gratuit, pour que le bot tourne en continu et que je puisse configurer le panel avec de vraies données. J'envoie des captures des onglets Startup et Network.

**00 h 14** · 🛠️ Le bot est adapté (port de l'hébergeur, enregistrement des commandes au démarrage, script `PREPARER-TEOHEBERG.bat` qui crée un zip sans secret) avec un guide pas à pas.

**00 h 42** · ✅ « Ça a l'air de marcher tranquille. » Mais j'ai plein de questions : mon `DEMARRER.bat` sert encore à quelque chose ? Comment tu mets à jour les fichiers là-bas ? Je peux héberger le site aussi ?
💡 Réponses : `DEMARRER.bat` sert aux tests sur le PC (en éteignant l'hébergeur avant), le site reste sur GitHub Pages (gratuit, HTTPS), et pour les mises à jour, mieux vaut un **dépôt GitHub privé**.

**00 h 51** · 🛠️ Je choisis la méthode GitHub privé et je demande en même temps un audit de sécurité complet. Résultat : 4 vulnérabilités npm corrigées et **12 failles** dans le code, dont une grave : un simple membre pouvait devenir administrateur via un rôle mal configuré (détails au chapitre 8).

**01 h 23** · ⚠️ *Problème humain* : « Je mets où le token du bot sur GitHub ? »
💡 **Nulle part !** J'avais confondu deux choses : le **token du bot** (secret, seulement dans le `.env`) et le **jeton GitHub** (qui permet à l'hébergeur de lire le dépôt privé).
🧠 Il y a plusieurs « tokens » dans un projet et chacun a un rôle et un niveau de risque différent.

**01 h 24** · ⚠️ Après le premier clone sur l'hébergeur : « J'ai que ça, je fais quoi ? » 💡 C'est normal, le `.env` n'est volontairement pas sur GitHub : il faut le créer à la main sur le serveur.

**01 h 32** · ✅ Tout marche. Je veux relier le panel au site. ⚠️ Le site est en HTTPS et l'hébergeur en HTTP : les navigateurs bloquent ce mélange.

**01 h 36** · ⚠️ Le panel ne s'ouvre pas du tout (`ERR_CONNECTION_TIMED_OUT`). 💡 Diagnostic : le nom de l'hébergeur passe par Cloudflare, qui ne laisse pas passer ce port. J'ouvre un ticket au support avec un message préparé.

---

## Mardi 28 octobre : la grosse journée

### Matin : le tunnel et le nom de domaine

**08 h 53** · ⚠️ Réponse du support : **la machine n'a aucun port entrant ouvert**. Le panel ne sera jamais joignable directement.
💡 Trois options : se passer du panel en ligne, passer à une offre payante, ou créer un **tunnel Cloudflare** (c'est le serveur qui appelle Cloudflare). Je choisis le tunnel.

**09 h 05** · Je demande si c'est sécurisé, puis si les **injections SQL** sont possibles sur le login du panel. 💡 Le tunnel est chiffré mais rend le panel public, donc il faut le protéger. Et pas d'injection SQL possible : il n'y a ni base SQL ni mot de passe.
🧠 Une faille dépend de la technologie : sans SQL, pas d'injection SQL, mais il reste le XSS, le CSRF, le vol de session…

**10 h 17** · Choix du nom de domaine. `cyber.com` est hors de portée. 💡 **cyberbot.fr** chez OVH, environ 6 €.

**10 h 38** · ⚠️ Piège évité : le **DNSSEC** activé par défaut aurait coupé le domaine au moment de passer chez Cloudflare. Je le retire avant de payer.

**10 h 47** · ✅ `cyberbot.fr` est à moi.

**10 h 52 → 11 h 03** · ⚠️ *Problème d'interface* : Cloudflare a réorganisé ses menus. Je me retrouve dans « Register domain » (acheter) au lieu d'« Onboard a domain » (ajouter), puis « Networks » n'est plus à l'endroit prévu. 💡 La recherche rapide (Ctrl + K) règle le problème. Au passage, j'ajoute SPF et DMARC contre l'usurpation de mail, et je change les serveurs DNS chez OVH.

**11 h 06** · ⚠️ Zero Trust demande une carte bancaire même pour l'offre gratuite. 💡 Rien n'est débité tant qu'on reste sur Free.

**11 h 15** · 🛠️ Tunnel créé. Je copie le token **sans jamais l'envoyer** dans la conversation.

**11 h 20** · ⚠️ « Je ne peux pas faire Next s'il n'est pas connecté… » 💡 On inverse l'ordre : d'abord le `.env` et le redémarrage, ensuite la route.

**11 h 22** · ✅ `cloudflared` tourne sur l'hébergeur, le tunnel est connecté.

**11 h 27** · ⚠️ Erreur DNS sur `panel.cyberbot.fr`. 💡 Deux causes : la route n'était pas encore ajoutée, et le domaine était encore « en attente » chez Cloudflare. Puis `ipconfig /flushdns` sur le PC, parce que Windows avait gardé en mémoire le « n'existe pas ».

**12 h 08** · ✅ Le domaine est actif.

### Midi : l'incident

**12 h 19** · ⚠️ Erreur **1033** : Cloudflare ne trouve plus aucun connecteur.

**12 h 21** · Le tunnel est « Down ».

**12 h 23** · ⚠️⚠️ « **Je n'ai plus de serveur ?** » Le serveur a été **supprimé** par l'hébergeur. Il n'apparaît plus nulle part. Les données (`data/` : niveaux, réglages) sont perdues, sauf une copie plus ancienne sur mon PC.
💡 Pas de panique : je ne recrée rien avant de connaître la raison, j'ouvre un ticket (rédigé pour l'occasion, en étant transparent sur le tunnel), et je relance le bot sur mon PC avec `DEMARRER.bat`.
🧠 Un hébergeur gratuit peut disparaître du jour au lendemain. **Sans sauvegarde, on perd tout.** C'est ce qui a déclenché les sauvegardes automatiques l'après-midi même.

**12 h 33** · Plutôt que d'attendre, on avance sur deux chantiers en parallèle : passer le site sur cyberbot.fr, et refaire l'interface du panel.

![Erreur 1033 (illustration)](images/erreur-1033.jpg)

### Début d'après-midi : le site sur cyberbot.fr et le nouveau panel

**13 h 38** · 🛠️ Quatre enregistrements A vers GitHub Pages et un CNAME `www`, tous en « DNS only ». Vérification du domaine dans GitHub avec un enregistrement TXT.

**13 h 44** · ✅ « DNS check successful ». GitHub prépare le certificat HTTPS tout seul.

**13 h 47 → 14 h 04** · ⚠️ *Problème d'outil* : Claude n'arrive pas à se connecter à mon PC pour modifier les fichiers. Je ne sais pas où se trouve « Remote Control ». 💡 Finalement, je donne l'accès au dossier `Cyber` qui regroupe le bot et le site.

**13 h 55** · Question bonus : « l'interface paraît plus zoomée ». 💡 Normal : le navigateur retient un zoom par adresse, et cyberbot.fr repart à 100 %.

**14 h 07** · 🛠️ Fichier CNAME, liens mis à jour partout, `PUBLIER.bat` qui récupère d'abord les changements faits en ligne. Python n'étant pas installé sur mon PC, le build est reproduit à la main.

**14 h 20** · ✅ **Le site est en ligne sur https://cyberbot.fr.**

**12 h 33 → 15 h 53** · Refonte du panel : trois styles proposés, je choisis **« Console cyber »**. Les changements arrivent dans une **pull request**.
⚠️ *Problème humain* : on me demande « ok » à chaque étape et ça ralentit tout. 💡 Je réponds « pas besoin de ok » : désormais, les étapes réversibles se font directement (avec sauvegarde), seules les actions irréversibles me sont demandées.
⚠️ « C'est quoi fusionner la PR ? » 💡 Une PR est une proposition de modification ; « Merge » l'accepte et met le site à jour. Je fusionne la PR #1.
🧠 J'ai appris le vocabulaire Git en pratique : branche, pull request, merge, revert.

**15 h 03** · 🛠️ Ruleset GitHub sur `main` : suppression et force push interdits.

### Après-midi : l'audit global et le cadenas du panel

**15 h 06** · Je demande un audit de **tout** : sécurité, erreurs, optimisation.

**15 h 12** · Rapport : aucune fuite de secret. 1 point critique (régénérer les secrets qui étaient sur le serveur supprimé), 5 importants, 12 mineurs.

**15 h 34** · Je réponds point par point. Je choisis quoi corriger, ce qu'on fait ensemble, ce qu'on me rappellera plus tard. Pour les giveaways, je refuse une purge fixe à 30 jours (certains durent plus longtemps) : 💡 on compte maintenant **à partir de la fin** de chaque giveaway, avec une durée réglable par serveur.

**16 h 19** · 🛠️ Sauvegardes automatiques chaque jour, `RESTAURER.bat`, rappels programmés du 26 décembre au 3 janvier pour les points liés au futur serveur. Choix des sauvegardes sur **Discord plutôt que GitHub** (pas de jeton en écriture à confier au bot).

**16 h 32** · 🛠️ Alertes Dependabot et Malware activées, mais pas les mises à jour automatiques, qui auraient bloqué mes envois.

**16 h 39 → 18 h 06** · **Cloudflare Access**, la partie la plus laborieuse de la journée :
- ⚠️ Je demande si on peut ajouter une application d'authentification. 💡 Oui : MFA TOTP en plus du code par mail.
- ⚠️ **Connexion en boucle** : « That account does not have access ». La page proposait de se connecter avec mon compte Cloudflare (une autre adresse mail) alors que seule mon adresse autorisée a accès. 💡 Activer la méthode **One-time PIN** seule.
- ⚠️ Arrivée sur une page « Welcome » au lieu du panel. 💡 C'est l'App Launcher, désactivé par défaut. C'est lui qui permet d'enregistrer l'application d'authentification : il faut lui donner la même règle.
- ✅ Bitwarden enregistré. Je renomme l'équipe générée au hasard (« royal-cake-… ») en `cyberbot-team`.
- ✅ Test : mail, code et Bitwarden passent, puis erreur 1033… normale, car le bot est éteint.
🧠 La sécurité « zero trust » se configure par couches, et chaque couche a son propre écran. Il faut tester après chaque changement.

**18 h 15 → 18 h 40** · Régénération de tous les secrets et nouveau `.env` (rempli par moi, jamais montré). ✅ « Tout est fait. »

### En parallèle : où héberger Cyber pour de bon ?

**16 h 19 → 21 h** · Je me demande si un Raspberry Pi 5 est le bon choix.
⚠️ *Problème humain* : je précise que le Pi 2 Go était pour mon père et que moi je visais le 8 Go, il faut donc refaire la comparaison.
⚠️ Les premiers prix annoncés étaient **trop bas** : en 2026, la RAM a beaucoup augmenté. La correction est faite honnêtement, avec de vrais liens.
⚠️ *Contrainte de budget* : le neuf est trop cher pour un étudiant, et un PC format SFF trop encombrant.
💡 **Un mini PC reconditionné « 1 litre »** (EliteDesk Mini, ThinkCentre Tiny, OptiPlex Micro). Je compare des annonces d'occasion, et pour chacune je reçois un avis et un message prêt à envoyer au vendeur. Achat prévu à Noël, sans écran.

### Soirée : identité visuelle

**19 h 43** · 🛠️ Pack de **57 prompts** pour générer tous les visuels avec une charte stricte (palette, polices, masque de démon).
**21 h 35** · ⚠️ ChatGPT s'arrête à l'image 7 (quota gratuit). Gemini prend le relais, puis s'arrête aussi. 💡 Décision : générer un peu chaque jour, à chaque recharge des quotas. Les images sont recadrées aux bonnes tailles au fur et à mesure.
**22 h 09** · 🛠️ Avatar, bannière et description du bot posés dans le portail. Application transférée dans une équipe Discord (la 2FA est obligatoire pour ça).
**23 h 06** · ⚠️ La bannière rend mal en petite vue : du rose apparaît et le texte est coupé. 💡 L'image générée était **semi-transparente** et Discord mettait sa couleur derrière. Version opaque, texte centré.

### Soirée : vérification Discord et RGPD

**22 h 28 → 22 h 49** · 🛠️ `/mesdonnees`, effacement automatique 30 jours après le retrait d'un serveur, pages légales réécrites et mentions légales. J'ouvre et je fusionne moi-même la **PR #2**. ✅ « Tout est testé. »
**22 h 49** · Je découvre deux champs mystérieux dans le portail. 💡 Les laisser vides : l'un d'eux aurait coupé toutes les commandes.

### Soirée : le tunnel renaît depuis mon PC

**22 h 53** · « On continue sans serveur ? » 💡 Oui : le tunnel peut partir de mon PC.
**22 h 57** · ⚠️ Rien ne se passe. 💡 La ligne `TUNNEL_TOKEN` était encore **en commentaire** (`#`) dans mon `.env`. Bon point quand même : j'avais masqué mes secrets avant d'envoyer la capture.
**22 h 59** · ⚠️ Le tunnel refuse de démarrer. 💡 J'avais mis l'empreinte de la version **Linux** de `cloudflared` alors que le PC télécharge la version **Windows**. La sécurité a fait exactement son travail.
**23 h 01** · ⚠️ « Bad gateway ». 💡 La route pointait encore sur l'ancien port, et `localhost` partait en IPv6 (`::1`). Correction : `127.0.0.1:3000`.
**23 h 03** · ⚠️ *Malentendu* : « J'ai rien changé du tout, tu racontes quoi ? » Claude avait supposé que j'avais déjà modifié la route. 💡 Excuses et explication pas à pas.
🧠 Ne jamais supposer qu'une étape est faite : vérifier sur la capture avant d'affirmer.
**23 h 05** · ✅ **https://panel.cyberbot.fr fonctionne** : code par mail, code Bitwarden, connexion Discord, puis le panel.

### Fin de soirée : finitions

**23 h 07** · ⚠️ « Je n'ai toujours pas de sauvegarde dans mon salon, c'est normal ? » 💡 Non, c'était **un bug** : la sauvegarde du jour avait été créée avant que le salon soit configuré, et elle n'était plus jamais renvoyée. Corrigé.
**23 h 14 → 23 h 23** · 🛠️ Deuxième audit complet (« je veux que tout soit nickel ») : **15 petits trous corrigés**, dont la triche possible au quiz.
**23 h 17** · 🛠️ Statut permanent « 🌐 cyberbot.fr · /aide ».
**23 h 21** · 🛠️ Bio automatique avec les vrais chiffres. J'explique ma vision des modules sur mesure (« les cassettes de Baymax »), annoncée comme « Bientôt » puisqu'elle n'est pas encore codée.
**23 h 29** · 🛠️ Modèle complet du serveur Discord de support : 12 catégories, 35 salons, 15 rôles.
**23 h 48** · Je passe chaque réglage du panel en revue et je liste **7 améliorations**. Je précise en cours de route que les classements du défi doivent rester dans le salon.
**00 h 17** · ✅ **Panel v1.7 installé** : brouillon et Réinitialiser, 123 modèles de tickets, vocaux Join to Create, défi du jour privé, Components V2. 60 commandes valides.
**00 h 19** · Je confirme que Cyber a la permission Administrateur sur mon serveur, donc rien à changer pour les vocaux.

**00 h 24** · Je lance cette documentation. 📘

---

## Bilan du carnet

| Indicateur | Valeur |
|---|---|
| Durée | 4 jours, dont une journée de plus de 15 heures |
| Versions | v1.0 → v1.7 |
| Commandes | 20 → 60 |
| Audits de sécurité | 4 (plus de 45 points corrigés) |
| Pull requests sur le site | 3 (dont celle-ci) |
| Incidents majeurs | 1 (serveur supprimé par l'hébergeur) |
| Données perdues | Celles du serveur hébergé (les sauvegardes automatiques existent depuis) |
