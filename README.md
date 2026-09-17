# PowerLedger — klikbaar prototype

Twee klikpaden door hetzelfde product, bedoeld om aan Jan (elektricien) en Geert (beheerder)
te tonen. Geen build, geen server, geen afhankelijkheden: open `index.html` in een browser.

```
open prototype/index.html
```

## Structuur

| | |
|---|---|
| `index.html` | Startpagina met de twee klikpaden en waar je op mag letten |
| `styles.css` | De tokens uit `DESIGN.md` als echte CSS. Wijzig hier niets zonder de spine te wijzigen |
| `thema.js` | Zichtbare thema-omschakelaar — eis uit `EXPERIENCE.md § Accessibility Floor` |
| `DEMODATA.md` | De verzonnen data. Elk scherm gebruikt exact deze feiten |
| `veld/` | Jans telefoon: scannen, lezen, loggen |
| `bureau/` | Geerts desktop: overzicht, todo's, rapport, toegang |
| `media/` | Echte veldfoto's uit de imports van de UX-run |

## Bron

Gebouwd op `docs/planning-artifacts/ux-designs/ux-PowerLedger-2026-08-22/DESIGN.md` en
`EXPERIENCE.md` (beide `status: final`). **Wijkt het prototype af van die twee documenten,
dan hebben de documenten gelijk** — het prototype is een projectie, geen bron.

## Wat het niet is

Geen database, niets wordt opgeslagen, geen echte authenticatie. Namen, datums en nummers zijn
verzonnen; de foto's zijn echt. De grijze balk bovenaan elk scherm is demo-chroom.
