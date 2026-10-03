# λP⊙T — Potential, in motion.

Public site: https://www.apot.world/  
Static mirror: https://enudimmud.github.io/APOT/  
Community: https://x.com/APOTsignal

## Direction agreed with the creator

English only. A concise scientific and creative identity, with creation as the first invitation and clear access to the token. Community participation is open to everyone; holding APOT is optional. Future steps and collaborations are left open. Neuralink is an editorial reference, not the identity of APOT or an announced partner.

## Experience — realistic laboratory, 3 October 2026

- Static HTML, CSS, and JavaScript. GitHub Pages serves the repository root. No package install and no second framework.
- The public wordmark is **λP⊙T**. The running header, the hero, and the access title show the exact line **APOT X NEURALINK Prestock**. The ticker stays **$APOT**, always reachable from the header.
- The opening pairs strong editorial type with an original photograph of a credible oscilloscope workbench. A small filament in the band below is drawn on canvas. Its loop pauses when the tab is hidden or the band is off screen, and starts paused when reduced motion is requested. A static SVG trace is the no-canvas fallback.
- Copy is English and short. References: Neuralink’s Audrey film (opened on demand), Alex’s PRIME Study note, and the Sylvius 4 Online demo. Sylvius stays on Oxford University Press and is not embedded. The archive is keyboard operable. $APOT access uses the confirmed mint `GsUXfGLgAvfMKxiCUVoe8iNaMR4dqP5xBbXcD8BbAP4o`, with Jupiter as the buy link and the related Solscan account as the explorer.

## Compose an edition

The composer adds a Midnight/Paper edition card and an original musical motif to the existing deterministic signature. **Download card** draws directly at 3840 × 2160. **Listen to your signal** plays a five-second motif only on request; a second click, a seed change or hiding the tab stops it. **Download sound** saves mono PCM 16-bit WAV at 44.1 kHz. These are artistic seed mappings, with no neural data.

**Share your edition** opens an X draft containing the full seed and palette URL, for example `https://www.apot.world/?seed=7F2A91C4&tone=paper#signature`. A valid linked seed takes precedence on page arrival, including for a connected visitor. Explicit Generate while connected still restores that account's own seed. No automatic posting.

The three new photographic studies open in an accessible native dialog. The community invitation drafts FIRST SIGNAL / 001; the visitor adds their work and submits it voluntarily. 2030, 2035 and 2040 remain editorial questions, not a Neuralink schedule. Culture references are credited reading connections.

Offline checks: `node signature-check.js`, `node x-oauth-check.js`, and `node studio-check.js`. These check signature and X identity fixtures, read-only OAuth helpers, deterministic WAV bytes, PCM structure/headroom, and full-seed share URLs. `review.html` provides 390/768/1024 px iframe layouts on an actual hosted preview. This changes layout width only, not the device pixel ratio.

## Signal signature

A visitor can generate a personal signature in the browser. No wallet or token is required to draw the signal. One seed writes four graphic parameters, the waveform, the network, and the λ-ID. The same seed always rebuilds the same overlay. The banner stays a seed-drawn plate and does not use an avatar.

A connected X account fixes that seed. The browser hashes the numeric user id and keeps the first eight hex characters. The same account restores the same seed, λ-ID, waveform, parameters, and network after Connect with X, including on another browser or device. The @handle is not an input. Generate signal, while signed in, restores that account’s signal instead of minting a new one. A random seed already stored in the tab is replaced on a successful connection.

The profile image is the connected X account’s avatar with that signature laid over it. There is no manual upload. **Download PFP** stays off until X sign-in has supplied the avatar. The signal itself is drawn in the browser. X sign-in is not local: the server exchanges the OAuth code and fetches the avatar. Nothing is posted.

Try the signal locally with `python3 -m http.server` from the repository root. Connect with X needs the Vercel deployment below, or `vercel dev` with the environment variables set.

1. Open the site and choose **Generate your signal**, or **Generate signal** in `02 / COMPOSE`.
2. Copy the eight-character seed, then **Restore signal** and enter it again. The λ-ID, parameters, curve, and network return.
3. **Connect with X**, approve the read-only prompt, and return to the page. The signal on screen becomes that account’s signal, and the avatar becomes the base. Connect again, or open another browser, and the same λ-ID returns. Set **Overlay** — the default is 45% — until the face stays readable. **Download PFP** saves the 1:1 PNG.
4. **Download banner** saves the 3000 × 1000 plate drawn from the seed. It does not use the avatar.
5. **Share signal** opens an X compose window with prefilled text. It does not post.

The deterministic fixture is seed `7F2A91C4` (λ-7F2A). The X identity fixture is user id `1847291056384729103`, which restores seed `4A6445B3` (λ-4A64) on every run. Check both with `node signature-check.js`. The X helper, with no network and no real secrets, is `node x-oauth-check.js`.

## X sign-in for the profile image

Deploy this repository as a Vercel project with the site at the domain root. The `api/x` routes run there. GitHub Pages can still show the page, but it cannot complete OAuth.

X app, in the developer console:

1. Create an app and turn on OAuth 2.0 user authentication.
2. App type: Web App, confidential client.
3. Permissions: Read only. That is “Read Posts and profile information.” Do not enable write, Direct Messages, or follow.
4. Callback / redirect URL, character for character: `https://<your-domain>/api/x/callback`
5. Website URL: `https://<your-domain>`
6. Copy the OAuth 2.0 Client ID and Client Secret. They are not in this repository.

The code asks only for the scopes `users.read` and `tweet.read`. X requires `tweet.read` before `GET /2/users/me` can return the signed-in account. The server then requests the numeric user id, `profile_image_url`, name, and username. It does not request `tweet.write`, `offline.access`, `dm.read`, `dm.write`, `follows.read`, or `follows.write`, and it never calls a post, like, follow, or message endpoint. The access token is used once and is not stored. A signed cookie remembers the numeric user id, the @handle, and the avatar URL for 12 hours. A cookie from before this binding has no user id and is treated as signed out, so Connect with X once more.

Vercel → Project → Settings → Environment Variables. Set them for Production (and Preview, if you test there). Redeploy after saving. Do not commit the values.

| Name | Value |
| --- | --- |
| `X_CLIENT_ID` | OAuth 2.0 Client ID |
| `X_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `X_REDIRECT_URI` | `https://<your-domain>/api/x/callback` |
| `APOT_SESSION_SECRET` | A long random string, for example `openssl rand -base64 32` |

`X_REDIRECT_URI` must match the callback registered on the X app. Empty names are listed in `.env.example`.

Happy path on the deployed site: **Connect with X** → **Generate signal** → set **Overlay** → **Download PFP**. **Disconnect** ends the session. **Share signal** still only opens a compose window.

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

Use relative paths to preserve compatibility with the /APOT/ base path. Keep `.nojekyll` in the root. The current photographic studies are the responsive `assets/study-*.webp` files. Native generated PNG sources are preserved in `assets/masters`; actual dimensions are recorded in `assets/media-manifest.json`. The token specimen is vector artwork. Photographic sources are 1672 or 1536 pixels wide, not 4K. See `ART_DIRECTION.md` for the current visual canon.

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
