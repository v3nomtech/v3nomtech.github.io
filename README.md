# V3nom — Cyber Security Portfolio

Static portfolio site for [v3nomtech](https://github.com/v3nomtech). It has no build step and no dependencies.

## Features
- A minimal design in the style of the original v3nomtech.github.io/website: a black background, a Syncopate wordmark and a row of icon links
- A particle-network background (a port of Particleground) with mouse, device-tilt and scroll parallax. It dims as you scroll so the text stays readable.
- Subtle motion: the hero fades in, drifts and fades out on scroll, and sections fade up as they come into view
- Projects load live from the GitHub API, with a built-in fallback
- Live TryHackMe and Hack The Box badges
- **Mini CTF**: 6 flags (130 pts) in an in-page shell (`ls -a`, `cd`, `cat`, `base64`, `rot13`, `sudo`, `submit`).
  Flags are checked against SHA-256 hashes, and progress is saved in localStorage. `submit` needs HTTPS or localhost.
- Respects `prefers-reduced-motion`, and works on mobile

## Run locally
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy to GitHub Pages
1. Create a repo named `v3nomtech.github.io` (or reuse `website`).
2. Push `index.html`, `style.css`, `script.js`, `robots.txt` and `v4ult-7f3a.txt` (the last two are part of the CTF) to the `main` branch.
3. In the repo, go to Settings → Pages → Source: `main` / root.
