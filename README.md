# $APOT — Action Potential

Site de présentation de $APOT, avec son identité noire et dorée, son illustration originale et le motif du potentiel d’action.

## Fichiers du site

- `index.html` : page et contenus en français.
- `styles.css` : styles adaptatifs pour mobile et ordinateur.
- `script.js` : animation progressive du signal, respectant la préférence de réduction des animations.
- `assets/apot-coin.jpg` : illustration du token (environ 418 Kio).
- `.nojekyll` : publication statique directe avec GitHub Pages.

Le site fonctionne sans dépendance, compilation, compte visiteur ou connexion de wallet. Les liens de navigation et le contenu restent disponibles sans JavaScript.

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
