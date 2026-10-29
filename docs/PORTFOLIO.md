# Cyber · texte pour le portfolio

## Version courte (carte de projet)

**Cyber, bot Discord tout-en-un et sécurisé**
Bot Discord gratuit qui remplace plusieurs bots à la fois (modération, automod, tickets, niveaux, giveaways, vérification) et intègre une académie réseau niveau CCNA. Bilingue français / anglais. Panel web ouvert à tous avec connexion Discord, site sur un domaine personnel, hébergement derrière un tunnel Cloudflare protégé par une double authentification, cinq audits de sécurité et mise en conformité RGPD.
*Node.js · discord.js · Express · SQLite · GitHub Pages · Cloudflare (DNS, Tunnel, Access) · Git*
🌐 https://cyberbot.fr

## Version longue (page de projet)

### Le projet

Cyber est né d'un constat : un serveur Discord empile souvent cinq ou six bots différents. J'ai voulu un seul bot, gratuit et modulable, qui fasse tout, avec en plus un module pédagogique pour réviser les réseaux, en lien avec mon BTS CIEL.

En cinq jours, le projet est passé de 20 à **61 commandes**, avec deux modules activables par serveur, deux langues (français et anglais), un panel d'administration ouvert à tous et un site public.

### Mon rôle

J'ai mené le projet comme chef de projet et administrateur système, avec l'IA Claude comme développeur et formateur :

- définir les besoins, prioriser les versions, tester chaque livraison sur mes serveurs ;
- configurer toute l'infrastructure : nom de domaine (OVH), DNS et sécurité (Cloudflare), GitHub (dépôts public et privé, Pages, ruleset, Dependabot), portail développeur Discord, hébergeur ;
- piloter cinq audits de sécurité et décider quoi corriger ;
- documenter le projet (ce carnet de bord).

### Ce que j'ai mis en place

- **Réseau** : DNS (A, CNAME, TXT, SPF, DMARC), domaine personnel en HTTPS, tunnel Cloudflare sortant pour exposer un service **sans ouvrir de port**, résolution d'un problème IPv4/IPv6.
- **Sécurité** : secrets jamais publiés, principe du moindre privilège, panel d'abord protégé par cinq verrous (HTTPS, code par mail, application 2FA, OAuth2 Discord, permission vérifiée) puis ouvert au public après un audit dédié, automod qui démasque les lettres déguisées, vérification d'intégrité SHA-256, protections contre le XSS, le CSRF, le SSRF et la triche, sauvegardes automatiques.
- **Conformité** : commande `/mesdonnees` (accès et effacement), suppression automatique des données, politique de confidentialité, conditions et mentions légales.
- **Données** : passage des fichiers JSON à une base SQLite avec import automatique et repli de secours.
- **Gestion d'incident** : suppression du serveur par l'hébergeur, retour en local, régénération de tous les secrets, sauvegardes mises en place.

### Résultats

| | |
|---|---|
| Commandes | 61, en français et en anglais |
| Contenu pédagogique | 47 fiches, 498 questions de quiz |
| Audits | 5, plus de 45 points corrigés |
| Secrets publiés | 0 |
| Site | https://cyberbot.fr |

### Ce que j'ai appris

Lire un message d'erreur avant de paniquer, toujours avoir une sauvegarde, ne jamais faire confiance à un hébergement gratuit pour l'essentiel, et surtout : un projet technique se pilote avec des règles claires, des tests systématiques et une bonne documentation.

Documentation complète : https://github.com/enzocerejo/Cyber/tree/main/docs
