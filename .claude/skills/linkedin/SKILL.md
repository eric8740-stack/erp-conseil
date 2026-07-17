---
name: linkedin
description: Ligne éditoriale et pilotage des publications LinkedIn ERP Conseil. À invoquer pour rédiger un lot de posts, mettre à jour le planning, ou analyser les statistiques et réajuster les piliers.
---

# LinkedIn ERP Conseil — ligne éditoriale et pilotage

## Rôle de ce skill

Cadrer toute production de contenu LinkedIn : rédaction des lots de posts,
tenue du planning (`planning.md` dans ce dossier), et boucle d'ajustement
sur les statistiques. Toujours lire `planning.md` avant de rédiger un
nouveau lot (continuité de l'histoire, pas de redite).

## La promesse (fil conducteur de TOUS les posts)

> **Vos fichiers et vos données deviennent des outils fiables.**

Cible : dirigeants et responsables de TPE/PME qui perdent du temps avec
leurs fichiers (Excel fragile, saisies multiples, chiffres dont personne
n'est sûr). La niche, c'est le client — pas l'outil. Chaque post, quel que
soit le sujet, se rattache à cette promesse en conclusion.

## Les 4 piliers (ratios de départ, ajustables par les stats)

| # | Pilier | Ratio initial | Contenu type |
|---|--------|--------------|--------------|
| 1 | Démos d'applications | ~35 % | Captures avant/après : le fichier Excel → l'application. Détails d'écran qui donnent envie. |
| 2 | Excel / VBA concret | ~25 % | Une astuce, un piège, un symptôme (« votre fichier fait ça ? voilà pourquoi »). Audience la plus large. |
| 3 | Power BI / indicateurs | ~20 % | Un visuel de tableau de bord, une mesure qui parle aux dirigeants (marge, charge, trésorerie). |
| 4 | Automatisations / coulisses | ~20 % | Exports automatiques, rapports qui partent seuls, workflows. Montrer la machine en marche. |

## Boucle de pilotage : la demande prime

Le planning est un point de départ, **les statistiques décident de la suite** :

- Revue des stats LinkedIn toutes les 2 semaines (impressions/post,
  réactions, commentaires, et surtout messages/contacts entrants — le seul
  KPI qui paie).
- **Garde-fou de méthode : ne jamais conclure sur un post isolé.** Un pilier
  se juge sur au moins 3 posts publiés. Un post viral n'est pas une tendance.
- Si un pilier surperforme nettement : monter son ratio (jusqu'à ~50 % max).
- Aucun pilier ne descend sous 10 % : il faut continuer à mesurer pour
  pouvoir comparer.
- Toute modification de ratio est notée dans `planning.md` avec la date et
  la justification chiffrée.

## Gabarit de post

1. **Accroche** (1-2 lignes) : un symptôme, un chiffre, une situation vécue.
   Jamais de jargon en première ligne.
2. **Corps** (5-10 lignes courtes, aérées) : le problème → ce qu'on a fait →
   le résultat. Concret, chiffré quand c'est mesuré.
3. **Chute** : rattacher à la promesse + question ouverte ou invitation
   simple (« votre fichier fait ça aussi ? »).
4. **Visuel : OBLIGATOIRE sur chaque post.** Capture d'écran, avant/après,
   ou visuel au gabarit de la bannière (fond sombre, une phrase forte, une
   capture). Un post sans image ne part pas.
5. 3 à 5 hashtags max (#TPE #PME #Excel #PowerBI #automatisation selon sujet).
6. Ton : direct, honnête, sans survendre. Jamais de valeur non mesurée.

## Règles absolues (non négociables)

- **Jamais de données client réelles** dans les textes ni les captures :
  données de démonstration ou pseudonymisées (« un industriel », « une PME
  du bâtiment »). Relire chaque capture avant validation.
- **Validation humaine systématique** : un post n'est publié que via le
  circuit statut « approuvé » (table `posts_linkedin`, workflow n8n).
  Aucune publication automatique de contenu non relu.
- Les contenus liés à des dossiers en cours non annoncés restent hors
  planning tant que leur séquence de validation n'est pas terminée.
- Honnêteté totale sur les chiffres publiés : uniquement des valeurs
  mesurées.

## Cadence et circuit de publication

- **3 posts/semaine : lundi, mercredi, vendredi — 8h30** (heure de Paris).
- Rédaction par **lots de 2 semaines** (6 posts) : chaque lot est proposé,
  Eric valide/corrige ligne par ligne, puis les posts validés sont saisis
  dans la table `posts_linkedin` de n8n avec statut « approuvé », leur
  `date_prevue` et l'`image_url` du visuel.
- Le workflow n8n « Publication LinkedIn planifiée » publie chaque matin
  les posts approuvés du jour et passe leur statut à « publié »
  (ou « erreur » si échec — vérifier la table en cas de silence).

## Fichiers du skill

- `planning.md` : calendrier des posts (à venir, publiés, stats, décisions
  de réajustement). C'est la mémoire éditoriale — le tenir à jour à chaque
  lot et à chaque revue de stats.
