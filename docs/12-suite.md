# Chapitre 12 · La suite du projet

## Court terme

- Terminer les visuels (reprise au prompt 19) et les installer dans le bot et sur le site.
- Construire le serveur Discord de support à partir du modèle.
- Faire la double authentification et la vérification d'identité pour préparer la vérification Discord.
- Faire connaître Cyber pour atteindre les **75 serveurs** nécessaires à la demande de vérification.
- Traduire l'Académie (fiches, quiz, glossaire) en anglais.
- Décider d'un hébergement en continu (Hetzner, environ 4 € par mois) en attendant le homelab.

## Le homelab (achat le 31 octobre)

- Achat d'un **HP EliteDesk 800 G5 Mini** d'occasion (i5-9500, 16 Go de RAM, SSD 500 Go) pour 220 €, plus tôt que prévu.
- Installation de **Proxmox** ou Debian, puis **Docker**.
- Bot dans un conteneur, sans aucun port exposé, avec le **tunnel Cloudflare** déjà prêt (route vers `127.0.0.1:<port>`, empreinte `cloudflared` de la bonne architecture).
- Rappels programmés du 26 décembre au 3 janvier pour ne rien oublier.
- La même machine servira de laboratoire pour le BTS CIEL et le CCNA (VM pfSense, Windows Server, Linux).

## Les modules sur mesure (« cassettes »)

Le grand projet : permettre à un serveur de recevoir un module développé pour lui.

1. Le serveur demande un module.
2. Enzo le développe.
3. Il génère un **identifiant secret lié à ce serveur** (inutilisable ailleurs).
4. L'administrateur le saisit dans l'onglet « Modules publics » du panel (« Ajouter un module »).
5. Cyber reconnaît le module et l'installe.

Points de conception déjà identifiés : identifiants non devinables et liés à un seul serveur, modules isolés du reste du bot, données déclarées dans la politique de confidentialité.

## Quand le bot grandira

- Couche IA de l'automod (Claude Haiku), déjà écrite et mise de côté, si le besoin se confirme.
- Option `COMMANDES=global` pour enregistrer les commandes une seule fois pour tous les serveurs.
- Widget de statut sur le site.
- **Sharding** obligatoire à partir de 2 500 serveurs.
- Intents privilégiés justifiés auprès de Discord.
