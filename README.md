# $APOT — Action Potential

Site de présentation de $APOT : laboratoire analogique, photographie immersive, typographie condensée et accents vert acide. Version publique : https://enudimmud.github.io/APOT/.

## Fichiers du site

- `index.html` : page et contenus en français.
- `styles.css` : styles adaptatifs pour mobile et ordinateur.
- `script.js` : expérience interactive du signal, réglages des effets, son facultatif et ouverture de l’archive visuelle.
- `assets/apot-coin.jpg` : illustration du token (environ 418 Kio).
- `assets/apot-lab.webp` : visuel de laboratoire fourni pour la refonte, optimisé en WebP (environ 415 Kio).
- `assets/fonts/` : Barlow Condensed et Space Grotesk, auto-hébergées, avec leurs licences SIL Open Font License.
- `.nojekyll` : publication statique directe avec GitHub Pages.

Le site fonctionne sans dépendance, compilation, compte visiteur ou connexion de wallet. Les liens de navigation et le contenu restent disponibles sans JavaScript.

## Expérience du signal

- Le bouton d’accueil déclenche une impulsion visuelle et incrémente un compteur propre à la session.
- Le stimulus varie de 0 à 100. Le seuil de 60 est arbitraire et illustratif, sans unité biologique. En dessous, une petite perturbation s’atténue ; à partir du seuil, l’amplitude de l’impulsion reste constante (« tout ou rien »).
- Le curseur se manipule au clavier ; Entrée ou le bouton « Stimuler » déclenchent l’expérience. Les résultats disposent d’un retour textuel accessible.
- Le son est désactivé par défaut et activable explicitement. Aucun son n’est chargé depuis un service externe.
- Les animations respectent `prefers-reduced-motion` et peuvent être coupées manuellement. Le canvas n’anime que pendant une impulsion visible ; il reste statique hors écran et lorsque l’onglet est masqué.
- Les chiffres du token se déplient au clic ou au clavier. L’image s’ouvre dans une boîte de dialogue native, refermable avec Échap.

L’expérience n’affiche aucune donnée de marché. Référence pédagogique : [Neuroscience, Electrical Potentials Across Nerve Cell Membranes, NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK11069/).

## Configuration sélectionnée avant lancement

Source : captures de l’interface de création StonkFun fournies par le créateur le **28 septembre 2026**, heure de Suisse. Ces captures ne prouvent pas le déploiement du token : les paramètres doivent être rapprochés du contrat réellement créé.

| Paramètre | Valeur affichée ou sélectionnée |
| --- | --- |
| Nom | Action Potential |
| Symbole | APOT |
| Réseau | Solana |
| Plateforme | StonkFun — https://www.stonkfun.xyz/ |
| Launchpad | LaunchLab |
| Modèle | Reward token |
| Token de cotation | NEURALINK, catégorie PreStocks |
| Offre totale | 1 000 000 000 APOT |
| Frais de trading | 1,25 % |
| Taxe de transfert vers les détenteurs | 1 % |
| Seuil de migration indiqué | 85 SOL levés |
| Destination après migration annoncée | Pool Raydium |
| Coût de lancement estimé dans la capture | Environ 0,013 SOL ; estimation de frais réseau, pas un tarif garanti |
| Achat initial du créateur | Champ vide ; aucun montant confirmé |

L’interface annonce une distribution automatique de la taxe aux détenteurs, sans commission créateur distincte pour le modèle sélectionné. Elle annonce aussi un verrouillage de liquidité via Burn & Earn et le stockage de l’image et des métadonnées sur Arweave. Ces indications de plateforme n’ont pas été vérifiées sur un contrat déployé.

La taxe de transfert de 1 % est distincte des frais de trading de 1,25 %. Leur présence n’implique aucun rendement fixe ou garanti. Le pairing NEURALINK ne constitue pas une affiliation officielle avec Neuralink.

## Publication sur GitHub Pages

Dans ce dépôt, ouvrir **Settings → Pages**, sélectionner **Deploy from a branch**, puis **main** et **/(root)**, et enregistrer. Utiliser l’URL confirmée par GitHub après le déploiement.

Les chemins des ressources sont relatifs, afin de fonctionner dans un sous-répertoire GitHub Pages comme sur un domaine dédié. Aucun workflow Actions ou outil de compilation n’est nécessaire.

## Après la création du token

1. Relever l’adresse exacte du contrat et le lien de la fiche $APOT sur StonkFun.
2. Vérifier les paramètres du contrat contre le tableau ci-dessus.
3. Remplacer les liens génériques vers StonkFun par la fiche exacte du token et actualiser les mentions de configuration avant lancement.
4. Ajouter seulement les réseaux sociaux réellement créés et confirmés.

Le site ne crée aucun token, n’exécute aucune transaction et ne reçoit aucune clé privée.
