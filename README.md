# The Green Light — A Poem for Jay Gatsby

A scroll-driven poetic essay on *The Great Gatsby*, built with **Locomotive Scroll** and **Three.js**. All visuals are 100% code-generated — no external images.

## What it is

An original 27-line poem about Jay Gatsby, woven with five direct Fitzgerald quotes. As you scroll, the background shifts through six chapters of Three.js scenes:

| # | Chapter      | Visual                                                              |
|---|--------------|---------------------------------------------------------------------|
| I  | Longing     | The green light pulsing across rippling, shader-animated water     |
| II | Parties     | Drifting gold confetti and floating paper lanterns                 |
| III| The House   | A vast extruded mansion silhouette, every window flickering        |
| IV | Daisy       | Art Deco brooch — a gold sunburst with an emerald jewel core       |
| V  | Collapse    | A particle vortex spiraling inward, color drifting gold→green→red  |
| VI | Wake        | A lone boat on foggy waves, the green light small on the horizon   |

## File structure

```
gatsby-poem/
├── index.html
├── vercel.json
├── package.json
├── .gitignore
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── main.js              Builds DOM, inits Locomotive Scroll
│   ├── scene.js             Three.js renderer, camera, scene manager
│   ├── poem.js              The poem + Fitzgerald quotes (data)
│   └── visuals/
│       ├── greenLight.js    Glowing orb across shader water
│       ├── goldParticles.js Party confetti + lanterns
│       ├── mansion.js       Extruded mansion + lit windows + stars
│       ├── artDeco.js       Gold brooch, sunburst, floating diamonds
│       ├── vortex.js        Particle spiral collapsing inward
│       └── boat.js          Boat, fog, distant green light
```

## Deployment to Vercel

This project is configured for Vercel static hosting from the repository root. No build step or environment variables are required.

### 1. Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

Run the commands from the `gatsby-poem/` project directory. Vercel will detect it as a static site and deploy the files directly.

### 2. GitHub import

1. Push the project to a GitHub repository.
2. In [Vercel](https://vercel.com), choose **Add New Project**.
3. Import the repository.
4. Leave the build settings empty; this is a static site served from the project root.
5. Deploy.

## Tech notes

- **Locomotive Scroll 4.1.4** (CDN) — smooth scroll + parallax + `is-inview` reveals
- **Three.js 0.160** (CDN via import map) — single persistent canvas, all scenes share one renderer/camera
- **Fonts**: Cinzel (display), Playfair Display (poem body), Cormorant Garamond (quotes)
- **Hosting**: Vercel static hosting from the project root
- Scenes crossfade based on which section is closest to viewport center
- Particle counts auto-reduce on mobile
- Custom GLSL shaders for the water surfaces, particle systems, and fog
