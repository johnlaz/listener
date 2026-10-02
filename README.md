# Listener Pro AI — Groq Edition

Real-time AI conversational support. Free to use with your own Groq API key.

- **Site:** https://johnlaz.github.io/listener/
- **App (PWA):** https://johnlaz.github.io/listener/app/
- **Android APK:** https://johnlaz.github.io/listener/app/lpai.apk

## Layout

```
/              landing page (index.html)
/app/          the PWA: index.html, manifest.json, sw.js, icons, lpai.apk
```

The service worker lives at `/app/sw.js` with scope `/listener/app/`, so it controls only the app and never the landing page. See `app/README.md` for app details.
