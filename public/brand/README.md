# Hisab On Tip brand assets

| File | Use |
|------|-----|
| `../logo-mark.svg` | Favicon source, WhatsApp profile (export PNG), app icon |
| `../logo.svg` | Landing page, README, presentations |
| `../logo-mark-512.png` | WhatsApp Business profile photo (640×640 recommended) |
| `../../docs/readme-banner.svg` | GitHub README header |

## WhatsApp profile photo

1. Upload **`public/logo-mark-512.png`** in [WhatsApp Manager](https://business.facebook.com/wa/manage/home/) → Phone numbers → Profile → Photo.
2. Test numbers often **cannot** change profile — use your own business number in production.

## Design meaning

- **Teal** — calm, trustworthy money tracking (not loud fintech red).
- **Ledger lines** — kharcha entries, one message at a time.
- **Green Rs coin** — Pakistan + WhatsApp-adjacent green (savings / confirmed).
- **Rounded square** — reads like a modern app icon on phones and in browser tabs.

## Export your own PNG

If you edit the SVG, export 512×512 or 640×640 PNG for Meta / social:

```bash
npx --yes @resvg/resvg-js-cli public/logo-mark.svg public/logo-mark-512.png --fit-width 640 --fit-height 640
```