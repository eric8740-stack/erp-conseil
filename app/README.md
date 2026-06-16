# ERP Conseil — Espace Pro

Application web de gestion commerciale pour **ERP Conseil** (Eric Paysant, EI) :
devis, factures, clients et tableau de bord. 100 % côté navigateur — **aucun
serveur, aucun abonnement, aucune donnée envoyée à l'extérieur**.

## Fonctionnalités

- **Tableau de bord** : CA facturé, encaissé, devis en attente, taux d'acceptation
  et **relances** des factures en retard de paiement
- **Devis** : numérotation automatique `DEV-AAAA-NNN`, lignes dynamiques, calcul des totaux
- **Factures** : numérotation `FAC-AAAA-NNN`, conversion d'un devis accepté en 1 clic,
  **échéance automatique** (date + délai de paiement) et **suivi des encaissements**
- **Bilan annuel** : CA facturé et encaissé par mois, par année, **export CSV** pour
  vos déclarations
- **Satisfaction client** : formulaire d'avis en ligne (`satisfaction.html`),
  liens prêts à envoyer par mission, tableau de bord (note moyenne, répartition,
  taux de recommandation, commentaires) — stockage **Airtable** via relais sécurisé
- **Clients** : carnet d'adresses réutilisable
- **Logo personnalisé** affiché en tête des devis et factures
- **Export PDF** professionnel (impression navigateur) conforme à votre modèle et
  aux mentions légales EI (TVA non applicable, art. 293 B du CGI)
- **Sauvegarde / restauration** des données via fichier JSON
- Réglages : coordonnées, logo, délai de paiement, mentions, préfixes de numérotation

## Utilisation

Ouvrez simplement `index.html` dans un navigateur — rien à installer.

Les données sont enregistrées dans le **stockage local du navigateur**.
Pensez à **exporter régulièrement une sauvegarde** (Réglages → Exporter).
Pour changer d'ordinateur : exportez d'un côté, importez de l'autre.

## Déploiement gratuit (GitHub Pages)

1. Poussez ces fichiers à la racine d'un dépôt GitHub.
2. *Settings → Pages → Branch : `main` / `/root`*.
3. L'application sera servie sur `https://<utilisateur>.github.io/<dépôt>/`.

> Dépôt public : seul **le code** est public, **vos données** restent dans
> votre navigateur. Pour générer un PDF, utilisez « Aperçu / PDF » puis
> « Enregistrer au format PDF » dans la boîte d'impression.

## Satisfaction client (Airtable)

La collecte des avis utilise un petit relais **Google Apps Script** (gratuit) qui
écrit dans une base **Airtable** — la clé Airtable reste côté serveur, jamais dans
le dépôt public.

1. La base « ERP Conseil — Satisfaction » et sa table sont déjà créées dans votre
   compte Airtable.
2. Suivez les 4 étapes décrites en tête de `google-apps-script/Code.gs`
   (jeton Airtable + déploiement de l'application web).
3. Collez l'URL `/exec` obtenue :
   - dans `satisfaction.html` → constante `ENDPOINT`
   - dans l'app → **Réglages → Satisfaction → URL du relais**
4. Renseignez aussi le **lien public du formulaire** dans les Réglages.

Ensuite : depuis un devis/facture, bouton **« ⭐ Lien d'avis »** (ou onglet
Satisfaction → « Générer un lien ») pour obtenir un lien prérempli à envoyer au
client. Les réponses remontent dans l'onglet **Satisfaction**.

## Pile technique

HTML / CSS / JavaScript natif, sans dépendance ni étape de build.
