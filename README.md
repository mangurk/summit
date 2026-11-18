<img src="app/icon.png" width="56" height="56" alt="Summit icon">

# Summit — The Nine Summits

Summit is a mobile-first take-home prototype for a daily alcohol, medication, and personal-goal check-in. The interface draws on the supplied wellness tracker references. An illustrated trail map and achievement crests give each period of honest reporting a visible reward.

```sh
npm install && npm run dev
```

Open http://localhost:3000. Node 22 is recommended.

## Try the demo

1. Start Saturday with **3 of 4 Aconcagua stamps** and Friday missed. Log all three items to reach the week’s fifth qualifying day. The personal goal note is optional.
2. Select the **next-day arrow** beside **3/3** in Daily check-in and finish Sunday’s check-in. The week awards one stamp for **5 qualifying days** and **100 bonus points** for **7 qualifying days**.
3. Select **See your new route** on the **Summit reached!** reveal, then **Redeem 4 stamps** on the map. Closing either dialog also claims the **Andean Pathfinder** crest and opens the trail to Denali.
4. Open **Monthly breakdown** below Daily check-in to review weekly progress and daily log charts.
5. The shop offers a **Rest Day Pass** for 120 points and a **20% one-month demo coupon** for 400 points. A pass covers a missed day in the current or previous week for stamp and bonus eligibility. It preserves the original log history.
6. **Profile → Demo controls → Preview final stamp week** jumps ahead in the simulated calendar to try another ascent. Choose a pika, mountain goat, or raven in **Profile → Trail companion**.

Four qualifying weeks earn the stamps for each peak. Stamps carry across missed weeks. Each summit adds 1.2 percentage points to the simulated recurring discount. Nine summits total **10.8%**. A rainforest season would follow in a future version.

Logs, points, achievements, and companion selection live in the browser. The dose field records what the user enters. There is no dose recommendation, billing integration, or real coupon. The browser manifest and touch-safe navigation support the app shell.

## Design and measurement

The first product bet is that completing a short daily check-in and seeing visible expedition progress will bring people back. The Monday–Sunday row makes the goal easy to read. The weekly target gives members room for imperfect days, and each new crest marks progress through the route.

I’d compare map progression with a plain history view. I’d measure first check-in completion, week-two return, the share of members completing their first month, and whether members return after a missed day. Check that rewards never make people feel pressured to change what they report. The demo collects no analytics.

The original Next.js scaffold, React, TypeScript, and Tailwind CSS carry the interface. Codex assisted with implementation and browser checks. The expedition map uses an SVG trail over a softly shaded backdrop. OpenAI’s built-in ImageGen produced the banner, map backdrop, nine summit icons, the three companions, and all nine rank crests, optimized in `public/summit/`. The Summit mark is rendered from the supplied PNG in the original warm yellow.

<details>
<summary>Artwork prompts</summary>

**banner**

Use case: stylized-concept. Game UI background art for an adult wellness expedition app, no user interface in image. Wide panoramic 3:2 art to be cropped to a flat card. Tactile late-90s handheld adventure game environmental illustration with controlled pixel clusters and fine dithering, detailed but restrained, a dramatic slate-purple twin Andean summit occupying the RIGHT HALF only and amber sunlight drawing a sharp rim along one ridge. Left 40 percent is a calm, near-black indigo shadow with very little detail for white programmatic typography. Ridge is fully visible vertically in middle of frame; soft contours and alpine valleys, extremely sparse digital stars. Rich midnight ink, heather, lilac, warm cream peaks, and muted sunset peach. Adult premium game concept art, bold striking composition, no characters, text, logos, dots, badges, borders, routes, or UI.

**Crest direction**

Use case: stylized-concept. Design an ORIGINAL cohesive family of 3 progression badges for a premium mobile summit adventure. The reference shows the kind of rendering and increasing rank hierarchy the user likes, with satin highlight, bold geometric color and light 3D relief. Create visibly distinct shapes and motifs, no copy of the reference's symbols, wings, lettering, or exact compositions. Wide transparent canvas with exactly three separate equal columns, matching baseline, large transparent gutters. Left early rank: compact chamfered trail-star octagon in deep cyan-teal with a pale celadon two-peak relief. Center middle rank: broader grape-purple octagon, lighter beveled ridge bands and a bright lilac mountain-and-rising-sun jewel in shallow relief. Right final rank: imperial honey-gold octagon with a thin violet line, two subtle angular ridge-shaped tabs and a three-point alpine summit in gold ivory relief. Use the same beveled design language with progressive depth and warmer luminosity, grounded in modern game UI, stylized geometric iconography. Saturated but tasteful; material is smooth enamel, luminous highlights and tactile shallow facets, no realistic metal textures, complicated curls, feathers, laurels, symbols outside badge, particles, text, labels, numbers, backgrounds, shadows or light halos outside silhouette. Each icon separated from others, fully shown, transparent background.

**Remaining crest levels**

Use case: stylized-concept. Create exactly SIX new mobile game rank crest assets that fit precisely into the provided approved THREE crests' style. Treat the reference only as the approved family and rendering standard. Every new crest is a straight-on compact octagon with 45-degree corners, the same clean smooth dimensional bevel width and softly lit satin enamel, a recessed solid color center, and a faceted mountain relief symbol. Early levels grow in color detail and late levels introduce restrained angular wings, not ornamental filigree. Layout exactly 3 columns by 2 rows, all six objects centered exactly in their equal cells with 15 percent transparent clearance on each side, generous spacing. TOP LEFT level 2 is turquoise blue with one extra bright sea-glass bevel and a pale ivory dome and small snowy peak. TOP CENTER level 3 is sapphire blue with pale ice beveled edge and three snowy triangular summits in different shapes. TOP RIGHT level 4 is indigo-lavender with layered chamfered edges and a crisp double-ridge symbol plus a small, inlaid diamond-shaped star. BOTTOM LEFT level 6, after the reference's purple mid rank, is vivid orchid enamel edged with brighter warm pink-lavender satin metal and a faceted sunrise behind a big single snowy peak. BOTTOM CENTER level 7 is warm rose-copper with berry center, apricot edging, and a three-fold jagged summit plus a pair of small angular hardware tabs. BOTTOM RIGHT level 8 is bright champagne rose-gold with warm amber center and ivory ridgeline relief, subtle small beveled side tabs, less wide and less ornate than the final gold crest in the reference. Keep same depth and lighting consistently, preserve a purposeful hierarchy, stylized original assembled icons. Show only the six standalone badges, transparent canvas, no typography, no banners, no numbers, no cast shadows outside silhouettes, no background panels, no rings, no surrounding sparkles. Wide 3:2 format.

**Final gold crest**

Use case: precise-object-edit. The rightmost icon in the provided three-icon reference is the ONLY edit target. Return one standalone original golden octagonal mountain rank crest, with the same compact beveled golden silhouette, golden angular side tabs, angular three-peak ivory-gold symbol, clear large center face, facet highlights, and satin relief from the rightmost source icon. ONLY replace the thin bright purple inner trim with a darker, clean honey-amber gold bevel. Change any stray violet border pixels to amber or gold. The object is entirely tonal gold, honey, amber and pale warm cream. Preserve the source geometry, details, front-on view, color materials of all other areas. Only that one gold crest centered fully visible, square composition, no background, text, shadows beyond the outline or other two icons. True alpha transparent background.

**Trail companions**

Use case: style-transfer. Second input is the original design sheet of three expedition companions. Keep their species, poses, gear, color stories and silhouettes recognizable: orange-jacket pika and backpack on left, cream mountain goat with moss scarf in middle, plum raven with gold scarf and cream cap on right. First input is solely a rendering reference for satin bevels, soft controlled highlights and bold jewel gradients. Redraw these exact three original companions as tasteful shallow-relief collectible game sprites with softly faceted enamel shapes, smooth softly lit volume, violet-umber edge, compatible polished purple-to-warm-gold highlights. Preserve their clear silhouettes and distinct personalities. Do not put the animals inside shields or pedestals, avoid extra exaggerated eyes or cute props, no photographic fur, prints, external drop shadows, letters, background forms, or grid lines. Exactly three standalone whole-body characters separated side by side at the same scale, centered in three equal columns, plenty of transparent space around each, fully visible. Wide canvas with a real transparent alpha channel.

**Mountain landmarks**

Use case: stylized-concept. The input art is only a reference for clean satin bevels, bold jewel colors, and legibility at small scale. Generate a new transparent game sprite sheet for a dark violet adventure map with exactly NINE distinct friendly dimensional mountain landmarks, not crests or shields. Organize them in a perfectly regular 3 column by 3 row atlas, centers exactly at 1/6, 1/2, 5/6 in each axis. All are straight-on dimensional mountain profiles with an ivory snow cap and clearly lit left face, compact foothill base, hard clean shape edges, gentle bevels, warm rim light, no large outlines or visible cast shadows. Keep each mountain with its own silhouette and palette. Top row left to right: wide rounded teal Kilimanjaro with flat summit; tall amber-purple Aconcagua with single severe summit; icy indigo Denali with large glacial twin ridges. Middle row: lavender two domes Elbrus; slate-blue triple ridge Mount Logan; jade-rock steep Puncak Jaya with pale gray top. Bottom row: aqua-silver ice pyramid Vinson; pale lavender snowy fluted Mont Blanc; rich magenta-purple jagged tallest Everest with ivory snow. High contrast so silhouettes read at 55 pixels wide. Artwork only, no frames, badges, discs, status markers, metallic shields, gradients covering entire canvas, lettering, numbers, labels, floating sparkles, pixel noise, landscape, walls, or props. Each mark occupies only middle 68% of its cell, at least 16% blank transparent space surrounding left, right, top and bottom, no touching. Square canvas with alpha transparency.

**Map backdrop**

Use case: precise-object-edit. Use the attached user-provided purple adventure board as the visual reference for an original, QUIET BACKGROUND-ONLY asset. Delete the entire winding trail, every dotted stripe and station, and every rounded node pad. Fill those areas naturally with continuous soft matte plum. Remove the baked rectangular border as well, since the interface draws its own frame. Preserve the calm art direction: layered dark aubergine and subdued plum across the center, very soft large-scale gradient rather than a solid color, sparse faceted low-poly mountain silhouettes and a few low-poly rock clusters tucked near only the far upper left, far right and bottom corners. Keep them understated and mostly part of the background, a step or two in brightness above the plum field. At most four tiny warm star glints near the outer margins. The central 70 percent of the board stays open for a separately drawn interactive track and colorful game pieces. Premium shaded game UI illustration, minimal detail, soft depth, no photographic texture, no field of mountains. Background art only. No path, roads, curves shaped like paths, pads, foreground icons, borders, frames, labels, letters, grid, numbers, characters, points of interest or interface elements. Square 1:1 composition, full bleed.

</details>

<details>
<summary>Original take-home brief</summary>

# Design Engineer take-home

Thanks for making it this far. This is the part we care about most, and it's small
on purpose. Everything you need is right here in this repo, and your work stays
yours.

## What to build

The main daily moment of an app that helps someone stick with one daily goal. That's
the screen where they do the thing each day, mark it done, and get a little sense of
progress that makes them want to come back tomorrow. Just that one screen. You don't
need to build the rest of the app.

You pick the goal: learning a language, saving money, winding down for sleep, a small
creative habit, whatever you like. We want to see what you choose and why.

Build it in `app/page.tsx`. Design for a phone first, since that's how we'll look at
it. Making it responsive for desktop too is up to you.

## The thing I really want you to get

This kind of app only makes money as a subscription, and we don't make a cent until
someone sticks around for about three billing cycles (five is where it really pays
off). People don't stay because we nag them. They stay because they got hooked on one
thing early, something they'd miss if it disappeared.

So pick the one thing you think people would get hooked on, and build the daily moment
around it. Tell me where you're placing that bet.

## A few rules

- Start from this scaffold, don't rebuild it from scratch. We use the same starting
  point for everyone, and we'll build on your version together later, so keep it
  runnable.
- Data's up to you. There's a sample file at `data/sample.json` to use and reshape, or
  if it fits your idea, pull from a free external API (word of the day, quotes, FX rates,
  whatever). Showing some REST chops is a plus. Two rules either way: don't stand up your
  own backend, database, or auth, and keep it running for us out of the box, so nothing
  that needs an API key or a signup we'd have to create, and have it fall back gracefully
  if the API is slow or down. Interactions like checking a thing off or a streak ticking
  up can just live in local state.
- Plan for about 5 hours. Please don't go way over. If you've got bigger ideas, jot
  them down instead of building them.

Skip whatever doesn't matter here: no sign-in, no real payments (just show where a paid
feature would go), no empty states or edge cases. A small, clean, working thing beats a
big fragile one every time.

## Running it

```bash
npm install && npm run dev
```

It opens at http://localhost:3000 and reloads as you edit. Use Node 22 if you can
(there's an `.nvmrc`).

## Sending it back

Work in your own copy (clone it, or hit "Use this template"). Please don't push to this
repo or open a PR against it.

When you're done, email me at jamieson@chooseyourhorizon.com with either a zip of your
project (skip `node_modules`) or a link to your own repo. Make sure it still runs with
one command, since we'll build on it together in a short live session. Deploying it
somewhere like Vercel is optional, a nice bonus but we don't score it.

Send a quick note on your thinking too: what you looked at for inspiration, what you
chose and why, the one thing you're betting people get hooked on, and what you'd measure
or test to know it's working. A short write-up or a Loom under 5 minutes is perfect. And
tell me what tools you used, including AI. We use it, and using it well is a plus.

## How we'll look at it

Mostly the design: is it clear, nice to use on a phone, and does it actually make you
want to come back? We also care that it's built with some consistency instead of random
one-off styles, that your product bet makes sense, and that we can run it and follow
your thinking.

If anything's unclear, just email me before you start. Honestly, a good question counts
in your favor.

Have fun with it, and be creative. I'm excited to see what you come up with. And don't
skip the write-up, that's how I get a feel for the way you think.

Jamieson

</details>
