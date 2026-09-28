(() => {
  "use strict";

  const GH_USER = "v3nomtech";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  $("#year").textContent = new Date().getFullYear();

  /* ---------------- Particle network (port of Particleground from v3nomtech.github.io/website) ---------------- */
  function particles() {
    if (reduceMotion) return;
    const canvas = $("#particles");
    const ctx = canvas.getContext("2d");
    const opts = {
      minSpeed: 0.1, maxSpeed: 0.7,
      density: 10000,          // one particle per n px²
      maxParticles: 220,       // cap so the O(n²) line pass stays cheap on big screens
      color: "#5cbdaa",
      radius: 3.5,
      proximity: 100,
      parallaxMultiplier: 5,   // lower = stronger mouse parallax
      scrollDepth: 0.35,       // how far layers drift on scroll (divided by layer)
    };
    const prox2 = opts.proximity * opts.proximity;
    const isMobile = /iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7/i.test(navigator.userAgent);
    let W, H, list = [];
    let mouseX = innerWidth / 2, mouseY = innerHeight / 2, tiltX = 0, tiltY = 0;

    const speed = () => {
      let v = -opts.maxSpeed / 2 + Math.random() * opts.maxSpeed;
      return v + (v > 0 ? opts.minSpeed : -opts.minSpeed);
    };
    const make = () => ({
      layer: Math.ceil(Math.random() * 3),
      x: Math.random() * W, y: Math.random() * H,
      vx: speed(), vy: speed(),
      px: 0, py: 0,          // eased mouse-parallax offset
      dx: 0, dy: 0,          // final draw position
    });

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(Math.round((W * H) / opts.density), opts.maxParticles);
      list = list.filter((p) => p.x <= W && p.y <= H).slice(0, n);
      while (list.length < n) list.push(make());
    };
    resize();
    addEventListener("resize", resize);
    addEventListener("mousemove", (e) => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
    if (isMobile && "DeviceOrientationEvent" in window) {
      addEventListener("deviceorientation", (e) => {
        tiltY = Math.min(Math.max(-(e.beta || 0), -30), 30);
        tiltX = Math.min(Math.max(-(e.gamma || 0), -30), 30);
      }, true);
    }

    const frame = () => {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      const px = isMobile ? ((tiltX + 30) / 60) * W : mouseX;
      const py = isMobile ? ((tiltY + 30) / 60) * H : mouseY;
      const sy = scrollY;
      ctx.clearRect(0, 0, W, H);

      for (const p of list) {
        // mouse / tilt parallax, eased exactly like particleground
        p.px += ((px - W / 2) / (opts.parallaxMultiplier * p.layer) - p.px) / 10;
        p.py += ((py - H / 2) / (opts.parallaxMultiplier * p.layer) - p.py) / 10;
        // bounce off the edges
        if (p.x + p.vx + p.px > W || p.x + p.vx + p.px < 0) p.vx = -p.vx;
        if (p.y + p.vy + p.py > H || p.y + p.vy + p.py < 0) p.vy = -p.vy;
        p.x += p.vx; p.y += p.vy;
        // scroll parallax: nearer layers (1) move more; wrap vertically
        const off = (sy * opts.scrollDepth) / p.layer;
        p.dx = p.x + p.px;
        p.dy = ((((p.y + p.py - off) % H) + H) % H);
      }

      ctx.fillStyle = opts.color;
      ctx.strokeStyle = opts.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        for (let j = list.length - 1; j > i; j--) {
          const b = list[j];
          const x = a.dx - b.dx, y = a.dy - b.dy;
          if (x * x + y * y < prox2) { ctx.moveTo(a.dx, a.dy); ctx.lineTo(b.dx, b.dy); }
        }
      }
      ctx.stroke();
      ctx.beginPath();
      for (const p of list) {
        ctx.moveTo(p.dx + opts.radius / 2, p.dy);
        ctx.arc(p.dx, p.dy, opts.radius / 2, 0, Math.PI * 2);
      }
      ctx.fill();
    };
    requestAnimationFrame(frame);
  }
  /* ---------------- Scroll: nav, hero parallax, particle dimming ---------------- */
  function scrollFx() {
    const nav = $("#nav");
    const hero = $("#hero-inner");
    const canvas = $("#particles");
    const links = $$(".nav nav a");
    const sections = links.map((a) => $(a.getAttribute("href")));
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = scrollY, vh = innerHeight;
      const t = Math.min(y / vh, 1);
      nav.classList.toggle("show", y > vh * 0.6);
      if (!reduceMotion && y < vh * 1.2) {
        // hero drifts down slower than the page and fades out
        hero.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
        hero.style.opacity = String(Math.max(0, 1 - t * 1.4));
      }
      // particles stay bright on the hero, then dim so text stays readable
      canvas.style.opacity = String(1 - t * 0.6);
      let current = -1;
      sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < vh * 0.4) current = i; });
      links.forEach((a, i) => a.classList.toggle("active", i === current));
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update);
    update();
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealer.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    : null;
  const reveal = (el) => (revealer ? revealer.observe(el) : el.classList.add("in"));

  /* ---------------- Projects (live from GitHub) ---------------- */
  const FALLBACK_REPOS = [
    { name: "v3nomEyE", description: "Automated P1 bug bounty framework. A 17-phase recon pipeline covering XSS, SQLi, SSRF, IDOR, JWT, cloud misconfig and JS secrets.", language: "Python", stargazers_count: 7, html_url: "https://github.com/v3nomtech/v3nomEyE" },
    { name: "V3nom-Intel", description: "Open-source threat intelligence console: live CVEs, CISA KEV, EPSS scores, abuse.ch IOCs and active C2 servers on a global map.", language: "JavaScript", stargazers_count: 1, html_url: "https://github.com/v3nomtech/V3nom-Intel" },
    { name: "IoT_HaXX", description: "IoT and hardware hacking experiments.", language: "C++", stargazers_count: 2, html_url: "https://github.com/v3nomtech/IoT_HaXX" },
    { name: "Threat_hunting", description: "Threat hunting notebooks and experiments.", language: "Jupyter Notebook", stargazers_count: 0, html_url: "https://github.com/v3nomtech/Threat_hunting" },
    { name: "Bug_Bounty", description: "A collection of bug bounty resources.", language: null, stargazers_count: 0, html_url: "https://github.com/v3nomtech/Bug_Bounty" },
    { name: "Arduino", description: "Arduino-based electronics projects.", language: "C++", stargazers_count: 0, html_url: "https://github.com/v3nomtech/Arduino" },
  ];
  // featured repos go first regardless of stars
  const FEATURED = ["v3nomEyE", "V3nom-Intel", "IoT_HaXX", "Threat_hunting"];

  function renderProjects(repos) {
    const list = $("#project-list");
    list.textContent = "";
    const rank = (r) => { const i = FEATURED.indexOf(r.name); return i < 0 ? 99 : i; };
    repos
      .filter((r) => !r.fork && r.name.toLowerCase() !== GH_USER && r.name !== "website")
      .sort((a, b) => rank(a) - rank(b) || b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .forEach((r) => {
        const li = document.createElement("li");
        li.className = "reveal";
        const a = document.createElement("a");
        a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
        const h = document.createElement("h3");
        const arrow = document.createElement("span");
        arrow.className = "arrow"; arrow.textContent = "↗";
        h.append(r.name, arrow);
        const p = document.createElement("p");
        p.textContent = (r.description || "Source code and notes.").trim();
        const meta = document.createElement("div");
        meta.className = "meta";
        if (r.language) { const s = document.createElement("span"); s.textContent = r.language; meta.appendChild(s); }
        const st = document.createElement("span"); st.textContent = "★ " + r.stargazers_count; meta.appendChild(st);
        a.append(h, meta, p);
        li.appendChild(a);
        list.appendChild(li);
        reveal(li);
      });
  }

  async function loadProjects() {
    try {
      const res = await fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`);
      if (!res.ok) throw new Error(res.status);
      renderProjects(await res.json());
    } catch {
      renderProjects(FALLBACK_REPOS);
    }
  }

  /* ---------------- Mini CTF ---------------- */
  // Flags are only stored as SHA-256 hashes. Where the game itself has to reveal a flag,
  // it's kept reversed + base64'd so it doesn't show up by grepping for "flag{".
  const unveil = (s) => atob(s).split("").reverse().join("");
  const CHALLENGES = [
    { id: "warmup", name: "Hidden in Plain Sight", cat: "linux", pts: 10,
      desc: "Not every file shows up with a plain ls.",
      hint: "Files starting with a dot are hidden. Try `ls -a`.",
      hash: "daf2b637e89c54457bb3e4e4c4390c5bcd07aef05a974af79f0c218e2772c865" },
    { id: "source", name: "View Source", cat: "web", pts: 20,
      desc: "Developers leave the funniest things behind.",
      hint: "Right-click → View Page Source and read the comments near the bottom. Then `base64 -d`.",
      hash: "c081d4d543eb17910acdcdeae697f12a8037e9dff04cf8d3d0f7b65bc389064a" },
    { id: "console", name: "Dev Tools Ninja", cat: "web", pts: 20,
      desc: "Some messages are only for people who open DevTools.",
      hint: "Press F12 and check the Console. The message is scrambled with a classic 13-letter rotation. Try `rot13`.",
      hash: "c1286541311d4d8c362c179d337473c605fcac94f4f1eb005a7bd30cb254f86d" },
    { id: "cookie", name: "Cookie Monster", cat: "web", pts: 30,
      desc: "Only admins get to run sudo here.",
      hint: "How does the site know you're a guest? DevTools → Application → Cookies.",
      hash: "12ae4c8c8420606b9f96f8ddcf7971886f6fce2627b2d67e1e1493ee9b8633bd" },
    { id: "caesar", name: "Intercepted", cat: "crypto", pts: 30,
      desc: "We intercepted a message. It looks... shifted.",
      hint: "Look in ~/notes. An emperor used this cipher with a shift of 3.",
      hash: "f4f5d4d836d6e7d78efe761fdd3c7772652efa7bdaf2535320275901a7e31d19" },
    { id: "robots", name: "Crawler's Secret", cat: "recon", pts: 20,
      desc: "Search engines were told to stay away from something.",
      hint: "Every site tells crawlers what not to index. Visit /robots.txt next to this page.",
      hash: "e5c63ef4e82d72624967a5b6e1084b6b121d42dd80de13a385d721bc011f2e66" },
  ];
  const TOTAL = CHALLENGES.reduce((s, c) => s + c.pts, 0);
  const CTF_KEY = "v3nom_ctf_solved";

  const loadSolved = () => {
    try { return new Set(JSON.parse(localStorage.getItem(CTF_KEY) || "[]")); } catch { return new Set(); }
  };
  const solved = loadSolved();
  const saveSolved = () => { try { localStorage.setItem(CTF_KEY, JSON.stringify([...solved])); } catch { /* ignore */ } };

  async function sha256(text) {
    if (!(window.crypto && crypto.subtle)) return null;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function renderBoard() {
    const n = solved.size;
    const score = CHALLENGES.filter((c) => solved.has(c.id)).reduce((s, c) => s + c.pts, 0);
    const label = $("#ctf-score");
    label.textContent = n === CHALLENGES.length ? `all ${n} flags · ${score} pts` : `${n} / ${CHALLENGES.length} flags · ${score} pts`;
    label.classList.toggle("done", n === CHALLENGES.length);
    $("#ctf-bar").style.width = (n / CHALLENGES.length) * 100 + "%";
  }

  function ctfSetup() {
    // cookie challenge: everyone starts as a guest
    if (!/(?:^|;\s*)v3nom_role=/.test(document.cookie)) {
      document.cookie = "v3nom_role=guest; path=/; SameSite=Lax; max-age=31536000";
    }
    // console challenge
    console.log(
      "%c V3NOM %c you opened DevTools. nice instincts.",
      "background:#5cbdaa;color:#000;font-weight:bold;padding:4px 8px;border-radius:4px",
      "color:#5cbdaa;font-family:monospace"
    );
    console.log("%cintercepted transmission: " + unveil("fTR3YTFhXzN5MGZhMHBfZnkwMGdpM3F7dG55cw=="), "color:#e8e8e8;font-family:monospace");
    console.log("%c(hint: the letters were rotated... by half the alphabet)", "color:#8b9098;font-family:monospace");
    renderBoard();
  }

  /* ---------------- Interactive terminal ---------------- */
  function terminal() {
    const out = $("#term-out");
    const input = $("#term-in");
    const body = $("#term-body");
    const cwdLabel = $("#term-cwd");
    const history = [];
    let hIdx = 0;
    const HOME = "/home/guest";
    let cwd = HOME;

    const LINKS = {
      github: "https://github.com/v3nomtech",
      tryhackme: "https://tryhackme.com/p/CYbErXV3nOm",
      htb: "https://app.hackthebox.com/users/588340",
      twitter: "https://x.com/venom_tech_",
      instagram: "https://instagram.com/venom.tech.official",
      medium: "https://medium.com/@venomtechofficial",
      youtube: "https://youtube.com/@venomelectronics",
    };

    // tiny virtual filesystem: strings are files, objects are directories
    const FS = {
      home: {
        guest: {
          "about.txt": "v3nom: IoT ⥂ Linux ⥂ Cyber Security. India. ISC2 & Google certified.\nBuilds offensive tooling and threat intel dashboards, and hacks hardware for fun.",
          "welcome.txt": "Welcome to the v3nom mini CTF.\n6 flags are hidden around this website. Format: flag{...}\nType `ctf` for the list, `hint <n>` for help, `submit <flag>` to score.",
          ".secret": () => "you found a hidden file 👀\n" + unveil("fXQzcmMzc190bjNyNF9zM2wxZl9uM2RkMWh7Z2FsZg=="),
          notes: {
            "todo.txt": "- [ ] remove the debug note from index.html before deploy\n- [ ] sudo just trusts the role cookie?? fix auth later\n- [x] hide the vault from search engines (robots.txt)",
            "intercepted.txt": () => "-----BEGIN INTERCEPT-----\n" + unveil("fWd4MHVzXzNlX2dveDB6X3Z4MTF4bXtqZG9p") + "\n-----END INTERCEPT-----\n\nsender signature: \"veni, vidi, vici\"",
          },
          projects: {
            "v3nomEyE.md": "Automated P1 bug bounty framework. 17-phase recon → exploit pipeline.\nhttps://github.com/v3nomtech/v3nomEyE",
            "V3nom-Intel.md": "Open-source threat intel console: CVE, KEV, EPSS, IOCs, C2 map.\nhttps://github.com/v3nomtech/V3nom-Intel",
          },
        },
      },
      etc: {
        passwd: "root:x:0:0:root:/root:/bin/zsh\nv3nom:x:1000:1000:V3nom:/home/v3nom:/bin/zsh\nguest:x:1001:1001::/home/guest:/bin/zsh",
        hostname: "v3nom",
      },
    };

    const resolve = (path) => {
      if (!path || path === "~") return HOME;
      if (path.startsWith("~/")) path = HOME + path.slice(1);
      const parts = (path.startsWith("/") ? path : cwd + "/" + path).split("/");
      const stack = [];
      for (const p of parts) {
        if (!p || p === ".") continue;
        if (p === "..") stack.pop(); else stack.push(p);
      }
      return "/" + stack.join("/");
    };
    const lookup = (abs) => {
      let node = FS;
      for (const p of abs.split("/").filter(Boolean)) {
        if (node && typeof node === "object" && p in node) node = node[p];
        else return undefined;
      }
      return node;
    };
    const pretty = (abs) => (abs === HOME ? "~" : abs.startsWith(HOME + "/") ? "~" + abs.slice(HOME.length) : abs);

    const print = (text, cls = "") => {
      const d = document.createElement("div");
      if (cls) d.className = cls;
      d.textContent = text;
      out.appendChild(d);
      return d;
    };
    const printLinks = () => {
      Object.entries(LINKS).forEach(([k, v]) => {
        const d = document.createElement("div");
        const label = document.createElement("span");
        label.className = "t-ok";
        label.textContent = k.padEnd(11);
        const a = document.createElement("a");
        a.href = v; a.target = "_blank"; a.rel = "noopener"; a.textContent = v;
        d.append(label, a);
        out.appendChild(d);
      });
    };
    const getRole = () => (document.cookie.match(/(?:^|;\s*)v3nom_role=([^;]*)/) || [])[1] || "guest";

    const commands = {
      help: () => print(
        "general:\n" +
        "  whoami  skills  projects  platforms  socials  neofetch  clear\n" +
        "  open <github|tryhackme|htb|...>    goto <about|projects|platforms|ctf|contact>\n" +
        "filesystem:\n" +
        "  ls [-a] [dir]   cd <dir>   pwd   cat <file>\n" +
        "tools:\n" +
        "  base64 -d <text>   rot13 <text>   sudo <cmd>\n" +
        "ctf:\n" +
        "  ctf   hint <n>   submit <flag>   reset-ctf"
      ),
      whoami: () => print(getRole() === "admin" ? "admin (…wait, how did you do that?)" : "guest\n(the site owner is v3nom: IoT ⥂ Linux ⥂ Cyber Security)"),
      skills: () => print("languages : python c c++ c# go js bash powershell\nsecurity  : recon xss sqli ssrf idor jwt threat-hunting splunk osint\nhardware  : arduino esp32 raspberry-pi zigbee node-red\ncloud     : aws azure gcp docker k8s ansible"),
      projects: () => print("[*] v3nomEyE        17-phase automated bug bounty recon → exploit framework\n[*] V3nom-Intel     live threat intelligence console (CVE/KEV/EPSS/IOC/C2)\n[*] IoT_HaXX        hardware & IoT hacking\n[*] Threat_hunting  hunting notebooks"),
      platforms: () => { print("tryhackme : CYbErXV3nOm"); print("hackthebox: #588340"); },
      socials: printLinks,
      neofetch: () => print(
        "       ☠        guest@v3nom\n" +
        "     ▄███▄      -----------\n" +
        "    ██▀▀▀██     OS: Kali GNU/Linux\n" +
        "    ██▄▄▄██     Shell: zsh\n" +
        "     ▀███▀      Focus: offsec / threat intel / iot\n" +
        "      ▐█▌       Location: India\n" +
        `                CTF: ${solved.size}/${CHALLENGES.length} flags`
      ),
      clear: () => { out.textContent = ""; },
      pwd: () => print(cwd),
      ls: (arg) => {
        const args = arg.split(/\s+/).filter(Boolean);
        const all = args.some((a) => /^-\w*a/.test(a));
        const target = resolve(args.find((a) => !a.startsWith("-")) || ".");
        const node = lookup(target);
        if (node === undefined) return print(`ls: cannot access '${target}': No such file or directory`, "t-err");
        if (typeof node !== "object") return print(target.split("/").pop());
        const names = Object.keys(node).filter((n) => all || !n.startsWith(".")).sort();
        const d = print("");
        (all ? [".", "..", ...names] : names).forEach((n, i) => {
          const s = document.createElement("span");
          const isDir = n === "." || n === ".." || typeof node[n] === "object";
          s.className = isDir ? "t-dir" : "";
          s.textContent = (i ? "  " : "") + n + (isDir && n !== "." && n !== ".." ? "/" : "");
          d.appendChild(s);
        });
      },
      cd: (arg) => {
        const target = resolve(arg || "~");
        const node = lookup(target);
        if (node === undefined) return print(`cd: no such file or directory: ${arg}`, "t-err");
        if (typeof node !== "object") return print(`cd: not a directory: ${arg}`, "t-err");
        if (target === "/root") return print("cd: permission denied: /root", "t-err");
        cwd = target;
        cwdLabel.textContent = pretty(cwd);
      },
      cat: (arg) => {
        if (!arg) return print("usage: cat <file>");
        const node = lookup(resolve(arg));
        if (node === undefined) return print(`cat: ${arg}: No such file or directory`, "t-err");
        if (typeof node === "object") return print(`cat: ${arg}: Is a directory`, "t-err");
        print(typeof node === "function" ? node() : node);
      },
      base64: (arg) => {
        const m = arg.match(/^(-d|--decode)\s+(.+)$/);
        try {
          if (m) print(atob(m[2].trim()));
          else if (arg) print(btoa(arg));
          else print("usage: base64 [-d] <text>");
        } catch { print("base64: invalid input", "t-err"); }
      },
      rot13: (arg) => print(arg ? arg.replace(/[a-z]/gi, (c) => {
        const b = c <= "Z" ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - b + 13) % 26) + b);
      }) : "usage: rot13 <text>"),
      sudo: (arg) => {
        if (getRole() !== "admin") {
          print(`[sudo] checking role cookie... role=${getRole()}`, "t-muted");
          return print("guest is not in the sudoers file. This incident will be reported. 🚨", "t-err");
        }
        print("[sudo] role=admin ✔ access granted", "t-ok");
        print(arg ? `running '${arg}' as root... just kidding. here's what you came for:` : "here's what you came for:");
        print(unveil("fWh0dTRfdDBuXzNyNF9zMzFrMDBje2dhbGY="), "t-ok");
      },
      ctf: () => {
        print(`v3nom mini CTF: ${solved.size}/${CHALLENGES.length} flags`, "t-ok");
        CHALLENGES.forEach((c, i) => {
          print(`${solved.has(c.id) ? "[✔]" : "[ ]"} ${i + 1}. ${c.name.padEnd(22)} ${c.cat.padEnd(7)} ${String(c.pts).padStart(2)} pts\n      ${c.desc}`, solved.has(c.id) ? "t-muted" : "");
        });
        print("submit with: submit flag{...}   stuck? hint <n>", "t-muted");
      },
      hint: (arg) => {
        const c = CHALLENGES[+arg - 1];
        if (!c) return print(`usage: hint <1-${CHALLENGES.length}>`, "t-err");
        print(`hint #${arg} (${c.name}): ${c.hint}`, "t-dir");
      },
      submit: async (arg) => {
        const flag = arg.trim();
        if (!/^flag\{.+\}$/.test(flag)) return print("format: submit flag{...}", "t-err");
        const h = await sha256(flag);
        if (h === null) return print("submit needs a secure context (https or localhost).", "t-err");
        const c = CHALLENGES.find((x) => x.hash === h);
        if (!c) return print("✘ incorrect flag. keep digging.", "t-err");
        if (solved.has(c.id)) return print(`already captured: ${c.name}`, "t-muted");
        solved.add(c.id);
        saveSolved();
        print(`✔ FLAG ACCEPTED: ${c.name} (+${c.pts} pts)`, "t-ok");
        renderBoard();
        toast(`+${c.pts} pts · ${c.name}`);
        if (solved.size === CHALLENGES.length) {
          print("\n🏆 ALL FLAGS CAPTURED. You pwned the portfolio.\n   Screenshot this and tag @venom_tech_ :)", "t-ok");
          toast("🏆 All flags captured!");
        }
      },
      "reset-ctf": () => {
        solved.clear(); saveSolved(); renderBoard();
        document.cookie = "v3nom_role=guest; path=/; SameSite=Lax; max-age=31536000";
        print("ctf progress reset.", "t-muted");
      },
      open: (arg) => {
        const url = LINKS[arg];
        if (!url) return print(`open: unknown target '${arg || ""}'. try: ${Object.keys(LINKS).join(", ")}`, "t-err");
        print(`[+] opening ${url}`);
        window.open(url, "_blank", "noopener");
      },
      goto: (arg) => {
        const map = { home: "#home", about: "#about", projects: "#projects", platforms: "#platforms", ctf: "#ctf", contact: "#contact" };
        const target = map[arg];
        if (!target) return print("goto: sections -> " + Object.keys(map).join(", "), "t-err");
        $(target).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      },
    };

    const run = async (raw) => {
      const line = raw.trim();
      const echo = print("");
      const ps = document.createElement("span");
      ps.className = "t-ok";
      ps.textContent = `guest@v3nom:${pretty(cwd)}$ `;
      echo.appendChild(ps);
      echo.append(line);
      if (!line) return;
      history.push(line); hIdx = history.length;
      const [cmd, ...args] = line.split(/\s+/);
      const fn = commands[cmd.toLowerCase()];
      if (fn) await fn(args.join(" "));
      else print(`zsh: command not found: ${cmd}. type 'help'`, "t-err");
    };

    print("V3nom shell v2.0: type 'help' for commands, or 'cat welcome.txt' to start the CTF.", "t-muted");

    $("#term-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = input.value;
      input.value = "";
      await run(v);
      body.scrollTop = body.scrollHeight;
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && hIdx > 0) { hIdx--; input.value = history[hIdx]; e.preventDefault(); }
      else if (e.key === "ArrowDown") { hIdx = Math.min(hIdx + 1, history.length); input.value = history[hIdx] || ""; e.preventDefault(); }
      else if (e.key === "Tab") {
        e.preventDefault();
        const parts = input.value.split(" ");
        if (parts.length === 1) {
          const m = Object.keys(commands).filter((c) => c.startsWith(parts[0]));
          if (m.length === 1) input.value = m[0] + " ";
        } else {
          // complete file names in the current directory
          const last = parts[parts.length - 1];
          const slash = last.lastIndexOf("/");
          const dirPart = slash >= 0 ? last.slice(0, slash + 1) : "";
          const node = lookup(resolve(dirPart || "."));
          if (node && typeof node === "object") {
            const m = Object.keys(node).filter((n) => n.startsWith(last.slice(slash + 1)));
            if (m.length === 1) {
              parts[parts.length - 1] = dirPart + m[0] + (typeof node[m[0]] === "object" ? "/" : "");
              input.value = parts.join(" ");
            }
          }
        }
      }
    });
    body.addEventListener("click", () => input.focus({ preventScroll: true }));
  }

  function toast(msg) {
    $$(".toast").forEach((old) => old.remove());
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("out"), 2600);
    setTimeout(() => t.remove(), 3200);
  }
  /* ---------------- Init ---------------- */
  $$(".reveal").forEach(reveal);
  particles();
  scrollFx();
  loadProjects();
  ctfSetup();
  terminal();
})();
