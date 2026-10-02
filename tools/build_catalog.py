#!/usr/bin/env python3
"""Build data/catalog.js for Kafla from the Apple Music (iTunes) catalog and Wikipedia.

Run from the kafla folder:   python3 tools/build_catalog.py
Re-running is cheap: raw API answers are cached in tools/cache/.
  python3 tools/build_catalog.py --refresh   fetches new songs and releases for every artist (~15 min)
Delete one artist's files in tools/cache/ to refetch everything for them.

Input:  tools/artists.json   [{id, name, group, itunes?(artist id override), wiki?(page title override)}]
Output: data/catalog.js      window.CATALOG = {built, artists:[...]}
        images/artists/<id>.jpg
"""
import json, os, re, sys, time, unicodedata
from datetime import date
import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "tools", "cache")
IMG = os.path.join(ROOT, "images", "artists")
os.makedirs(CACHE, exist_ok=True)
os.makedirs(IMG, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36"}
COUNTRY = "in"
S = requests.Session()
S.headers.update(UA)
_last = [0.0]


def get(url, params=None, kind="json", tries=4):
    for i in range(tries):
        if "itunes.apple.com" in url:  # stay under ~20 requests/minute
            wait = 3.2 - (time.time() - _last[0])
            if wait > 0:
                time.sleep(wait)
            _last[0] = time.time()
        try:
            r = S.get(url, params=params, timeout=30)
            if r.status_code == 200:
                return r.json() if kind == "json" else (r.text if kind == "text" else r.content)
            if r.status_code == 404:
                return None
        except (requests.RequestException, ValueError):
            pass
        time.sleep(10 * (i + 1))
    return None


def cached(name, fn):
    p = os.path.join(CACHE, name)
    if os.path.exists(p):
        with open(p) as f:
            return json.load(f)
    v = fn()
    if v is not None:
        with open(p, "w") as f:
            json.dump(v, f)
    return v


def norm(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", s)


def find_artist(a):
    if a.get("itunes"):
        return a["itunes"]
    res = get("https://itunes.apple.com/search", {"term": a["name"], "entity": "musicArtist", "country": COUNTRY, "limit": 10})
    for r in (res or {}).get("results", []):
        if norm(r["artistName"]) == norm(a["name"]):
            return r["artistId"]
    return None


CLEAN = [r"\s*-\s*(Single|EP)$", r"\s*\((From|feat\.?|ft\.?|with)\b[^)]*\)", r"\s*\[(From|feat\.?)[^\]]*\]"]


JUNK = re.compile(r"sped[ -]?up|slowed|reverb|lo-?fi|chill trap|party mix|\b8d\b|instrumental|karaoke|remix|\bmashup|nightcore|bass boosted|\bcover\b|\blive\b|acoustic version|dj mix|\bjukebox", re.I)


def clean_title(t):
    for p in CLEAN:
        t = re.sub(p, "", t, flags=re.I)
    return t.strip()


def art(url, size=600):
    return re.sub(r"/\d+x\d+bb\.(jpg|png)$", f"/{size}x{size}bb.jpg", url or "")


def apple_photo(aid):
    html = get(f"https://music.apple.com/{COUNTRY}/artist/{aid}", kind="text")
    m = re.search(r'property="og:image" content="([^"]+)"', html or "")
    if not m or "AMCArtistImages" not in m.group(1) and "Features" not in m.group(1):
        return None  # Apple shows a generic logo when the artist has no photo
    return re.sub(r"/\d+x\d+\w*\.(png|jpg)$", "/800x800cc.jpg", m.group(1))


def wiki(a):
    keys = ("singer", "rapper", "musician", "songwriter", "composer", "music", "vocalist", "lyricist")
    titles = [a["wiki"]] if a.get("wiki") else [a["name"], a["name"] + " (singer)", a["name"] + " (rapper)", a["name"] + " (musician)"]
    for t in titles:
        d = get("https://en.wikipedia.org/api/rest_v1/page/summary/" + requests.utils.quote(t.replace(" ", "_")))
        if not d or d.get("type") != "standard":
            continue
        ex = d.get("extract", "")
        if any(k in ex.lower() for k in keys):
            return {"text": ex, "url": d["content_urls"]["desktop"]["page"],
                    "img": (d.get("originalimage") or {}).get("source"), "qid": d.get("wikibase_item")}
    return None


def deezer_photo(name):
    d = get("https://api.deezer.com/search/artist", {"q": name, "limit": 15}) or {}
    m = [x for x in d.get("data", []) if norm(x["name"]) == norm(name) and x.get("nb_fan", 0) >= 20]
    if not m:
        return None
    u = max(m, key=lambda x: x["nb_fan"]).get("picture_xl", "")
    return None if "/artist//" in u else u.replace("1000x1000", "800x800")


WD_UA = {"User-Agent": "KaflaFanSite/1.0 (personal, non-commercial; python-requests)"}
MUSIC_WORDS = ("singer", "rapper", "musician", "songwriter", "composer", "vocalist", "lyricist", "music")


def wd_find(a, wk):
    if a.get("wd"):
        return a["wd"]
    if wk.get("qid"):
        return wk["qid"]
    if wk.get("url"):  # bios cached before Wikidata ids were stored
        d = get("https://en.wikipedia.org/api/rest_v1/page/summary/" + wk["url"].rsplit("/", 1)[1])
        if d and d.get("wikibase_item"):
            return d["wikibase_item"]
    time.sleep(0.6)
    r = S.get("https://www.wikidata.org/w/api.php", params={"action": "wbsearchentities", "search": a["name"], "language": "en", "type": "item", "limit": 10, "format": "json"}, headers=WD_UA, timeout=30)
    r.raise_for_status()
    for e in r.json().get("search", []):
        desc = (e.get("description") or "").lower()
        if any(w in desc for w in MUSIC_WORDS) and any(w in desc for w in ("punjabi", "indian", "pakistani", "canadian", "british", "sikh", "bhangra")):
            return e["id"]
    return None


def wd_entities(ids):
    out = {}
    ids = sorted({i for i in ids if i})
    for k in range(0, len(ids), 50):
        for attempt in range(5):
            try:
                r = S.get("https://www.wikidata.org/w/api.php", params={"action": "wbgetentities", "ids": "|".join(ids[k:k+50]), "props": "claims|labels|descriptions", "languages": "en", "format": "json"}, headers=WD_UA, timeout=60)
                out.update({q: e for q, e in r.json().get("entities", {}).items() if "missing" not in e})
                break
            except (requests.RequestException, ValueError):
                print(f"  wikidata busy (HTTP {getattr(r, 'status_code', '?')}), retrying…", flush=True)
                time.sleep(15 * (attempt + 1))
        time.sleep(1)
    return out


def claim(e, p, kind="id"):
    vals = []
    for c in e.get("claims", {}).get(p, []):
        v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
        if v is None or c.get("rank") == "deprecated":
            continue
        if kind == "id" and isinstance(v, dict) and "id" in v:
            vals.append(v["id"])
        elif kind == "time" and isinstance(v, dict) and "time" in v:
            t, prec = v["time"].lstrip("+"), v.get("precision", 11)
            vals.append(t[:10] if prec >= 11 else t[:7] if prec == 10 else t[:4])
        elif kind == "text":
            vals.append(v["text"] if isinstance(v, dict) and "text" in v else str(v))
    return vals


def label(ents, q):
    return ((ents.get(q) or {}).get("labels", {}).get("en") or {}).get("value")


def enrich(out, artists):
    """Add a profile (born, birthplace, birth name, died, active since, labels, genres, notable work) from Wikidata."""
    by = {a["id"]: a for a in artists}
    qids = cached("_qids.json", lambda: {})
    for r in out:
        if r["id"] not in qids:
            wk = json.load(open(os.path.join(CACHE, f"{r['id']}.wiki.json"))) if os.path.exists(os.path.join(CACHE, f"{r['id']}.wiki.json")) else {}
            try:
                qids[r["id"]] = wd_find(by[r["id"]], wk or {})
            except (requests.RequestException, ValueError):
                time.sleep(5)
                continue  # try again on the next build
            json.dump(qids, open(os.path.join(CACHE, "_qids.json"), "w"))
    ents = cached("_wd_people.json", lambda: wd_entities(qids.values()))
    missing = [q for q in qids.values() if q and q not in ents]
    if missing:
        ents.update(wd_entities(missing))
        json.dump(ents, open(os.path.join(CACHE, "_wd_people.json"), "w"))
    refs = set()
    for q in qids.values():
        e = ents.get(q) or {}
        for p in ("P19", "P20", "P264", "P136", "P800", "P27", "P21"):
            refs.update(claim(e, p))
    lab = cached("_wd_labels.json", lambda: {})
    need = [q for q in refs if q not in lab]
    if need:
        got = wd_entities(need)
        for q, e in got.items():
            lab[q] = {"l": label(got, q), "in": claim(e, "P131")[:1], "c": claim(e, "P17")[:1]}
        json.dump(lab, open(os.path.join(CACHE, "_wd_labels.json"), "w"))
    for _ in range(6):  # walk up "located in" so we can find the district and state
        parents = {x for v in lab.values() for x in v.get("in", []) + v.get("c", []) if x not in lab}
        if not parents:
            break
        got = wd_entities(parents)
        for q, e in got.items():
            lab[q] = {"l": label(got, q), "in": claim(e, "P131")[:1], "c": claim(e, "P17")[:1]}
        for q in parents - set(got):
            lab[q] = {"l": None, "in": [], "c": []}
        json.dump(lab, open(os.path.join(CACHE, "_wd_labels.json"), "w"))
    L = lambda q: (lab.get(q) or {}).get("l")

    STATES = {"Punjab", "Haryana", "Delhi", "Chandigarh", "Himachal Pradesh", "Rajasthan", "Uttar Pradesh", "Bihar", "Jammu and Kashmir",
              "Maharashtra", "Sindh", "Ontario", "British Columbia", "Alberta", "England", "California", "New York", "South Holland", "Islamabad Capital Territory"}

    def place(q):
        name = L(q) if q else None
        if not name or name in ("Punjab", "India", "Pakistan", "Punjab, India", "Punjab, Pakistan"):
            return None  # too vague to be useful
        chain, cur = [], q
        for _ in range(8):
            nxt = (lab.get(cur) or {}).get("in", [])
            if not nxt or nxt[0] in chain:
                break
            cur = nxt[0]
            chain.append(cur)
        labels = [L(x) for x in chain if L(x)]
        district = name if re.search(r"district", name, re.I) else next((x for x in labels if re.search(r"\bdistrict\b", x, re.I)), None)
        state = next((x for x in labels if x in STATES), None)
        if not state and name in STATES:
            state = None
        country = L(((lab.get(q) or {}).get("c") or [None])[0]) or next((L((lab.get(x) or {}).get("c", [None])[0]) for x in chain if (lab.get(x) or {}).get("c")), None)
        parts = []
        for x in (name, district, state, country):
            if x and x not in parts and not re.search(r"block|tehsil|division|subdivision|county of holland", x, re.I):
                parts.append(re.sub(r" District$", " district", x))
        return ", ".join(parts)

    for r in out:
        q = qids.get(r["id"])
        e = ents.get(q) or {}
        if not e:
            continue
        born, died = claim(e, "P569", "time")[:1], claim(e, "P570", "time")[:1]
        prof = {"qid": q,
                "born": born[0] if born else None, "died": died[0] if died else None,
                "birthplace": place((claim(e, "P19") or [None])[0]),
                "birthname": (claim(e, "P1477", "text") or [None])[0],
                "active": (claim(e, "P2031", "time") or [None])[0],
                "labels": [L(x) for x in claim(e, "P264") if L(x)][:4],
                "genres": [L(x) for x in claim(e, "P136") if L(x)][:5],
                "notable": [L(x) for x in claim(e, "P800") if L(x)][:3],
                "gender": {"Q6581072": "f", "Q6581097": "m"}.get((claim(e, "P21") or [""])[0]),
                "desc": ((e.get("descriptions") or {}).get("en") or {}).get("value")}
        r["profile"] = {k: v for k, v in prof.items() if v}
        if prof["gender"] == "f":
            r["f"] = True
        if r["group"] == "auto" and ((prof["born"] and prof["born"][:4] < "1970") or (prof["died"] and prof["died"][:4] < "2015")):
            r["group"] = "legend"
    for r in out:
        if r["group"] == "auto":
            r["group"] = "pop"


def download(url, path):
    if os.path.exists(path):
        return True
    b = get(url, kind="bytes")
    if not b or len(b) < 3000:
        return False
    with open(path, "wb") as f:
        f.write(b)
    return True


def build(a, names):
    if os.environ.get("KAFLA_OFFLINE") and not os.path.exists(os.path.join(CACHE, f"{a['id']}.wiki.json")):
        return None  # offline mode: only use artists already in the cache
    aid = cached(f"{a['id']}.id.json", lambda: find_artist(a))
    if not aid:
        print(f"  !! {a['name']}: not found on Apple Music")
        return None
    songs = cached(f"{a['id']}.songs.json", lambda: get("https://itunes.apple.com/lookup", {"id": aid, "entity": "song", "country": COUNTRY, "limit": 60, "sort": "popular"}))
    albums = cached(f"{a['id']}.albums.json", lambda: get("https://itunes.apple.com/lookup", {"id": aid, "entity": "album", "country": COUNTRY, "limit": 200}))
    photo = cached(f"{a['id']}.photo.json", lambda: {"u": apple_photo(aid)})
    wk = cached(f"{a['id']}.wiki.json", lambda: wiki(a) or {})

    top, seen = [], set()
    for s in (songs or {}).get("results", [])[1:]:
        if s.get("wrapperType") != "track" or not s.get("previewUrl") or JUNK.search(s["trackName"]) or JUNK.search(s.get("collectionName", "")):
            continue
        key = norm(clean_title(s["trackName"]))
        if key in seen:
            continue
        seen.add(key)
        top.append({"t": clean_title(s["trackName"]), "full": s["trackName"], "by": s["artistName"],
                    "alb": clean_title(s.get("collectionName", "")), "c": s.get("collectionId"), "id": s["trackId"],
                    "art": art(s.get("artworkUrl100"), 300), "p": s["previewUrl"], "ms": s.get("trackTimeMillis", 0),
                    "d": s.get("releaseDate", "")[:10], "x": s.get("trackExplicitness") == "explicit"})
        if len(top) >= 15:
            break

    al, seen = [], {}
    for c in (albums or {}).get("results", [])[1:]:
        if c.get("wrapperType") != "collection":
            continue
        name = c["collectionName"]
        if JUNK.search(name):
            continue
        n = c.get("trackCount", 1)
        k = "Single" if re.search(r"-\s*Single$", name) or n <= 2 else "EP" if re.search(r"-\s*EP$", name) or n <= 6 else "Album"
        t = clean_title(name)
        key = norm(t)
        item = {"t": t, "k": k, "d": c.get("releaseDate", "")[:10], "n": n, "id": c["collectionId"],
                "art": art(c.get("artworkUrl100")), "by": c.get("artistName", ""), "x": c.get("collectionExplicitness") == "explicit"}
        if key in seen:  # keep the explicit/original edition, drop duplicates
            continue
        seen[key] = True
        al.append(item)
    al.sort(key=lambda x: x["d"], reverse=True)

    if a.get("found") and len(top) < 3:
        print(f"  -- {a['name']}: only {len(top)} songs on Apple Music, skipped")
        return None
    img = None
    dz = cached(f"{a['id']}.deezer.json", lambda: {"u": deezer_photo(a["name"])}) if not (photo or {}).get("u") and not wk.get("img") else {}
    for src in (photo or {}).get("u"), wk.get("img"), (dz or {}).get("u"):
        if src and download(src, os.path.join(IMG, f"{a['id']}.jpg")):
            img = f"images/artists/{a['id']}.jpg"
            break

    # collaborators already on Kafla (from credits on their songs and releases)
    me = norm(a["name"])
    credits = " | ".join([s["by"] + " " + s["full"] for s in top] + [x["by"] + " " + x["t"] for x in al]).lower()
    collabs = [o for o, n in names.items() if o != a["id"] and len(n) > 3 and re.search(r"(^|[^a-z])" + re.escape(n) + r"([^a-z]|$)", credits)]

    years = [int(x["d"][:4]) for x in al if x["d"][:4].isdigit()]
    return {"id": a["id"], "name": a["name"], "group": a["group"], "am": aid,
            "photo": img, "wiki": {"text": wk["text"], "url": wk["url"]} if wk.get("text") else None,
            "since": min(years) if years else None,
            "top": top, "albums": [x for x in al if x["k"] != "Single"], "singles": [x for x in al if x["k"] == "Single"][:30],
            "collabs": collabs, **({"f": True} if a.get("f") else {})}


def main():
    with open(os.path.join(ROOT, "tools", "artists.json")) as f:
        artists = json.load(f)
    if "--refresh" in sys.argv:  # re-fetch songs and releases (keeps artist ids, photos and bios)
        for f in os.listdir(CACHE):
            if f.endswith((".songs.json", ".albums.json")):
                os.remove(os.path.join(CACHE, f))
    names = {a["id"]: a["name"].lower() for a in artists}
    out = []
    for i, a in enumerate(artists):
        print(f"[{i+1}/{len(artists)}] {a['name']}", flush=True)
        r = build(a, names)
        if r:
            out.append(r)
            print(f"     photo={'yes' if r['photo'] else 'NO'} wiki={'yes' if r['wiki'] else 'no'} top={len(r['top'])} albums={len(r['albums'])} singles={len(r['singles'])} | {', '.join(s['t'] for s in r['top'][:3])}", flush=True)
    print("Adding profiles from Wikidata…", flush=True)
    try:
        enrich(out, artists)
    except Exception as e:  # never lose a whole build over the profile step
        print("  !! Wikidata step failed:", e)
        for r in out:
            if r["group"] == "auto":
                r["group"] = "pop"
    with open(os.path.join(ROOT, "data", "catalog.js"), "w") as f:
        f.write("/* Generated by tools/build_catalog.py from the Apple Music catalog, Wikipedia and Wikidata. Do not edit by hand. */\n")
        f.write("window.CATALOG=")
        json.dump({"built": date.today().isoformat(), "artists": out}, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"Done: {len(out)} artists -> data/catalog.js")


if __name__ == "__main__":
    main()
