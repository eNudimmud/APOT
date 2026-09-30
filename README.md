# λP⊙T — The next impulse.

Public site: https://enudimmud.github.io/APOT/  
Community: https://x.com/APOTsignal

## Direction agreed with the creator

English only. A concise scientific and creative identity, with the token as the main conversion goal. Community participation is open to everyone; holding APOT is optional. Future steps and collaborations are left open. Neuralink is an editorial reference, not the identity of APOT or an announced partner.

## Experience — signal study, 29 September 2026

- Static HTML, CSS, and JavaScript. GitHub Pages serves the repository root. No package install and no second framework.
- The public wordmark is **λP⊙T**. The running header, the hero, and the access title show the exact line **APOT X NEURALINK Prestock**. The ticker stays **$APOT**, always reachable from the header.
- The hero is a depth-sorted 3D filament drawn on canvas. It runs as a continuous idle loop; scroll only nudges the pose. The loop uses requestAnimationFrame, pauses when the tab is hidden or the hero is off screen, and starts paused when reduced motion is requested. Pause stops the loop. A no-canvas SVG trace keeps its own loop.
- Copy is English and short. References: Neuralink’s Audrey film (opened on demand), Alex’s PRIME Study note, and the Sylvius 4 Online demo. Sylvius stays on Oxford University Press and is not embedded. The archive is keyboard operable. $APOT access uses the confirmed mint `GsUXfGLgAvfMKxiCUVoe8iNaMR4dqP5xBbXcD8BbAP4o`, with Jupiter as the buy link and the related Solscan account as the explorer.

## Signal signature

A visitor can generate a personal signature in the browser. No account, wallet, or token is required. One seed writes four graphic parameters, the waveform, the network, and the λ-ID. The same seed always rebuilds the same overlay, on any photo. Phase 4, optional X identity linking, is not on this page.

The profile image is the visitor’s own picture with that signature laid over it. The photo is read locally and is never uploaded. The banner stays a seed-drawn plate, with no photo.

Try it locally with `python3 -m http.server` from the repository root:

1. Open the site and choose **Generate your signal**, or **Generate signal** in `05 / SIGNATURE`.
2. Copy the eight-character seed, then **Restore signal** and enter it again. The λ-ID, parameters, curve, and network return.
3. Choose **Use your photo** and pick a square image (a current avatar works). Set **Overlay** — the default is 45% — until the face stays readable. **Download PFP** saves a 1:1 PNG of that composite.
4. **Download banner** saves the 3:1 plate drawn from the seed. It does not use the photo.
5. **Share signal** opens an X compose window with prefilled text. It does not post.

The deterministic fixture is seed `7F2A91C4` (λ-7F2A). Check it with `node signature-check.js`.

## Sources

| Editorial reference | Source |
| --- | --- |
| Audrey — Creating Art With The Mind, official Neuralink film | https://www.youtube.com/watch?v=5hYg3rUfLiQ |
| Same film, official post and transcript | https://www.linkedin.com/posts/neuralink_creating-art-with-the-mind-activity-7461117355343982592-ZptQ |
| Alex — PRIME Study second participant, CAD | https://neuralink.com/updates/prime-study-progress-update-second-participant/ |
| Sylvius 4 Online demo | https://learninglink.oup.com/access/content/sylvius-instructor/sylvius-4-online-demo-video |
| Official APOT community account, supplied by the creator | https://x.com/APOTsignal |

The Neuralink film is an account of clinical trial participants, not a general claim of clinical outcomes. Oxford's video stays on its official player. Images and figures introducing the CAD story and atlas are identified as conceptual illustrations; they are not represented as screenshots of either product.

## Build and hosting

Static HTML, CSS and JavaScript served by GitHub Pages from the default branch (`main`) at https://enudimmud.github.io/APOT/. A pull request is not what Pages publishes. To preview a branch, check it out and run `python3 -m http.server` from the repository root. Relative paths match the `/APOT/` base. No package install or build step. `signal.js` contains the original Canvas 2D projection; `script.js` handles navigation, scroll composition, the film and the archive. Fonts are self-hosted under their existing SIL OFL licenses. No wallet connection, transaction, form submission or analytics. YouTube is loaded only on request. The film uses an original typographic editorial cover, so the page does not depend on a third-party thumbnail. The fixed navigation keeps the token accessible throughout the page.

Use relative paths to preserve compatibility with the /APOT/ base path. Keep `.nojekyll` in the root. Existing images are reused without modifying their artwork.

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


## Token configuration updates

The creator confirmed the mint `GsUXfGLgAvfMKxiCUVoe8iNaMR4dqP5xBbXcD8BbAP4o` (Action Potential / $APOT). The access section shows that address, links to [Jupiter](https://jup.ag/tokens/GsUXfGLgAvfMKxiCUVoe8iNaMR4dqP5xBbXcD8BbAP4o) for the swap, and links to the related [Solscan account](https://solscan.io/account/EV9iJQTEK3rwoKGvG5N4qh4CMwi727SJAjiKz1H9vZH4). StonkFun’s public token index returned no pool for this mint (`GET /api/public/v1/tokens/{mint}` → not found; the Open Graph card says “Token not found”), so the generic StonkFun homepage is no longer the buy link. The NEURALINK Prestock pair stays on the page as the creator’s quote pair; it does not announce a partnership. Supply, tax, and fee figures remain the pre-launch notes in the table above.
