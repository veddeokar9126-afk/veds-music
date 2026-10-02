# Kafla: project brief for Claude

Read this first. It summarizes everything decided so far, so you can continue without the chat history.

## What this is
The site is branded **Ved's Music** (renamed from "Kafla" on 2 Oct 2026; code, folder and localStorage keys still say kafla). Logo = the real Punjab state outline (GADM boundary, simplified) in the orange gradient with a white music note; the same outline sits very faintly behind every page (`.bgmap` in index.html/style.css).

It is a fan website for Punjabi music, built by Ved. It should look and feel like a top streaming platform (Apple Music, YouTube Music, Spotify), not like a local or hobby website.

## Ved's preferences (follow these)
- Everything in English. No Gurmukhi text anywhere.
- White (light) background by default, with a dark mode toggle.
- Wants "all" Punjabi artists: new school first, with legends in their own section.
- Do things yourself (e.g. fetch artist photos) rather than telling him to save files.
- Polished, app-like design: sidebar on desktop, bottom tab bar + mini player on mobile.
- He runs it on Fedora Linux: `./start-linux.sh` (or `python3 -m http.server 8000` in this folder), then http://localhost:8000.

## Files
- `index.html` – page shell only (sidebar, top bar, player containers). Loads the files below. No build step for the site, no frameworks.
- `css/style.css` – all styles. Colour tokens on `:root`, dark theme on `[data-theme="dark"]`.
- `js/app.js` – the whole app: hash router, views, player, search, quiz, crew stats.
- `data/catalog.js` – GENERATED, do not hand-edit. `window.CATALOG = {built, artists:[...]}`.
- `data/curated.js` – hand-written: extra bios/lines/tags for the original 8 artists, Sidhu's legacy section, curated playlists, producers, quiz.
- `tools/artists.json` – the artist list (id, name, group: hiphop | pop | rnb | folk | legend; optional `itunes` artist-id override and `wiki` page-title override).
- `tools/build_catalog.py` – builds `data/catalog.js` and downloads `images/artists/<id>.jpg`.
- `tools/cache/` – raw API answers; delete an artist's files there to refetch them.
- `backup/index-v1.html` – the old single-file version of the site.

## Data pipeline
`python3 tools/build_catalog.py` (takes ~20 min for ~107 artists because of the Apple rate limit; cached re-runs take seconds; `KAFLA_OFFLINE=1` builds from cache only):
- Apple Music / iTunes Search API (country `in`): artist id, top songs sorted by popularity (with 30-second preview URLs), full discography (albums/EPs/singles with release dates and cover art). Re-upload junk (sped up, slowed, lofi, remixes…) is filtered by the `JUNK` regex.
- Artist photo: the og:image from the artist's Apple Music page (800×800), falling back to the Wikipedia lead image.
- Bio: Wikipedia summary (shown with a CC BY-SA attribution link). Curated bios in `curated.js` take priority.
- `collabs`: other Kafla artists credited on their songs/releases (used for "Fans also like").
To add an artist: add a line to `tools/artists.json`, run the build. If the wrong artist is matched (same name), set `"itunes": <artistId>` for that entry and delete its files in `tools/cache/`.

## Features (js/app.js)
- Routes: `#/charts` (live iTunes Store Punjabi chart, genre 100045, India; songs + albums), `#/library[/liked|recent|artists]`, `#/` home, `#/new`, `#/artists[/group]`, `#/artist/<id>`, `#/album/<appleCollectionId>`, `#/playlist/<id>`, `#/playlists`, `#/search[/term]`, `#/quiz`, `#/crew`.
- Player bar plays 30-second Apple Music previews: queue, shuffle, repeat, seek, volume, Media Session (keyboard media keys), full-screen "now playing", "Full song" link to YouTube Music. Space = play/pause, `/` = search.
- Album pages load the tracklist live from the iTunes lookup API.
- Playlists: curated (`curated.js`), genre mixes (`MIXES` in app.js, built from catalog top songs), and auto "This Is <artist>" for every artist. Curated songs not in an artist's top songs are looked up live on iTunes; if not on Apple Music in India at all, the row opens YouTube Music instead.
- Search: local catalog + live iTunes song search.
- Follow artists (stored in localStorage, shown in the sidebar).
- Quiz (original 8 artists). Crew stats parses Google Takeout / Apple CSV history in the browser; leaderboard only works on the claude.ai artifact version (`window.claude.use("db")`).

- Library (localStorage, this device only): liked songs (`kafla-liked`, heart on every song row / player / L key), recently played (`kafla-recent`), "Jump back in" contexts (`kafla-ctx`).
- Design identity (deliberately not Apple Music): Bricolage Grotesque display font, home "Spotlight" bento (1 big + 2 small new releases) instead of a carousel, ranked chart rows with outlined numbers, orange accent bar before section titles, page/player tints from the cover art's colour (`artColor()` reads mzstatic art via canvas; CORS is allowed).
- Keyboard: Space, ←/→ seek 5 s, Shift+←/→ prev/next, L like, M mute, Q queue, F full screen, / search, ? shortcuts window.

## Accuracy rules
- Catalog facts (songs, releases, dates, covers) come straight from Apple Music; bios from Wikipedia or hand-checked text. Do not invent discography, dates or chart claims; verify anything new before adding it to `curated.js`.
- Never put song lyrics on the site (copyright).
- Artist photos and cover art belong to their owners. Ved chose (2 Oct 2026) to host the site publicly on GitHub Pages anyway, photos included: https://veddeokar9126-afk.github.io/veds-music/ (repo veddeokar9126-afk/veds-music, public, branch main, Pages from the repo root). Every push to main redeploys it in about a minute. Commits use his GitHub noreply email, never his Gmail.

## Ideas not done yet
- Quiz only covers the original 8 artists.
- Lyrics/credits pages, charts by real play counts, a shared leaderboard locally (needs a backend like Supabase/Firebase — discuss with Ved first).
