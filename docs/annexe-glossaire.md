# Annexe · Glossaire

| Terme | Explication simple |
|---|---|
| **API** | Porte d'entrée d'un service pour les programmes (ici, celle de Discord ou d'Anthropic) |
| **Branche / Pull request / Merge** | Copie de travail d'un dépôt Git / proposition de modification / acceptation de cette proposition |
| **CNAME** | Enregistrement DNS qui dit « ce nom est un alias de cet autre nom » ; aussi le fichier qui donne son domaine à GitHub Pages |
| **Cloudflare Access** | Contrôle d'accès devant un site : il faut prouver son identité (code par mail, application 2FA) avant de voir la page |
| **Components V2** | Format de message récent de Discord, plus riche que les « embeds » classiques |
| **CSP** | Politique de sécurité du contenu : le navigateur n'exécute que les scripts autorisés (contre le XSS) |
| **CSRF** | Attaque qui fait exécuter une action à un utilisateur connecté sans qu'il le sache |
| **DMARC / SPF** | Enregistrements DNS qui empêchent d'envoyer de faux mails au nom d'un domaine |
| **DNS / enregistrement A** | Annuaire d'Internet / ligne qui associe un nom à une adresse IPv4 |
| **DNSSEC** | Signature des réponses DNS ; doit être désactivée avant de changer de fournisseur DNS |
| **`.env`** | Fichier local qui contient les secrets (token, clés) ; jamais publié |
| **Gateway** | Connexion permanente (WebSocket) entre le bot et Discord |
| **HMAC** | Signature calculée avec une clé secrète : impossible de la fabriquer sans la clé (utilisée contre la triche au quiz) |
| **HSTS** | En-tête qui oblige le navigateur à toujours utiliser HTTPS |
| **Intent** | Type d'événements que le bot demande à recevoir de Discord (certains sont « privilégiés ») |
| **Moindre privilège** | Ne donner que les droits strictement nécessaires |
| **OAuth2** | Connexion « avec Discord » sans donner son mot de passe au site |
| **Proxmox** | Système installé sur une machine pour y faire tourner plusieurs machines virtuelles isolées |
| **Pterodactyl** | Panneau d'hébergement qui fait tourner chaque serveur dans un conteneur Docker |
| **RGPD** | Règlement européen sur la protection des données personnelles |
| **SHA-256 (empreinte)** | « Empreinte digitale » d'un fichier : si un seul octet change, l'empreinte change |
| **SQLite** | Base de données contenue dans un seul fichier, sans serveur à installer |
| **SSRF** | Faire envoyer par un serveur des requêtes vers son propre réseau interne |
| **TOTP** | Code à 6 chiffres qui change toutes les 30 secondes dans une application d'authentification |
| **Tunnel Cloudflare** | Connexion sortante chiffrée qui permet d'exposer un service sans ouvrir de port |
| **WebP** | Format d'image moderne, beaucoup plus léger que PNG ou JPEG à qualité égale |
| **XSS** | Injection de code dans une page web affichée à d'autres utilisateurs |
| **Zero Trust** | Approche où chaque accès est vérifié, même s'il vient d'un réseau « de confiance » |
