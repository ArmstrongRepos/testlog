# Armstrong Test Log: installable app

A tiny installable web app (app manifest, offline screen, Armstrong-blue icon) that opens the
Google Apps Script test log full screen, with no address bar. Works on Android and iPhone.

## Put it online (GitHub Pages, free, ~10 minutes)

1. **Update the script first.** Paste the new `Code.gs` into Apps Script, then
   Deploy → Manage deployments → edit → New version → Deploy. (It now allows the log to open inside this app.)
2. Sign in at **github.com** (or create a free account).
3. Top right **+** → **New repository** → name it `testlog` → **Public** → **Create repository**.
4. On the new repo page click **uploading an existing file**. Unzip `armstrong-test-log-app.zip` and drag
   **everything inside it** (including the `icons` folder) into the page → **Commit changes**.
5. **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/ (root)** → **Save**.
6. After a minute the page shows your link: `https://<your-username>.github.io/testlog/`.
7. Optional: point the TinyURL at that link so everyone gets the app version.

## Install on a phone

- **Android (Chrome):** open the link → a banner offers **Install**, or ⋮ → **Add to Home screen** → **Install**.
- **iPhone (Safari):** Share → **Add to Home Screen** → Add.

It opens like a normal app with the Armstrong icon. Riders will need to type their name once more in
the installed app (it's stored separately from the browser).

## Changing things later

- **Your own logo:** replace the PNGs in `icons/` with your artwork at the same names and sizes
  (192×192, 512×512, maskable 512×512 with the logo inside the middle 70%, 180×180, 48×48).
- **New Apps Script URL:** edit `APP_URL` near the bottom of `index.html`.
- After changing files, bump `CACHE` in `sw.js` (e.g. `-v2`) so phones pick up the new version.
