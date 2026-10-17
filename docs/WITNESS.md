# WITNESS of the day on apot.world

The homepage block `TODAY / THE WITNESS` reads `/witness.json`. If the file is `null`, empty, or invalid, the block stays hidden. The site never shows example text.

## Format

```json
{ "number": 3, "date": "2026-10-18", "text": "First sentence. Second sentence in gold.", "x_url": "https://x.com/APOTsignal/status/1234567890" }
```

An array of these objects also works. The highest `number` is shown. `x_url` must be a `https://x.com/APOTsignal/status/<id>` link.

## Morning routine

1. JD publishes the WITNESS on X himself. The agent never posts.
2. The agent opens a PR that updates `witness.json` with the published text and the real post URL. The PR title starts with `WITNESS #NNN`.
3. JD merges, and Vercel deploys. Nothing goes live before he merges.

# Live on-chain facts

`/api/onchain` reads Solana mainnet: mint and freeze authority, the creator wallet share and the wallets holding $APOT. The response is cached by the CDN for 5 minutes. The API returns no price, market cap or volume. Set `SOLANA_RPC_URL` in Vercel for a dedicated RPC. The public RPC is the fallback, and the Jupiter lite API is a secondary source for the holder count. If the read fails, the page shows "Live data unavailable — check on Solscan".
