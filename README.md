# PowerLedger — klikbaar prototype

Twee klikpaden door hetzelfde product, bedoeld om aan Jan (elektricien) en Geert (beheerder)
te tonen. Geen build, geen server, geen afhankelijkheden: open `index.html` in een browser.

```
open prototype/index.html
```

## Structuur

| | |
|---|---|
| `index.html` | Startpagina met de twee klikpaden, waar je op mag letten, en de visuele richtingen |
| `styles.css` | De tokens uit `DESIGN.md` als echte CSS. Wijzig hier niets zonder de spine te wijzigen |
| `thema.js` | Zichtbare thema-omschakelaar — eis uit `EXPERIENCE.md § Accessibility Floor` |
| `qr.js` | Eigen, dependency-vrije QR-encoder (byte-modus, foutcorrectie M, versies 1–4) voor `bureau/qr-stickers.html` |
| `DEMODATA.md` | De verzonnen data. Elk scherm gebruikt exact deze feiten |
| `veld/` | Jans telefoon: aanmelden, uitnodiging, scannen, lezen, loggen (alle vier werkwoorden) |
| `bureau/` | Geerts desktop: overzicht, todo's, documenten (incl. document vervangen), toegang, QR-stickers, statuslegende |
| `richtingen/` | Vergelijkingspagina met drie visuele talen voor SVB-B — geen klikpad, geen productonderdeel |
| `media/` | Echte veldfoto's uit de imports van de UX-run |

## Bron

Gebouwd op `docs/planning-artifacts/ux-designs/ux-PowerLedger-2026-08-22/DESIGN.md` en
`EXPERIENCE.md` (beide `status: final`). **Wijkt het prototype af van die twee documenten,
dan hebben de documenten gelijk** — het prototype is een projectie, geen bron.

## Wat het niet is

Geen database, niets wordt opgeslagen, geen echte authenticatie. Namen, datums en nummers zijn
verzonnen; de foto's zijn echt. De grijze balk bovenaan elk scherm is demo-chroom.

`qr.js` is een minimale eigen encoder, geen volledige implementatie van de QR-standaard: alleen
byte-modus, alleen foutcorrectieniveau M, alleen versies 1–4 (genoeg voor de URL's in dit
prototype), en een vast maskerpatroon in plaats van de optimale keuze uit acht patronen. De
stickers zijn getest met `zbarimg` en scannen correct, maar dit is geen library om elders te
hergebruiken.
