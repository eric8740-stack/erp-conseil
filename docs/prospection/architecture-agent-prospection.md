# Agent de prospection B2B industriel — architecture n8n

Objectif : trouver des entreprises industrielles françaises de moins de 50 salariés,
récupérer un email professionnel de contact, envoyer la plaquette ERP Conseil par
lots, avec désinscription. Aucun envoi tant que l'étape 4 n'est pas validée par Eric.

## Existant (vérifié le 04/10/2026)

- n8n (`n8n.apppreview.fr`) : 5 workflows (veille Claude Code, démo Maintenance,
  LinkedIn ×2, un brouillon). Credentials disponibles : Gmail OAuth2, Anthropic, LinkedIn.
  Aucun workflow de prospection, aucune table de prospects.
- Dépôt `erp-conseil` : site statique + skill LinkedIn. Rien sur la prospection.
- Plaquette commerciale : pas encore dans le dépôt (à fournir en PDF).

## Vue d'ensemble : 4 workflows, 1 table

```
[1. Extraction Sirene] → table prospects_industrie (statut: nouveau)
        ↓
[2. Site web + email]  → statut: a_contacter | sans_email
        ↓
[3. Envoi par lots]    → statut: envoye (+ envoye_le)      ← BLOQUÉ tant que non validé
        ↓
[4. Désinscription]    → statut: desinscrit (+ desinscrit_le)
```

Table n8n `prospects_industrie` (créée, id `B1kLp4H5nMiUP2D4`) :
siren, siret, nom, naf, effectif, adresse, code_postal, ville, departement,
dirigeant, date_creation, site_web, email, statut, source, ajoute_le,
envoye_le, desinscrit_le, note.

## 1. Extraction Sirene — FAIT

Workflow `Prospection — 1. Extraction Sirene` (id `kLmJh8bdDTmJuVfU`).

- Source : `https://recherche-entreprises.api.gouv.fr/search` (gratuit, sans clé,
  7 req/s). Filtres : `activite_principale` (NAF), `tranche_effectif_salarie`,
  `departement`, `etat_administratif=A`. 25 résultats/page, pagination intégrée
  au nœud HTTP (300 ms entre pages, 500 ms entre codes NAF).
- Une requête par code NAF (évite le plafond de 10 000 résultats par requête).
- Normalisation → dédoublonnage SIREN → `rowNotExists` (ne réinsère jamais un
  SIREN connu, donc ne touche pas aux statuts existants) → insert.

Choix par défaut (modifiables dans le nœud « Paramètres de ciblage ») :

| Paramètre | Valeur | Pourquoi |
|---|---|---|
| codes_naf | 25.11Z, 25.12Z, 25.50A/B, 25.61Z, 25.62A/B, 25.73A/B, 25.99B, 28.29B, 28.41Z, 28.49Z, 22.21Z, 22.22Z, 22.29A, 16.23Z, 31.01Z, 31.09B, 33.12Z, 33.20B | Métallurgie, mécanique, plasturgie, bois, meuble, maintenance industrielle : TPE/PME avec ateliers, devis, stocks, suivi de prod = profils qui vivent sur Excel. |
| tranches_effectif | 03, 11, 12 (6 à 49 salariés) | En dessous de 6 salariés, pas de budget ni de besoin d'outil. Codes Sirene : 01=1-2, 02=3-5, 03=6-9, 11=10-19, 12=20-49. |
| departements | 87, 19, 23, 16, 24, 86 | Limoges + voisins, pour un premier lot testable. Vider le champ = toute la France. |
| max_pages_par_naf | 40 (1 000 fiches max par NAF) | Garde-fou. |

Premier run réel (04/10/2026) : 21 codes NAF, 359 entreprises insérées en 18 s,
pagination complète vérifiée (ex. 25.62B : 80 fiches sur 4 pages). Gros
contributeurs : 86 (84), 16 (69), 87 (58), 24 (50), 19 (46).

Limites connues :
- Sirene ne donne ni site web ni email. C'est l'objet de l'étape 2.
- Le filtre `departement` de l'API porte sur *tous* les établissements : ~40
  fiches ont leur siège hors zone (17, 33, 75…) mais un atelier dans la zone.
  Elles restent pertinentes ; sinon, ajouter un nœud Filter sur `departement`.

## 2. Site web + email — À FAIRE

Lit les lignes `statut = nouveau`, par lots de 50 (Loop Over Items).

1. **Trouver le site** : requête `"<nom> <ville>"` via une API de recherche.
   Choix par défaut : Serper.dev (2 500 requêtes gratuites, puis ~1 $/1 000) ;
   alternative Brave Search API. Garde le premier résultat hors annuaires
   (societe.com, pappers, pagesjaunes, linkedin, facebook…). Sans résultat →
   `sans_site`.
2. **Scraper le site** : HTTP Request sur `/`, `/contact`, `/mentions-legales`,
   `/contact-us`, puis regex email dans le HTML (nœud Code). Priorité :
   `contact@`, `info@`, `commercial@`, `accueil@`, puis le premier email du
   domaine. Exclut `noreply`, `webmaster`, les emails d'agences web.
   Les mentions légales donnent presque toujours un email : c'est l'obligation
   LCEN, d'où un taux de réussite attendu de 50-70 %.
3. **Résultat** : met à jour `site_web`, `email`, `statut = a_contacter` ou
   `sans_email`. Respect : 1 site à la fois, 1 s entre deux sites, User-Agent
   identifié « ERPConseil-bot ».

Option qualité (plus tard) : passer la page contact à Claude (credential
Anthropic déjà en place) pour choisir le bon email quand il y en a plusieurs.

## 3. Envoi par lots — À FAIRE, SANS ENVOI AVANT VALIDATION

- Expéditeur : **eric@ericpaysant.fr** via le nœud n8n Microsoft Outlook
  (décision d'Eric du 04/10/2026 ; credential Outlook OAuth2 à créer dans n8n,
  pas Gmail). Déclencheur : planning (ex. mardi et jeudi 09:00), 30 emails/jour
  maximum au départ (réputation du domaine).
  Si le volume dépasse ~50/jour, passer à Brevo (SMTP dédié, gratuit jusqu'à
  300/jour, gère désinscription et bounces nativement).
- Texte de l'email : version validée par Eric le 04/10/2026, en texte brut
  (pitch application de maintenance, démo maintenance.apppreview.fr), copiée
  dans `docs/prospection/email_type.md`. Variables n8n : `{{siren}}` et
  `{{jeton}}` dans le lien de désinscription uniquement.
- Lit `statut = a_contacter`, exclut `desinscrit`, limite au quota du jour.
- Pas de pièce jointe au premier envoi (délivrabilité) : le lien vers la démo
  remplace la plaquette. Lien de désinscription obligatoire en pied de mail.
- Marque `statut = envoye`, `envoye_le`. Erreur Gmail → `note`.
- Cadre légal B2B (CNIL) : prospection vers adresse professionnelle générique
  autorisée si le sujet est en lien avec l'activité du destinataire, avec
  identification de l'expéditeur et moyen simple de s'opposer. Pas d'achat de
  base, pas de relance au-delà de 2.

## 4. Désinscription — À FAIRE

- Webhook n8n `GET /desinscription?s=<siren>&t=<jeton>` ; le jeton est un
  HMAC du SIREN (secret dans une variable n8n), évite les désinscriptions
  forgées.
- Met `statut = desinscrit`, `desinscrit_le`, renvoie une page de confirmation.
- Le lien figure dans chaque email de l'étape 3. Les réponses « stop » par
  email : Gmail Trigger sur la boîte, mot-clé → même mise à jour.

## Ordre de réalisation

1. ✅ Extraction (ce commit). Eric ajuste NAF/départements et relance.
2. Workflow 2 : nécessite une clé Serper.dev (ou Brave) → credential n8n.
3. Workflow 4 (désinscription) avant le 3, pour que le lien existe.
4. Workflow 3 en mode « brouillon Outlook » d'abord (crée des brouillons, n'envoie
   pas), validation par Eric sur 5 exemples, puis bascule en envoi réel.

Dossier `docs/prospection/` : ce plan + export JSON des workflows à chaque étape.
