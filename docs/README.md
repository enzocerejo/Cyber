# Documentation du projet Cyber

Compte rendu complet, étape par étape, de la création de **Cyber**, un bot Discord tout-en-un et gratuit, de son panel d'administration et de son site https://cyberbot.fr.

> Projet personnel d'**Enzo Cerejo**, étudiant en BTS CIEL, réalisé en octobre 2026 avec l'assistance de l'IA Claude (Anthropic).
> Le code du bot est dans un dépôt privé ; ce dépôt public contient le site et cette documentation. Aucun secret n'y figure.

![Architecture](images/architecture.jpg)

## Sommaire

1. [Contexte et objectifs](01-contexte.md)
2. [Carnet de bord](02-carnet-de-bord.md) : le récit jour par jour, avec les problèmes techniques et humains
3. [Choix techniques](03-choix-techniques.md)
4. [Le bot et ses commandes](04-bot-et-commandes.md) (liste complète des 61 commandes)
5. [Le panel d'administration](05-panel.md)
6. [Le site et le domaine cyberbot.fr](06-site-et-domaine.md)
7. [Hébergement, GitHub privé et tunnel Cloudflare](07-hebergement-et-tunnel.md)
8. [Sécurité et audits](08-securite-et-audits.md)
9. [Données personnelles et vérification Discord](09-rgpd-et-verification.md)
10. [Identité visuelle et communauté](10-identite-et-communaute.md)
11. [Problèmes rencontrés et leçons apprises](11-problemes-et-lecons.md)
12. [La suite du projet](12-suite.md)
- [Annexe : glossaire](annexe-glossaire.md)
- [Texte de présentation pour le portfolio](PORTFOLIO.md)

## Chiffres clés

| | |
|---|---|
| Durée | 5 jours (25 → 29 octobre 2026) |
| Versions | v1.0 → v1.8 |
| Commandes | 61, en 2 modules (Communauté, Académie), en français et en anglais |
| Académie | 47 fiches CCNA, 498 questions, 92 termes de glossaire |
| Tickets | 123 modèles prêts à l'emploi |
| Sécurité | 5 audits, plus de 45 points corrigés, 0 secret publié |

## À propos des images

Les captures du site et du panel viennent du **mode démonstration**, qui était public jusqu'au 29 octobre (aucune donnée réelle). Les écrans d'outils (Cloudflare, console d'hébergement, profil Discord…) sont des **illustrations recréées** d'après les vraies captures du projet, pour garder le même rendu sans exposer d'identifiants, d'adresses IP ni d'informations personnelles.
