/* Hand-written Kafla content. Facts here were checked against web sources (Oct 2026).
   Never add lyrics. Songs are matched by title against the artist's catalog (data/catalog.js);
   if a title isn't in the catalog it's looked up live on Apple Music when played. */
window.CURATED={
 /* Extra artist details shown on artist pages. Anything not here comes from catalog.js (Wikipedia + Apple Music). */
 artists:{
  smw:{line:"The voice that took Moosa village to the world.",
   real:"Shubhdeep Singh Sidhu, from Moosa village in Mansa district, Punjab.",
   tags:["Hip-hop","Gangsta rap","Storytelling"],
   bio:["Sidhu Moose Wala blended hard-hitting hip-hop with the language and pride of rural Malwa. He wrote his own songs and refused to soften his voice for anyone.",
        "His run from 2017 to 2022 changed what a Punjabi star could be: global chart presence, sold-out shows abroad, and a fan base that treated every release like an event."],
   legacy:{date:"29 May 2022",text:"Sidhu Moose Wala was shot dead in Mansa district at the age of 28. Since then his family and team have released songs he recorded, and each one has been met like a homecoming.",
    after:["SYL","Vaar","Mera Na","Watch Out","Drippy","410"]}},
  navaan:{line:"Hip-hop bars and pop hooks, often in the same song.",
   real:"Singer-songwriter, rapper and composer.",tags:["Hip-hop","Punjabi pop","Songwriter"],
   bio:["Navaan Sandhu writes and composes most of his own material and moves easily between rap and melody. A track like Dapper Dan works for people who come for the beat and people who come for the bars.",
        "He has released a full album or EP nearly every year since 2022, often alongside producer JayB Singh and lyricist Yaari Ghuman."]},
  arjan:{line:"The lyricist who stepped up to the mic.",real:"Singer, rapper and songwriter.",tags:["Punjabi pop","Rap","Lyricist"],
   bio:["Arjan Dhillon was writing songs for other artists before he was a star, including seven songs on Nimrat Khaira's album Nimmo. His breakthrough came in 2020 with Bai Bai and My Fellas, followed by his debut EP The Future.",
        "Where many artists drop singles, he makes full albums, and lots of them. His partnership with producer Mxrci produced Chobar, which entered the Billboard Canadian Albums chart at number 10."]},
  prem:{line:"Majha pride, pop-rap swagger.",real:"Premjeet Singh Dhillon, born 4 January 1995 in Amritsar.",tags:["Pop-rap","Punjabi pop","Majha"],
   bio:["Prem Dhillon's first break came in 2018 when his song Patt Tenu was used in the film Mr & Mrs 420 Returns. Boot Cut, Old Skool and Majha Block made him a favourite across the diaspora.",
        "He reps the Majha region in name and sound, and his 2026 album Majhaestic, produced by The Kidd, leans all the way into it."]},
  aujla:{line:"Lyricist first, now a global headliner.",real:"Jaskaran Singh Aujla, born in 1997 in Ghurala, Punjab. Moved to Vancouver in 2014.",tags:["Hip-hop","Punjabi pop","Lyricist"],
   bio:["Karan Aujla started out in 2016 as a lyricist, writing for names like Jazzy B and Diljit Dosanjh, before stepping out as a solo artist in 2018. His writing is full of sharp metaphors and images of life back in Punjab.",
        "His partnership with producer Ikky changed the game: Making Memories became the highest-charting Punjabi album debut in Canada, and Tauba Tauba from the film Bad Newz took him to a whole new audience."]},
  diljit:{line:"From Dosanjh Kalan to stadiums around the world.",real:"Born Diljit Singh on 6 January 1984 in Dosanjh Kalan, Jalandhar district.",tags:["Punjabi pop","Bhangra","Global"],
   bio:["Diljit Dosanjh began his career in 2002, and his 2009 album The Next Level with Yo Yo Honey Singh made him a household name. He's also one of Punjabi cinema's biggest actors.",
        "In 2023 he became the first Punjabi artist to perform at Coachella, and his 2024 Dil-Luminati Tour sold out and broke records around the world. His 2025 album Aura took him back onto the Billboard Canadian Albums chart."]},
  ap:{line:"The smooth, moody sound that went global.",real:"Amritpal Singh Dhillon, Indo-Canadian singer, rapper and producer, originally from Gurdaspur.",tags:["R&B","Hip-hop","Producer"],
   bio:["AP Dhillon broke through with Brown Munde and a run of songs alongside Gurinder Gill and Shinda Kahlon on Run-Up Records, blending Punjabi vocals with R&B and hip-hop production he often makes himself.",
        "His debut album The Brownprint arrived in 2024, and in 2025 he teamed up with Anuv Jain on Afsos."]},
  shubh:{line:"Toronto trap with Punjabi soul.",real:"Toronto-based rapper and singer, born in Punjab in 1997.",tags:["Hip-hop","Trap","R&B"],
   bio:["Shubh blew up with his first single We Rollin in 2021, then kept the run going with Elevated, Offshore, No Love and Baller, which reached the Canadian Hot 100.",
        "His debut album Still Rollin (2023) reached number 16 in Canada, followed by the Leo EP in 2024, the album Sicario in 2025, and the Chapter IV EP in 2026."]}
 },
 /* Hand-picked playlists: songs are [artistId, "Song title"] */
 playlists:[
  {id:"late-night",t:"Late Night Drive",d:"Smooth, moody and made for empty roads after midnight.",h:[255,320],songs:[["ap","Excuses"],["aujla","Softly"],["ap","With You"],["shubh","Still Rollin"],["diljit","Lover"],["aujla","Admirin' You"],["ap","Summer High"],["prem","Old Skool"]]},
  {id:"gym",t:"Gym Mode",d:"Heavy beats and hard bars for your heaviest sets.",h:[5,35],songs:[["shubh","We Rollin"],["smw","295"],["navaan","Headliner"],["aujla","52 Bars"],["arjan","Hot Shit"],["shubh","King Shit"],["shubh","Baller"],["navaan","Dapper Dan"]]},
  {id:"pind",t:"Pind Pride",d:"Roots, region and where it all started.",h:[40,90],songs:[["smw","So High"],["prem","Majha Block"],["arjan","Daaru Sasti"],["smw","Legend"],["prem","Jatt Hunde Aa"],["arjan","Gutt"],["navaan","The Singh Anthem"],["diljit","Born to Shine"]]},
  {id:"party",t:"Party Starters",d:"Every song here gets the whole room moving.",h:[320,20],songs:[["diljit","Senorita"],["aujla","Tauba Tauba"],["ap","Brown Munde"],["navaan","Deewane"],["diljit","Charmer"],["prem","Boot Cut"],["aujla","Wavy"],["diljit","Naina"]]},
  {id:"smw-forever",t:"Forever Sidhu",d:"Sidhu Moose Wala's essential songs, including those released after his passing.",h:[38,15],songs:[["smw","295"],["smw","The Last Ride"],["smw","SYL"],["smw","Mera Na"],["smw","Legend"],["smw","So High"]]},
  {id:"new-wave",t:"Punjabi New Wave",d:"The freshest drops from 2025 and 2026.",h:[175,215],songs:[["arjan","One Call Away"],["navaan","Headliner"],["prem","Dealer"],["aujla","For A Reason"],["diljit","Senorita"],["prem","Putt Jam Te Lau"],["ap","Afsos"],["navaan","Levels & Graphs"]]}
 ],
 producers:[["Mxrci","Arjan Dhillon's main collaborator, from The Future to Chobar and Enigma.",300],["The Kidd","Produced Prem Dhillon's Majhaestic and worked on Arjan Dhillon's early EP.",200],["JayB Singh","Behind Navaan Sandhu's Levels & Graphs and Dapper Dan.",15],["Ikky","The producer behind Karan Aujla's Four You, Making Memories and P-Pop Culture.",270],["Snappy","Shaped Prem Dhillon's sound on No Lookin' Back and Limitless.",160]],
 quiz:[
  {q:"Pick your ride for the night.",o:[["Old Thar on a dirt road back to the village","smw"],["Matte black G-Wagon with the bass up","navaan"],["Late-night drive, windows down, something smooth playing","ap"],["Vintage convertible with a pagg to match","diljit"]]},
  {q:"What makes a song hit for you?",o:[["Lines I'm still thinking about the next day","arjan"],["Love, loyalty and a hook that sticks","prem"],["Wordplay you only catch on the third listen","aujla"],["A beat that hits hard in the gym","shubh"]]},
  {q:"Your ideal Friday.",o:[["Studio till 4am, phone on silent","smw"],["A sold-out stadium, everyone dancing","diljit"],["Rooftop, chai and deep talks","arjan"],["Out in the city with the crew","shubh"]]},
  {q:"Pick a word.",o:[["Headliner","navaan"],["Majhaestic","prem"],["Brownprint","ap"],["Memories","aujla"]]},
  {q:"How do you handle haters?",o:[["Answer them in the next release","smw"],["Let the numbers talk","navaan"],["Write a line so good they quote it","arjan"],["Smile, wave and keep dancing","diljit"]]},
  {q:"Pick your fit.",o:[["Boot cut jeans and a Majha attitude","prem"],["All black with silver chains","ap"],["Designer tracksuit, fresh off a flight","aujla"],["Oversized hoodie and clean kicks","shubh"]]}
 ]
};
