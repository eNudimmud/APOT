# λP⊙T — Potential, in motion.

Public site: https://www.apot.world/

Static mirror: https://enudimmud.github.io/APOT/

Community: https://x.com/APOTsignal

## Direction agreed with the creator

English only. A concise scientific and creative identity, with creation as the first invitation and clear access to the token. Community participation is open to everyone; holding APOT is optional. Future steps and collaborations are left open. Neuralink is an editorial reference, not the identity of APOT or an announced partner.

## Experience — realistic laboratory, updated 4 October 2026

- Static HTML, CSS and JavaScript, with Vercel serverless routes for required X sign-in and personal MP4 rendering. No frontend framework or build step. Vercel installs the two pinned native rendering dependencies. GitHub Pages can show the public editorial pages only.
- The public wordmark is **λP⊙T**. The running header, the hero, and the access title show the exact line **APOT X NEURALINK Prestock**. The ticker stays **$APOT**, always reachable from the header.
- The opening pairs strong editorial type with an original photograph of a credible oscilloscope workbench. A small filament in the band below is drawn on canvas. Its loop pauses when the tab is hidden or the band is off screen, and starts paused when reduced motion is requested. A static SVG trace is the no-canvas fallback.
- Copy is English and short. References: Neuralink’s Audrey film (opened on demand), Alex’s PRIME Study note, and the Sylvius 4 Online demo. Sylvius stays on Oxford University Press and is not embedded. The archive is keyboard operable. $APOT access uses the confirmed mint `GsUXfGLgAvfMKxiCUVoe8iNaMR4dqP5xBbXcD8BbAP4o`, with Jupiter as the buy link and the related Solscan account as the explorer.
- **THE HUMAN FRAME** replaces the hidden cultural catalogue and its outbound publisher links. A fourth original photographic study makes reflected identity visible. Reflection, choice, trace and response shape future creations through framing, rhythm, materials and credible gestures. The page leaves these allusions unnamed. The image opens in the existing artwork dialog, with its native source available.
- Studies **005 / Still you.** and **006 / Your move.** extend that visible series: a reflected gaze and a red/blue optical choice in open hands. Both native 1536 × 1024 sources open in the artwork dialog. Responsive WebP copies are reduced without enlargement; exact prompts and provenance are in assets/lineage-prompts.md. "Make it your own" leads into the open call.
- Scientific record tabs operate within their own tablist. They cannot hide the X profile preview or select its PFP/Banner tabs. Each tab group retains its own controller.

## Your fixed X signal

Personal generation requires **Connect with X**. One verified numeric X account ID always derives the same seed using `SHA-256("apot-x-user:" + id).slice(0, 8).toUpperCase()`. Changing the @handle, avatar, browser or device never assigns a new signal. The existing algorithm and fixtures are preserved. The eight-character seed is a graphic identifier, not a certificate of globally unique ownership.

There is one profile space with PFP and Banner tabs. The PFP uses the connected account's avatar and fixed signature, with an adjustable 15–80% overlay (45% by default). It exports a lossless **4096 × 4096 PNG**. The matching banner exports a lossless **6000 × 2000 PNG**, preserving the 3:1 layout. The drawing is created directly at the export resolution; it is not an enlarged preview. The same composition, logo, curve, network and stroke proportions are maintained across preview and master sizes. An avatar error keeps the verified banner available and locks PFP export. There is no anonymous generator, random visitor seed, manual avatar upload or seed restoration field. URL parameters and old browser storage cannot change the account signature.

The authenticated avatar route first tries the original X CDN image, then the signed session's image and its normal-size fallback when needed. The allowed hosts, account header, read-only scope and signed-cookie checks are unchanged. The avatar's real source detail limits the photographic part of a PFP; increasing the output dimensions does not invent missing portrait detail. The signal and typography are redrawn in native pixels. Previews use up to 2× display density, with a 1440-square or 3000 × 1000 ceiling, and do not allocate the full master until download. The temporary PFP layer and profile export canvas are released after use, including cancellation or failure.

**Your signal, with sound** creates a personal five-second **1920 × 1080 MP4 at 30 fps**, with the verified @handle, fixed seed, minimal trace animation and that account's own composed sound. The server derives the seed from the signed numeric ID; the request accepts only the Midnight or Paper palette. The moving point and restrained note marks follow the same eight-note score as the audio. H.264 High Profile, YUV 4:2:0, closed GOP and mono AAC-LC at 44.1 kHz / 128 kbps make the image and sound one actual video file. No microphone, screen capture, uploaded media or anonymous seed is used. The signal and typography are drawn at the final resolution.

After creation, play the video with its controls, **Share video** through the native file share menu and choose X, or **Download MP4**. File sharing passes the personal MP4 and a suggested caption. The user reviews the post in X. Some browsers require a second **Choose X** gesture after session verification. If file sharing is unavailable, the same MP4 downloads and an X draft link explicitly asks the user to attach it; that link cannot attach the file itself. Cancelling the share menu leaves the video ready and does not download it. No X posting scopes or API publishing have been added.

Still-image **3840 × 2160 PNG** and five-second, mono 16-bit **44.1 kHz WAV** exports remain under **Still image & separate audio**. Every image export, WAV export, playback, MP4 download and sharing attempt verifies the signed server session. A prepared native-share gesture is valid for at most ten seconds after verification. Logout or expiry clears the account and video previews, stops playback, revokes the video URL, aborts pending rendering and locks every export. Account headers and seed checks prevent another account's MP4 from becoming shareable. A palette change discards the previous prepared video. There is no restorable seed override in the invitation link.

The X-ID fixture `1847291056384729103` always gives seed `4A6445B3` (λ-4A64). Existing graphic fixture `7F2A91C4` (λ-7F2A) remains an internal engine test, not a visitor generator.

Run offline regression checks without real secrets or network access:

```sh
node signature-check.js
node x-oauth-check.js
node avatar-check.js
node identity-check.js
node studio-check.js
node film-check.js
node filament-check.js
node navigation-check.js
```

`profile-engine.js` holds the profile artwork drawing; `signature.js` owns the verified-account state and unified preview; `studio.js` and `film.js` consume that same state. `studio-engine.js` owns the static card, frame drawing and unchanged audio samples. Hidden secondary cards are drawn only when opened. No animation runs behind the closed edition panel, and MP4 playback starts only on request.

## Required X sign-in

Use a Vercel deployment at the domain root for the `api/x` routes. GitHub Pages and a simple static local server can show the editorial site, but cannot complete OAuth or create a personal signal. A missing server configuration locks generation instead of falling back to a visitor seed.

In the X developer console, use OAuth 2.0 user authentication, a confidential Web App, and read-only permissions. Register the exact callback `https://<your-domain>/api/x/callback` and website `https://<your-domain>`.

Set the following Vercel variables for Production (and Preview when used), then redeploy. Keep their values outside the repository.

| Name | Value |
| --- | --- |
| `X_CLIENT_ID` | OAuth 2.0 Client ID |
| `X_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `X_REDIRECT_URI` | The exact registered callback URL |
| `APOT_SESSION_SECRET` | A long random signing secret |

Only `users.read tweet.read` are requested. No posting, follows, DMs or wallet access. The access token is used during the callback and is not stored. A signed HttpOnly cookie remembers the verified numeric ID, handle and avatar for 12 hours. The session endpoint derives the fixed seed from that signed ID and includes its expiry. The avatar endpoint identifies the verified account in `X-APOT-Account` so another account's image cannot be mixed in. A legacy cookie without a numeric ID is signed out. Session expiry does not change the permanent ID-to-signal mapping.

On the deployed site: **Connect with X** → preview **PFP / Banner** → adjust **PFP overlay** → download. **Disconnect** ends the session and clears all editions. Connect with the same account in another browser to confirm the same seed and shape return.

For sharing with sound: **Your signal, with sound** → **Create my signal video** → preview → **Share video** → choose X and review the video post. Mobile file handoff depends on the browser and the installed app's share support; the download-and-attach fallback remains available on desktop.

### MP4 renderer

`api/x/film.js` accepts a same-origin JSON POST containing only `tone`, requires the signed X session and matching account header, and derives all image and audio parameters on the server. `lib/signal-film.js` uses `@napi-rs/canvas` 0.1.100 and `@ffmpeg-installer/ffmpeg` 1.1.0. `npm install` supplies the native renderer and the platform encoder; no new environment variable is required. `vercel.json` includes the fonts and Linux binaries for this function and allows a 60-second invocation; the renderer has its own 45-second termination timer. Completed MP4s are capped at 4 MB for the function response.

A bounded, private warm-instance cache keeps at most six account/handle/palette results for five minutes; it does not create a public media URL or a durable archive. Each instance allows at most two simultaneous renders and one per account. These limits are per instance, not a distributed quota. Temporary WAV/MP4 files and drawing surfaces are released on completion, cancellation or failure. The signed session is checked again before the response. Native output was inspected with two offline accounts: 1920 × 1080, 150 frames, five seconds, H.264 High / AAC-LC; decoding the soundtrack reproduces the correct account motif with correlation above 0.99999. OAuth and posting through the real mobile X app still need a connected-device check.

For the native integration check, install the pinned packages with `npm ci` and have `ffprobe` and `ffmpeg` on PATH, then run `node film-render-check.js`. It exercises the packaged production encoder, checks the MP4 tracks, dimensions, duration, actual motion and soundtrack correlation for two accounts, and cleans its temporary fixture files.

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

Static HTML, CSS and JavaScript with Vercel serverless X routes serve the complete site at https://www.apot.world/. GitHub Pages can serve an editorial-only mirror from `main` at https://enudimmud.github.io/APOT/. A pull request is not what Pages publishes. To preview a branch, check it out and run `python3 -m http.server` from the repository root. Relative paths match the `/APOT/` base. The frontend has no build step; Vercel installs the dependencies for MP4 rendering. `signal.js` contains the original Canvas 2D projection; `script.js` handles navigation, scroll composition, the film and the archive. Fonts are self-hosted under their existing SIL OFL licenses. No wallet connection, transaction or analytics. X OAuth is required for personal signal generation. YouTube is loaded only on request. The film uses an original typographic editorial cover, so the page does not depend on a third-party thumbnail. The fixed navigation keeps the token accessible throughout the page.

Use relative paths to preserve compatibility with the /APOT/ base path. Keep `.nojekyll` in the root. The four photographic studies are the responsive `assets/study-*.webp` files. Native generated PNG sources are preserved in `assets/masters`; actual dimensions are recorded in `assets/media-manifest.json`. The token specimen is vector artwork. Photographic sources are 1672 or 1536 pixels wide, not 4K. See `ART_DIRECTION.md` for the current visual canon and `CREATIVE_GRAMMAR.md` for the implicit cultural motifs, the new image's production spec and the next shot plans.

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
