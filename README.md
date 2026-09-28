# $APOT — À l’origine du signal

Site public : https://enudimmud.github.io/APOT/.

## Direction artistique et parcours

Refonte suivant les références du créateur : bleu nuit, ivoire, or discret, imagerie cérébrale et laboratoire analogique. Neuralink constitue la référence technologique et visuelle. APOT reste un projet indépendant, sans affiliation avec Neuralink ou Oxford University Press.

Le simulateur, le compteur d’impulsions, les sons et le vert acide ont été retirés. Le parcours propose :

- Un accueil avec une illustration cérébrale conceptuelle, explicitement identifiée comme telle.
- Trois étapes documentées : émettre un potentiel d’action, enregistrer l’activité neuronale, traduire l’intention en commande. Les onglets répondent au clic, à Entrée/Espace et aux flèches ; Home/End accèdent aux extrémités.
- Une section neuroanatomique avec un lien vers la démonstration officielle Sylvius 4 Online, présentée par Len White, environ 10 minutes, en anglais. La vidéo reste sur le lecteur de son éditeur ; elle n’est ni téléchargée ni réhébergée.
- Une galerie des quatre références APOT du créateur. Navigation précédente/suivante, flèches du clavier, fermeture avec Échap, retour du focus au lien d’origine.
- La configuration du token et des réponses sur le lien avec Neuralink et les frais.

Le menu s’adapte au mobile. Aucun défilement forcé, aucune animation répétitive, aucun son automatique. Les transitions respectent `prefers-reduced-motion`. Sans JavaScript, tous les articles restent visibles et les liens des images ouvrent leurs fichiers.

## Sources et ressources

| Ressource | Provenance / rôle |
| --- | --- |
| Technologie Neuralink | https://neuralink.com/technology/ — source principale sur l’enregistrement des potentiels d’action et le décodage des intentions motrices |
| Potentiels électriques | https://www.ncbi.nlm.nih.gov/books/NBK11069/ — Neuroscience, Electrical Potentials Across Nerve Cell Membranes |
| Sylvius 4 Online | https://learninglink.oup.com/access/sylvius — description de l’atlas, vues, coupes et glossaire |
| Démonstration Sylvius | https://learninglink.oup.com/access/content/sylvius-instructor/sylvius-4-online-demo-video — lecteur officiel OUP |
| `assets/apot-signal.webp` | Visuel 1000035568.jpg fourni par le créateur, conversion WebP |
| `assets/apot-lab.webp` | Visuel 1000035567.png fourni par le créateur, conversion WebP |
| `assets/apot-medallion.webp` | Visuel 1000035354.jpg fourni par le créateur, conversion WebP |
| `assets/apot-profile.webp` | Visuel 1000035350.jpg fourni par le créateur, conversion WebP |
| `assets/apot-cerebral.webp` | Illustration de marque générée avec l’outil de génération d’images intégré ; ce n’est pas une mesure clinique ni un atlas anatomique |
| `assets/fonts/` | Space Grotesk auto-hébergée, licence SIL Open Font License fournie |

Le seuil −55 mV appartient au visuel du créateur. La page précise qu’il s’agit d’un repère illustratif variable selon les cellules et les conditions.

## Code

`index.html`, `styles.css` et `script.js` sont servis directement par GitHub Pages depuis `main`. Aucun framework, dépendance, build, wallet, compte visiteur ou collecte de données. Les assets utilisent des chemins relatifs. `.nojekyll` préserve la publication statique directe.

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
