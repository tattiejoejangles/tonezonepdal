# Drop your licensed Trade Gothic Next files here

Trade Gothic Next is a commercial Linotype/Monotype typeface, so it can't be
bundled or downloaded automatically. Once you've licensed it for web use, put
the webfont files in this folder with these exact names and the site picks
them up with no code changes:

```
public/fonts/TradeGothicNext-Bold.woff2
public/fonts/TradeGothicNext-Bold.woff        (optional fallback)
public/fonts/TradeGothicNext-Regular.woff2    (optional)
public/fonts/TradeGothicNext-Light.woff2      (optional — used for body copy)
```

The `@font-face` rules are already declared in `src/app/globals.css`.

Until those files exist the browser falls through to **Archivo**, a free
grotesque with similar proportions, so the layout and hierarchy stay correct
either way. Nothing breaks while the folder is empty — `font-display: swap`
means missing files are simply skipped.

If your licence gives you differently named files, either rename them to match
the list above or edit the `src:` URLs in `globals.css`.
