#!/usr/bin/env python3
"""Find more Punjabi artists and add them to tools/artists.json.

Sources (names only — everything is then checked against Apple Music):
  1. Apple Music's Punjabi / Punjabi Pop charts (top songs and albums, India)
  2. Artists featured on songs of artists already on Kafla (tools/cache/*.json)
  3. Wikidata: singers/rappers whose language is Punjabi
  4. EXTRA below: hand-added names (lots of women and lesser-known artists)
A candidate is kept only if Apple Music has an artist with exactly that name whose
main genre is Punjabi / Punjabi Pop (hand-added names may also be Hip-Hop, Folk, Pop…).

Run from the kafla folder:  python3 tools/discover.py      then  python3 tools/build_catalog.py
"""
import json, os, re, glob, collections
import requests
from build_catalog import get, cached, norm, ROOT, CACHE

ARTISTS_JSON = os.path.join(ROOT, "tools", "artists.json")

# (name, female?) — hand-added. Women first.
EXTRA = [
 ("Miss Pooja",1),("Mannat Noor",1),("Harshdeep Kaur",1),("Jyotica Tangri",1),("Asees Kaur",1),("Rupinder Handa",1),
 ("Anmol Gagan Maan",1),("Sweetaj Brar",1),("Ginni Mahi",1),("Shipra Goyal",1),("Nooran Sisters",1),("Sargi Maan",1),
 ("Sudesh Kumari",1),("Raashi Sood",1),("Hashmat Sultana",1),("Neha Bhasin",1),("Deepak Dhillon",1),("Amarjot",1),
 ("Jaspinder Narula",1),("Ranjit Kaur",1),("Parkash Kaur",1),("Narinder Biba",1),("Gulshan Komal",1),("Shazia Manzoor",1),
 ("Naseebo Lal",1),("Noor Jehan",1),("Reshma",1),("Satwinder Bitti",1),("Gurlej Akhtar",1),("Khushboo Grewal",1),
 ("Mahi",1),("Sunidhi Chauhan",0),
 ("Amrinder Gill",0),("Kulwinder Billa",0),("Roshan Prince",0),("Kamal Khan",0),("Pav Dharia",0),("Hardeep Grewal",0),
 ("Happy Raikoti",0),("Navv Inder",0),("Sabi Bhinder",0),("Lakhi Ghuman",0),("Raj Ranjodh",0),("Maninder Buttar",0),
 ("Zora Randhawa",0),("Kulshan Sandhu",0),("Preet Harpal",0),("Lakhwinder Wadali",0),("Wadali Brothers",0),("Nachhatar Gill",0),
 ("Feroz Khan",0),("Master Saleem",0),("Kamal Heer",0),("Debi Makhsoospuri",0),("Prabh Gill",0),("Raj Brar",0),("Nseeb",0),
 ("Sukshinder Shinda",0),("H-Dhami",0),("Juggy D",0),("Arif Lohar",0),("Kanth Kaler",0),("Karamjit Anmol",0),("Josh Brar",0),
 ("Parry Sidhu",0),("Riar Saab",0),("Bir Singh",0),("Rabbi Shergill",0),("Gurshabad",0),("Aman Hayer",0),("K.S. Makhan",0),
 ("Roach Killa",0),("Bups Saggu",0),("Ravinder Grewal",0),("Sangtar",0),("Veet Baljit",0),("Balwinder Safri",0),("Didar Sandhu",0),
 ("Mohammad Sadiq",0),("Hakam Sufi",0),("Pammi Bai",0),("Sarbjit Cheema",0),("Gurnazar",0),("Gurj Sidhu",0),("Ezu",0),
 ("The PropheC",0),("Prabh Deep",0),("Kahlon",0),("Harf Cheema",0),("Amar Sandhu",0),("Sukh Lotey",0),("Aatish",0),("Jordan Sandhu",0),
 ("Millind Gaba",0),("Harjit Harman",0),("Geeta Zaildar",0),("Sukhbir",0),("Arsh Maini",0),("Gupz Sehra",0),("Alfaaz",0),
 ("Kunwarr",0),("Anmol Kang",0),("Rav Hanjra",0),("Nimma Loharka",0),("Guri",0),("Mankirt Aulakh",0),("Sandhu Surjit",0),
 ("Simranjeet Singh",0),("Sarab",0),("Arjun",0),("Garry Sandhu",0),("Jassi Sohal",0),("Hukam",0),("Avkash Mann",0),("Hunar Sidhu",0),
 ("Love Brar",0),("Bunty Bains",0),("Jagga",0),("Nav Dolorain",0),("Jass Zaildar",0),("Gagan Kokri",0),("Gurpreet Maan",0),
 ("Sharan Shergill",0),("Arjan",0),("Yuvraj Hans",0),("Navraj Hans",0),("Master Saleem",0),("Kaler Kanth",0),("Sukhwinder Singh",0),
 ("Attaullah Khan Esakhelvi",0),("Nusrat Fateh Ali Khan",0),("Inderjit Nikku",0),("Kuldeep Manak",0),("Labh Janjua",0),
 ("Mika Singh",0),("Jasbir Jassi",0),("Bally Sagoo",0),("Apache Indian",0),("Stereo Nation",0),("Rishi Rich",0),("Garry Bhullar",0),
 ("Gur Chahal",0),("Khasa Aala Chahar",0),("Navjeet",0),("Jass Grewal",0),("Pavitar Lassoi",0),("Babbu",0),("Jagdeep Randhawa",0),
]

# Producers, composers, labels and devotional channels — not "artists" for Kafla
SKIP = {norm(x) for x in ("Ikky|MXRCI|JayB Singh|The Kidd|Snappy|Desi Crew|Intense|Byg Byrd|prodGK|Prod GK|Rxtro|YEAH PROOF|Mista Baaz|"
  "Jatinder Shah|Jaidev Kumar|Nadeem Shravan|Joy-Atul|Dr Zeus|Gaiphy|Mixsingh|Beat Minister|Nick Dhammu|Gold Boy|Goldboy|Avvy Sra|Manni Sandhu|"
  "Sez On The Beat|Jay Trak|Cheetah|Rana Brass|Happy Singh|Haakam|Harj Nagra|Proof|Gminxr|Iris Music|Speed Records|Various Artists|Apna Sangeet|"
  "Gurbani|Shashwat Sachdev|Beat Master|Matt Sheron|Kotti|R Guru|Starboy X|Dhruv Yogi|Tru-Skool|Sukh-E Muzical Doctorz|Muzical Doctorz|"
  "Narasimha Nayak|Atul Sharma|Ali Quli Mirza|Avishek Majumder|Nix-L|Mr Rubal|Byg Bird|Western Penduz|Gur Sidhu Music|"
  "Jassi X|Yeah Proof|Sanb|Mxrci|Bass Boi|Laddi Gill|Desi Routz|Preet Hundal|G Guri|Jaymeet|Tarsem Jassar Music").split("|")}
SKIP_WORDS = ["bhai ", "gurbani", "saint ", "ji ", "wale", "kirtan", "records", "music company", "orchestra"]
GOOD_GENRES = {"Punjabi", "Punjabi Pop"}
LOOSE_GENRES = GOOD_GENRES | {"Hip-Hop/Rap", "Indian Folk", "Indian Pop", "Regional Indian", "Pop", "Worldwide", "Folk", "Indian", "Sufi", "Qawwali", "Indian Classical", "R&B/Soul", "Dance", "Bollywood", "World"}


def split_credit(s):
    s = re.sub(r"\(.*?\)|\[.*?\]", "", s or "")
    return [p.strip() for p in re.split(r",|&| x | X |feat\.|ft\.| and ", s) if p.strip()]


def main():
    artists = json.load(open(ARTISTS_JSON))
    have = {norm(a["name"]) for a in artists}
    cand = collections.Counter()
    female = set()
    src = collections.defaultdict(set)

    # 1. Apple charts
    for g in (100045, 100033):
        for kind in ("topsongs", "topalbums"):
            d = get(f"https://itunes.apple.com/in/rss/{kind}/limit=200/genre={g}/json") or {}
            for e in d.get("feed", {}).get("entry", []):
                for n in split_credit(e["im:artist"]["label"]):
                    cand[n] += 2; src[n].add("chart")
    # 2. credits on Kafla artists' songs and releases
    for f in glob.glob(os.path.join(CACHE, "*.songs.json")) + glob.glob(os.path.join(CACHE, "*.albums.json")):
        for r in (json.load(open(f)) or {}).get("results", []):
            for n in split_credit(r.get("artistName")):
                cand[n] += 1; src[n].add("credit")
    # 3. Wikidata
    q = """SELECT DISTINCT ?pLabel ?g WHERE { { ?p wdt:P1412 wd:Q58635 } UNION { ?p wdt:P103 wd:Q58635 }
      ?p wdt:P31 wd:Q5; wdt:P106 ?o. VALUES ?o { wd:Q177220 wd:Q2252262 wd:Q488205 wd:Q639669 wd:Q753110 wd:Q855091 }
      OPTIONAL { ?p wdt:P21 ?g } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }"""
    wd = cached("_wikidata_punjabi_singers.json", lambda: requests.get("https://query.wikidata.org/sparql", params={"query": q, "format": "json"},
                headers={"User-Agent": "KaflaFanSite/1.0 (personal, non-commercial)"}, timeout=120).json())
    for b in wd["results"]["bindings"]:
        n = b["pLabel"]["value"]
        if re.match(r"Q\d+$", n):
            continue
        cand[n] += 2; src[n].add("wikidata")
        if b.get("g", {}).get("value", "").endswith("Q6581072"):
            female.add(norm(n))
    # 4. hand-added
    for n, f in EXTRA:
        cand[n] += 5; src[n].add("extra")
        if f:
            female.add(norm(n))

    todo = []
    for n, c in cand.items():
        k = norm(n)
        if not k or k in have or k in SKIP or len(k) < 3 or any(w in n.lower() + " " for w in SKIP_WORDS):
            continue
        if src[n] == {"credit"} and c < 2:
            continue  # one-off feature credits are usually producers or session singers
        todo.append(n)
    todo = sorted(set(todo), key=lambda n: -cand[n])
    print(f"{len(todo)} candidates to check on Apple Music")

    added = []
    seen = set(have)
    for i, n in enumerate(todo):
        k = norm(n)
        if k in seen:
            continue
        res = cached(f"_search_{k}.json", lambda: get("https://itunes.apple.com/search", {"term": n, "entity": "musicArtist", "country": "in", "limit": 10}))
        hit = next((r for r in (res or {}).get("results", []) if norm(r["artistName"]) == k), None)
        if not hit:
            continue
        genre = hit.get("primaryGenreName", "")
        ok = genre in GOOD_GENRES or ("extra" in src[n] and genre in LOOSE_GENRES) or ("wikidata" in src[n] and genre in LOOSE_GENRES and genre != "Bollywood")
        if not ok:
            continue
        seen.add(k)
        slug = re.sub(r"[^a-z0-9]", "", n.lower())[:18]
        while any(a["id"] == slug for a in artists + added):
            slug += "x"
        e = {"id": slug, "name": hit["artistName"], "group": "hiphop" if genre == "Hip-Hop/Rap" else "auto", "itunes": hit["artistId"], "found": sorted(src[n])}
        if k in female or re.search(r"\bkaur\b", n.lower()):
            e["f"] = True
        added.append(e)
        print(f"  + {hit['artistName']} ({genre}) via {', '.join(sorted(src[n]))}{' [f]' if e.get('f') else ''}", flush=True)

    artists += added
    json.dump(artists, open(ARTISTS_JSON, "w"), indent=1, ensure_ascii=False)
    print(f"Added {len(added)} artists. Total now {len(artists)}.")


if __name__ == "__main__":
    main()
