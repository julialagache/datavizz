/* Destination Festivals : tous les chiffres affichés sont calculés ici depuis data.js. */
(() => {
  const D = window.FESTIVALS;
  const F = D.festivals.map(([nom, r, annee, d, p]) => ({ nom, r, annee, d, p }));
  const REG = D.regions;
  const METRO = REG.map((x, i) => ({ ...x, i })).filter(x => x.pop);
  const COL_DARK = ['#e8368f', '#2c9be8', '#d99a00', '#8f75f2', '#10a877', '#e8622a'];
  const COL_PAPER = ['#d6006f', '#0077c2', '#b07f00', '#6b45d8', '#0d8f5c', '#c9481a'];
  const MARQUE = ['la musique', 'le spectacle vivant', 'le livre', 'le cinéma', 'le pluridisciplinaire', 'les arts visuels'];
  const SHORT = ['Musique', 'Spectacle', 'Livre', 'Cinéma', 'Pluri.', 'Arts visuels'];
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fmt = (n, dec = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/ /g, ' ');
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const articleRegion = n => ({ 'Île-de-France': "en Île-de-France", 'Auvergne-Rhône-Alpes': 'en Auvergne-Rhône-Alpes', Occitanie: 'en Occitanie', 'Pays de la Loire': 'en Pays de la Loire', Corse: 'en Corse', 'Grand Est': 'dans le Grand Est', 'Hauts-de-France': 'dans les Hauts-de-France', "Provence-Alpes-Côte d'Azur": "en Provence-Alpes-Côte d'Azur" }[n] || `en ${n}`);

  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') n.textContent = v;
      else if (k === 'style') n.style.cssText = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    n.append(...kids);
    return n;
  }
  function svg(tag, attrs = {}, ...kids) {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') n.textContent = v; else n.setAttribute(k, v);
    }
    n.append(...kids);
    return n;
  }

  /* ---------- Agrégats ---------- */
  const count = (arr, key, size) => { const c = new Array(size).fill(0); arr.forEach(x => c[x[key]]++); return c; };
  const byRegion = count(F, 'r', REG.length);
  const byDisc = count(F, 'd', 6);
  const byPeriod = count(F, 'p', 4);
  const regionDisc = REG.map((_, i) => count(F.filter(x => x.r === i), 'd', 6));
  METRO.forEach(x => { x.n = byRegion[x.i]; x.d = x.n / x.pop * 1e5; });
  const dated = F.filter(x => x.annee);
  const byYear = {};
  dated.forEach(x => { byYear[x.annee] = (byYear[x.annee] || 0) + 1; });
  const peak = Object.entries(byYear).sort((a, b) => b[1] - a[1])[0];
  const topN = [...METRO].sort((a, b) => b.n - a.n);
  const topD = [...METRO].sort((a, b) => b.d - a.d);
  const idf = METRO.find(x => x.nom === 'Île-de-France');
  const days = [171, 77, 117];
  const weeks = days.map(d => d / 7);
  const perWeek = days.map((_, i) => byPeriod[i] / weeks[i]);
  const knownPeriod = byPeriod[0] + byPeriod[1] + byPeriod[2];
  const horsSaisonWeek = (byPeriod[0] + byPeriod[2]) / (weeks[0] + weeks[2]);
  const corse = D.corse;
  const dept = n => corse.filter(c => c.dept === n).length;

  const STATS = {
    total: fmt(F.length), perDay: fmt(F.length / 365), topN: fmt(topN[0].n),
    denseVal: fmt(topD[0].d, 1), denseRatio: fmt(topD[0].d / idf.d, 1),
    musicPct: fmt(byDisc[0] / F.length * 100),
    since2010: fmt(dated.filter(x => x.annee >= 2010).length / dated.length * 100),
    since2000: fmt(dated.filter(x => x.annee >= 2000).length / dated.length * 100),
    weekly: fmt(perWeek[1] / horsSaisonWeek, 1), horsSaison: fmt((byPeriod[0] + byPeriod[2]) / knownPeriod * 100),
    periodeInconnue: fmt(byPeriod[3]), peakYear: peak[0], peakN: fmt(peak[1]), known: fmt(dated.length),
    outreMer: fmt(F.length - METRO.reduce((s, x) => s + x.n, 0)),
    corseN: fmt(byRegion[REG.findIndex(r => r.nom === 'Corse')]), corseListe: fmt(corse.length),
    corseHC: fmt(dept('Haute-Corse')), corseCS: fmt(dept('Corse-du-Sud')),
    corseHors: fmt(corse.filter(c => c.mois !== 7 && c.mois !== 8).length),
    corseFilms: fmt(corse.filter(c => c.mois >= 10 && /^Cinéma/.test(c.domaine)).length),
    lignes: fmt(D.meta.lignes), doublons: fmt(D.meta.doublons), anneeInconnue: fmt(D.meta.anneeInconnue), anneeIllisible: fmt(D.meta.anneeIllisible)
  };
  document.querySelectorAll('[data-s]').forEach(n => { n.textContent = STATS[n.dataset.s]; });

  /* ---------- Infobulle ---------- */
  const tip = $('tip');
  function showTip(x, y, title, sub) {
    tip.replaceChildren(el('b', { text: title }), el('span', { text: sub }));
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    tip.style.left = clamp(x + 14, 8, innerWidth - r.width - 8) + 'px';
    tip.style.top = (y - r.height - 12 < 8 ? y + 16 : y - r.height - 12) + 'px';
  }
  const hideTip = () => { tip.hidden = true; };
  addEventListener('scroll', hideTip, { passive: true });

  /* ---------- Géométrie commune ---------- */
  const paths = {};
  Object.entries(D.geo).forEach(([nom, ds]) => { paths[nom] = ds.map(d => new Path2D(d)); });

  /* ---------- Accueil : un point par festival ---------- */
  function seeded(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  function layoutDots() {
    const rnd = seeded(2019);
    const probe = document.createElement('canvas').getContext('2d');
    const measure = svg('svg', { width: 0, height: 0, style: 'position:absolute' });
    document.body.append(measure);
    const box = {};
    Object.entries(D.geo).forEach(([nom, ds]) => {
      const g = svg('g'); ds.forEach(d => g.append(svg('path', { d })));
      measure.append(g); box[nom] = g.getBBox();
    });
    measure.remove();
    const all = Object.values(box);
    const bx = Math.min(...all.map(b => b.x)), by = Math.min(...all.map(b => b.y));
    const bw = Math.max(...all.map(b => b.x + b.width)) - bx, bh = Math.max(...all.map(b => b.y + b.height)) - by;

    const dots = [], cell = 9, grid = new Map();
    const keyOf = (x, y) => (x / cell | 0) * 4096 + (y / cell | 0);
    const nearest = (x, y) => {
      let best = 1e9; const cx = x / cell | 0, cy = y / cell | 0;
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
        const list = grid.get((cx + i) * 4096 + cy + j); if (!list) continue;
        for (const p of list) { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < best) best = d; }
      }
      return best;
    };
    const order = F.map((f, i) => i).sort(() => rnd() - .5);
    order.forEach(i => {
      const f = F[i], nom = REG[f.r].nom;
      let px, py;
      if (paths[nom]) {
        const b = box[nom]; let best = -1;
        for (let c = 0, ok = 0; ok < 7 && c < 400; c++) {
          const x = b.x + rnd() * b.width, y = b.y + rnd() * b.height;
          if (!paths[nom].some(p => probe.isPointInPath(p, x, y))) continue;
          ok++;
          const d = nearest(x, y);
          if (d > best) { best = d; px = x; py = y; }
        }
      } else { // Outre-mer : disque en bas à gauche de la carte
        const n = dots.filter(d => d.om).length;
        const a = n * 2.39996, r = Math.sqrt(n) * 3.2;
        px = bx + 52 + Math.cos(a) * r; py = by + bh - 52 + Math.sin(a) * r;
      }
      const dot = { x: px, y: py, d: f.d, f, om: !paths[nom], delay: rnd() * 1.45, fall: 30 + rnd() * 90 };
      dots.push(dot);
      const k = keyOf(px, py); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(dot);
    });
    return { dots, grid, cell, bx, by, bw, bh };
  }

  function heroMap() {
    const cv = $('dotMap'), ctx = cv.getContext('2d');
    const L = layoutDots();
    let w = 0, h = 0, scale = 1, ox = 0, oy = 0, filter = -1, start = 0, done = REDUCED;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const base = document.createElement('canvas');

    function size() {
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = base.width = Math.round(w * dpr); cv.height = base.height = Math.round(h * dpr);
      scale = Math.min((w - 10) / L.bw, (h - 6) / L.bh);
      ox = (w - L.bw * scale) / 2 - L.bx * scale; oy = (h - L.bh * scale) / 2 - L.by * scale;
      paintBase();
    }
    const radius = () => clamp(scale * 1.75, 1.05, 2.1);
    function plot(c, list, r) { c.beginPath(); list.forEach(p => { c.moveTo(p.sx + r, p.sy); c.arc(p.sx, p.sy, r, 0, 6.283); }); c.fill(); }
    function paintBase() {
      const c = base.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
      L.dots.forEach(p => { p.sx = ox + p.x * scale; p.sy = oy + p.y * scale; });
      const r = radius();
      COL_DARK.forEach((col, i) => {
        c.fillStyle = col; c.globalAlpha = filter === -1 || filter === i ? 1 : .09;
        plot(c, L.dots.filter(p => p.d === i), r);
      });
      c.globalAlpha = 1; c.fillStyle = '#d0cec9'; c.font = '500 12px "IBM Plex Sans", sans-serif'; c.textAlign = 'left';
      const nOm = L.dots.filter(p => p.om).length;
      c.fillText(`Outre-mer : ${nOm}`, Math.max(2, ox + (L.bx + 16) * scale), oy + (L.by + L.bh + 2) * scale);
      show();
    }
    function show() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0); }

    /* L'arrivée : les points tombent et le compteur les compte. */
    const counter = $('heroCount');
    function intro(t) {
      if (!start) start = t;
      const s = (t - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      const r = radius(); let landed = 0;
      COL_DARK.forEach((col, i) => {
        ctx.fillStyle = col; ctx.beginPath();
        L.dots.forEach(p => {
          if (p.d !== i) return;
          const q = clamp((s - p.delay) / .7, 0, 1);
          if (q <= 0) return;
          landed++;
          const e = 1 - (1 - q) ** 3, y = p.sy - p.fall * (1 - e);
          ctx.moveTo(p.sx + r, y); ctx.arc(p.sx, y, r, 0, 6.283);
        });
        ctx.fill();
      });
      counter.textContent = fmt(landed);
      if (s < 2.2) requestAnimationFrame(intro);
      else { counter.textContent = STATS.total; done = true; show(); }
    }

    new ResizeObserver(() => { size(); if (!done) return; show(); }).observe(cv);
    size();
    if (!REDUCED) requestAnimationFrame(intro);

    /* Survol : le point le plus proche donne son festival. */
    function pick(e) {
      if (!done) return;
      const r = cv.getBoundingClientRect();
      const mx = (e.clientX - r.left - ox) / scale, my = (e.clientY - r.top - oy) / scale;
      let best = null, bd = (11 / scale) ** 2;
      const cx = mx / L.cell | 0, cy = my / L.cell | 0, span = Math.ceil(11 / scale / L.cell);
      for (let i = -span; i <= span; i++) for (let j = -span; j <= span; j++) {
        (L.grid.get((cx + i) * 4096 + cy + j) || []).forEach(p => {
          if (filter !== -1 && filter !== p.d) return;
          const d = (p.x - mx) ** 2 + (p.y - my) ** 2; if (d < bd) { bd = d; best = p; }
        });
      }
      show();
      if (!best) return hideTip();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(best.sx, best.sy, radius() + 2.4, 0, 6.283); ctx.fill();
      ctx.fillStyle = COL_DARK[best.d]; ctx.beginPath(); ctx.arc(best.sx, best.sy, radius() + .8, 0, 6.283); ctx.fill();
      showTip(e.clientX, e.clientY, best.f.nom, `${REG[best.f.r].nom} · ${SHORT[best.d]}`);
    }
    cv.addEventListener('pointermove', pick);
    cv.addEventListener('pointerdown', pick);
    cv.addEventListener('pointerleave', () => { if (done) show(); hideTip(); });

    /* Légende filtrante */
    const legend = $('dotLegend');
    D.disciplines.forEach((nom, i) => {
      legend.append(el('button', {
        type: 'button', 'aria-pressed': 'false', title: `${nom} : ${fmt(byDisc[i])} festivals`,
        onclick(ev) {
          filter = filter === i ? -1 : i;
          legend.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-pressed', k === filter));
          done = true; paintBase(); ev.currentTarget.blur();
        }
      }, el('i', { style: `background:${COL_DARK[i]}` }), SHORT[i]));
    });
  }

  /* ---------- Carte choroplèthe ---------- */
  const RAMP = [[244, 195, 217], [141, 0, 70]];
  const rampColor = t => `rgb(${RAMP[0].map((c, i) => Math.round(c + (RAMP[1][i] - c) * t)).join(',')})`;
  let metric = 'n', selected = topN[0].i, labels;
  const valueOf = (r, m = metric) => m === 'n' ? fmt(r.n) : fmt(r.d, 1);

  function choropleth() {
    const root = $('choro');
    root.append(svg('defs', {},
      svg('filter', { id: 'gap', x: '-5%', y: '-5%', width: '110%', height: '110%' }, svg('feMorphology', { operator: 'erode', radius: '1.5' })),
      svg('filter', { id: 'ring', x: '-8%', y: '-8%', width: '116%', height: '116%' },
        svg('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: '2.4', result: 'grown' }),
        svg('feFlood', { 'flood-color': '#17171c' }), svg('feComposite', { in2: 'grown', operator: 'in', result: 'edge' }),
        svg('feMerge', {}, svg('feMergeNode', { in: 'edge' }), svg('feMergeNode', { in: 'SourceGraphic' })))));
    METRO.forEach(r => {
      const g = svg('g', { class: 'reg', 'data-i': r.i });
      const shape = svg('g', { class: 'reg-shape', filter: 'url(#gap)' });
      D.geo[r.nom].forEach(d => shape.append(svg('path', { d, 'stroke-width': 2.6, 'stroke-linejoin': 'round' })));
      g.append(shape);
      g.addEventListener('click', () => select(r.i));
      g.addEventListener('pointermove', e => showTip(e.clientX, e.clientY, r.nom, `${fmt(r.n)} festivals · ${fmt(r.d, 1)} pour 100 000 hab.`));
      g.addEventListener('pointerleave', hideTip);
      root.append(g);
    });
    const zone = (() => { const all = [...root.querySelectorAll('.reg')].map(g => g.getBBox()); const x = Math.min(...all.map(b => b.x)), y = Math.min(...all.map(b => b.y)); return [x - 6, y - 6, Math.max(...all.map(b => b.x + b.width)) - x + 12, Math.max(...all.map(b => b.y + b.height)) - y + 12]; })();
    root.setAttribute('viewBox', zone.join(' '));
    labels = svg('g'); root.append(labels);
    // Étiquettes posées après coup, au-dessus des régions
    const offset = { 'Île-de-France': [4, 2], Corse: [0, 0], 'Grand Est': [8, 12], Occitanie: [-20, -10], 'Nouvelle-Aquitaine': [10, 0], 'Auvergne-Rhône-Alpes': [-6, 8], 'Hauts-de-France': [8, 6], Normandie: [8, 14], "Provence-Alpes-Côte d'Azur": [26, -2] };
    METRO.forEach(r => {
      const b = root.querySelector(`.reg[data-i="${r.i}"]`).getBBox();
      const o = offset[r.nom] || [0, 0];
      r.label = svg('text', { x: b.x + b.width / 2 + o[0], y: b.y + b.height / 2 + 7 + o[1] });
      labels.append(r.label);
    });
    METRO.forEach(r => {
      r.row = el('button', { type: 'button', class: 'rank-row', 'aria-pressed': 'false', onclick: () => select(r.i) },
        el('span', { class: 'rn', text: r.nom }), el('span', { class: 'rb' }, el('i')), el('span', { class: 'rv' }));
    });
    document.querySelectorAll('[data-metric]').forEach(b => b.addEventListener('click', () => {
      metric = b.dataset.metric;
      document.querySelectorAll('[data-metric]').forEach(x => x.setAttribute('aria-pressed', x === b));
      paintChoro();
    }));
    paintChoro(); select(selected);
  }

  function paintChoro() {
    const vals = METRO.map(r => r[metric]);
    const min = Math.min(...vals), max = Math.max(...vals);
    METRO.forEach(r => {
      const t = (r[metric] - min) / (max - min || 1);
      const col = rampColor(t);
      document.querySelectorAll(`.reg[data-i="${r.i}"] path`).forEach(p => { p.setAttribute('fill', col); p.setAttribute('stroke', col); });
      r.label.textContent = valueOf(r);
      r.label.setAttribute('fill', t > .42 ? '#fff' : '#17171c');
      r.row.querySelector('.rv').textContent = valueOf(r);
      r.row.querySelector('.rb i').style.width = (r[metric] / max * 100) + '%';
    });
    $('scaleMin').textContent = metric === 'n' ? fmt(min) : fmt(min, 1);
    $('scaleMax').textContent = metric === 'n' ? fmt(max) : fmt(max, 1);
    const rank = $('ranking');
    rank.replaceChildren(...[...METRO].sort((a, b) => b[metric] - a[metric]).map(r => r.row));
    renderPanel();
  }

  function select(i) {
    selected = i;
    METRO.forEach(r => {
      r.row.setAttribute('aria-pressed', r.i === i);
      const g = document.querySelector(`.reg[data-i="${r.i}"]`);
      g.classList.toggle('on', r.i === i);
      if (r.i === i) { g.setAttribute('filter', 'url(#ring)'); labels.before(g); } else g.removeAttribute('filter');
    });
    renderPanel();
  }

  function renderPanel() {
    const r = METRO.find(x => x.i === selected);
    const rankN = [...METRO].sort((a, b) => b.n - a.n).indexOf(r) + 1;
    const rankD = [...METRO].sort((a, b) => b.d - a.d).indexOf(r) + 1;
    const shares = regionDisc[r.i].map(c => c / r.n * 100);
    const nat = byDisc.map(c => c / F.length * 100);
    const gaps = shares.map((s, i) => [s - nat[i], i]).sort((a, b) => b[0] - a[0]);
    const [gap, di] = gaps[0];
    const old = F.filter(f => f.r === r.i && f.annee >= 1900).sort((a, b) => a.annee - b.annee)[0];
    const ord = n => n === 1 ? '1re' : `${n}e`;
    const panel = $('regionPanel');
    panel.replaceChildren(
      el('h3', { class: 'rp-name', text: r.nom }),
      el('div', { class: 'rp-stats' },
        el('p', {}, el('b', { text: fmt(r.n) }), el('span', { text: `festivals, ${ord(rankN)} sur 13` })),
        el('p', {}, el('b', { text: fmt(r.d, 1) }), el('span', { text: `pour 100 000 hab., ${ord(rankD)} sur 13` }))),
      el('p', { class: 'rp-text', text: `Sa marque : ${MARQUE[di]}, ${fmt(shares[di])} % de son offre, soit ${fmt(gap, 1)} points de plus que la moyenne nationale.${old ? ` Doyen daté du fichier : ${old.nom} (${old.annee}).` : ''}` }),
      el('button', { type: 'button', class: 'rp-link', text: `Voir les ${fmt(r.n)} festivals ${articleRegion(r.nom)}`, onclick() { setFilter({ region: r.i }); $('annuaire').scrollIntoView(); } })
    );
  }

  /* ---------- Disciplines ---------- */
  function disciplines() {
    const bar = $('segbar'), leg = $('segbarLegend');
    D.disciplines.forEach((nom, i) => {
      const pct = byDisc[i] / F.length * 100;
      const seg = el('div', { style: `flex:${byDisc[i]} 1 0;background:${COL_PAPER[i]}` }, pct >= 9 ? `${fmt(pct)} %` : '');
      seg.addEventListener('pointermove', e => showTip(e.clientX, e.clientY, `${fmt(pct, 1)} %`, `${nom} · ${fmt(byDisc[i])} festivals`));
      seg.addEventListener('pointerleave', hideTip);
      bar.append(seg);
      leg.append(el('span', {}, el('i', { style: `background:${COL_PAPER[i]}` }), nom, el('b', { text: `${fmt(byDisc[i])} · ${fmt(pct)} %` })));
    });
    const nat = byDisc.map(c => c / F.length * 100);
    const head = el('tr', {}, el('th', { scope: 'col', text: 'Région' }), ...SHORT.map(s => el('th', { scope: 'col', text: s })));
    const body = el('tbody');
    [...METRO].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).forEach(r => {
      const row = el('tr', {}, el('th', { scope: 'row', text: r.nom }));
      regionDisc[r.i].forEach((c, i) => {
        const pct = c / r.n * 100, gap = pct - nat[i];
        const a = clamp(Math.abs(gap) / 12, 0, 1);
        const rgb = gap >= 0 ? '196,0,95' : '12,101,168';
        const td = el('td', { text: fmt(pct), style: `background:rgba(${rgb},${(a * .95).toFixed(3)});color:${a > .55 ? '#fff' : 'inherit'}`, title: `${r.nom}, ${D.disciplines[i]} : ${fmt(pct, 1)} % (${gap >= 0 ? '+' : '−'}${fmt(Math.abs(gap), 1)} pt par rapport à la France)` });
        row.append(td);
      });
      body.append(row);
    });
    const foot = el('tfoot', {}, el('tr', {}, el('th', { scope: 'row', text: 'France entière' }), ...nat.map(p => el('td', { text: fmt(p) }))));
    $('heat').append(el('thead', {}, head), body, foot);
  }

  /* ---------- Saisons ---------- */
  function mekko() {
    const root = $('mekko');
    const max = Math.max(...perWeek);
    const names = ['Avant-saison', 'Plein été', 'Après-saison'];
    const dates = ['1er janv. au 20 juin', '21 juin au 5 sept.', '6 sept. au 31 déc.'];
    [0, 1, 2].forEach(i => {
      const pct = byPeriod[i] / knownPeriod * 100;
      root.append(el('div', { style: `flex:${days[i]} 1 0`, class: i === 1 ? 'on' : '', title: `${names[i]} : ${fmt(byPeriod[i])} festivals` },
        el('div', { class: 'lab' }, el('b', { text: `${fmt(pct)} %` }), el('span', { text: `${names[i]}, ${dates[i]}` })),
        el('div', { class: 'block', style: `height:${perWeek[i] / max * 62}%` }, el('span', { text: `${fmt(perWeek[i])} par semaine` }))));
    });
  }

  /* ---------- Histoire ---------- */
  function history() {
    const root = $('historyChart');
    const y0 = 1950, y1 = 2022;
    const series = []; for (let y = y0; y <= y1; y++) series.push([y, byYear[y] || 0]);
    const milestones = [
      ['FIBD – Festival d’Angoulême', 'Angoulême'], ['Jazz in Marciac', 'Marciac'], ["Festival international de théâtre de rue d'Aurillac", 'Aurillac'],
      ['Eurockéennes de Belfort', 'Eurockéennes'], ['Solidays', 'Solidays'], ['Hellfest Open Air', 'Hellfest']
    ].map(([nom, court]) => { const f = F.find(x => x.nom === nom); return f && f.annee ? { y: f.annee, court } : null; }).filter(Boolean);

    function draw() {
      const W = Math.max(320, root.clientWidth), small = W < 620, H = small ? 300 : 400;
      const m = { t: 34, r: 8, b: 26, l: 32 };
      const yMax = Math.ceil(Math.max(...series.map(s => s[1])) / 100) * 100;
      const X = y => m.l + (y - y0) / (y1 - y0) * (W - m.l - m.r);
      const Y = v => H - m.b - v / yMax * (H - m.t - m.b);
      const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Créations de festivals par an, de ${y0} à ${y1}, avec un pic en ${peak[0]}` });
      for (let v = 0; v <= yMax; v += 100) {
        s.append(svg('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), stroke: v ? '#ddd4c3' : '#17171c' }), svg('text', { x: m.l - 7, y: Y(v) + 4, 'text-anchor': 'end', text: v }));
      }
      for (let y = 1950; y <= 2020; y += small ? 20 : 10) s.append(svg('text', { x: X(y), y: H - 6, 'text-anchor': 'middle', text: y }));
      const solid = series.filter(d => d[0] <= 2019), tail = series.filter(d => d[0] >= 2019);
      const line = a => a.map((d, i) => `${i ? 'L' : 'M'}${X(d[0]).toFixed(1)} ${Y(d[1]).toFixed(1)}`).join('');
      s.append(svg('path', { d: `${line(solid)}L${X(2019)} ${Y(0)}L${X(y0)} ${Y(0)}Z`, fill: '#d6006f', opacity: '.1' }));
      s.append(svg('path', { d: line(tail), fill: 'none', stroke: '#8d857a', 'stroke-width': 2 }));
      s.append(svg('path', { d: line(solid), fill: 'none', stroke: '#c4005f', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      milestones.filter((_, i) => !small || i % 2 === 1).forEach((p, i) => {
        const v = byYear[p.y] || 0, up = 42 + (i % 2) * 24;
        s.append(svg('line', { x1: X(p.y), x2: X(p.y), y1: Y(v), y2: Y(v) - up, stroke: '#8d857a' }), svg('circle', { cx: X(p.y), cy: Y(v), r: 4, fill: '#c4005f', stroke: '#f6f1e7', 'stroke-width': 2 }), svg('text', { class: 'pin-label', x: X(p.y), y: Y(v) - up - 5, 'text-anchor': 'middle', text: `${p.court}, ${p.y}` }));
      });
      const pk = +peak[0];
      s.append(svg('circle', { cx: X(pk), cy: Y(peak[1]), r: 5, fill: '#c4005f', stroke: '#f6f1e7', 'stroke-width': 2 }), svg('text', { class: 'pin-label', x: X(pk) - 9, y: Y(peak[1]) + 1, 'text-anchor': 'end', text: `${peak[0]} : ${peak[1]}` }));
      const cross = svg('line', { y1: m.t, y2: H - m.b, stroke: '#17171c', visibility: 'hidden' });
      const mark = svg('circle', { r: 5, fill: '#c4005f', stroke: '#fff', 'stroke-width': 2, visibility: 'hidden' });
      const hit = svg('rect', { x: m.l, y: 0, width: W - m.l - m.r, height: H - m.b, fill: 'transparent' });
      s.append(cross, mark, hit);
      const move = e => {
        const r = s.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width * W;
        const year = clamp(Math.round(y0 + (px - m.l) / (W - m.l - m.r) * (y1 - y0)), y0, y1);
        const v = byYear[year] || 0;
        cross.setAttribute('x1', X(year)); cross.setAttribute('x2', X(year)); cross.setAttribute('visibility', 'visible');
        mark.setAttribute('cx', X(year)); mark.setAttribute('cy', Y(v)); mark.setAttribute('visibility', 'visible');
        showTip(e.clientX, e.clientY, `${v} festival${v > 1 ? 's' : ''}`, `créé${v > 1 ? 's' : ''} en ${year}`);
      };
      hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
      hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); mark.setAttribute('visibility', 'hidden'); hideTip(); });
      root.replaceChildren(s);
    }
    draw();
    let w = root.clientWidth;
    new ResizeObserver(() => { if (root.clientWidth !== w) { w = root.clientWidth; draw(); } }).observe(root);
  }

  /* ---------- Corse ---------- */
  const corseColor = c => COL_DARK[{ 'Musiques actuelles': 0, 'Musiques classiques': 0, Théâtre: 1, 'Livre et littérature': 2, 'Cinéma et audiovisuel': 3 }[c.domaine]];
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const corseSub = c => `${c.commune} · ${MOIS[c.mois - 1]} · ${c.domaine}`;

  function corsica() {
    const root = $('corseMap');
    const shape = D.geo.Corse.map(d => svg('path', { d, fill: '#d6e8ec' }));
    root.append(...shape);
    const b = (() => { const g = svg('g'); shape.forEach(p => g.append(p)); root.append(g); return g.getBBox(); })();
    const pad = 8, side = b.width * .34;
    root.setAttribute('viewBox', `${b.x - side} ${b.y - pad} ${b.width + side * 2} ${b.height + pad * 2}`);
    const unit = b.height / 100;
    const LON = [8.535, 9.56], LAT = [41.365, 43.03];
    const X = lon => b.x + (lon - LON[0]) / (LON[1] - LON[0]) * b.width;
    const Y = lat => b.y + (LAT[1] - lat) / (LAT[1] - LAT[0]) * b.height;
    const towns = {};
    corse.forEach(c => { (towns[`${c.lat},${c.lon}`] = towns[`${c.lat},${c.lon}`] || []).push(c); });
    Object.values(towns).forEach(list => {
      list.forEach((c, i) => {
        const a = i * 2.39996, r = i ? Math.sqrt(i) * unit * 2.55 : 0;
        const x = X(c.lon) + Math.cos(a) * r, y = Y(c.lat) + Math.sin(a) * r;
        const g = svg('g', { class: 'fest', tabindex: 0, role: 'img', 'aria-label': `${c.nom}, ${corseSub(c)}` },
          svg('circle', { cx: x, cy: y, r: unit * 2.4, fill: 'transparent' }),
          svg('circle', { cx: x, cy: y, r: unit * 1.35, fill: corseColor(c), stroke: '#0b1d27', 'stroke-width': unit * .28 }));
        g.addEventListener('pointermove', e => showTip(e.clientX, e.clientY, c.nom, corseSub(c)));
        g.addEventListener('pointerleave', hideTip);
        g.addEventListener('focus', () => { const r = g.getBoundingClientRect(); showTip(r.right, r.top, c.nom, corseSub(c)); });
        g.addEventListener('blur', hideTip);
        root.append(g);
      });
    });
    [['Bastia', 9.56, 42.70, 1], ['Porto-Vecchio', 9.42, 41.59, 1], ['Calvi', 8.62, 42.60, -1], ['Ajaccio', 8.52, 41.86, -1]].forEach(([n, lon, lat, dir]) => {
      root.append(svg('text', { x: X(lon) + dir * unit * 3, y: Y(lat) + unit, 'text-anchor': dir > 0 ? 'start' : 'end', 'font-size': unit * 2.7, 'font-weight': 600, fill: '#f6f1e7', 'font-family': 'IBM Plex Sans, sans-serif', text: n }));
    });

    const months = $('corseMonths');
    ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].forEach((lab, i) => {
      const list = corse.filter(c => c.mois === i + 1);
      const col = el('div', { class: 'month' });
      list.forEach(c => {
        const b2 = el('button', { type: 'button', style: `background:${corseColor(c)}`, 'aria-label': `${c.nom}, ${corseSub(c)}` });
        b2.addEventListener('pointerenter', e => showTip(e.clientX, e.clientY, c.nom, corseSub(c)));
        b2.addEventListener('pointerleave', hideTip);
        b2.addEventListener('focus', () => { const r = b2.getBoundingClientRect(); showTip(r.right, r.top, c.nom, corseSub(c)); });
        b2.addEventListener('blur', hideTip);
        col.append(b2);
      });
      col.append(el('span', { text: lab, title: MOIS[i] }));
      months.append(col);
    });
    const groups = [['Musique', c => /^Musiques/.test(c.domaine)], ['Cinéma', c => /^Cinéma/.test(c.domaine)], ['Livre', c => /^Livre/.test(c.domaine)], ['Théâtre', c => c.domaine === 'Théâtre']];
    groups.forEach(([n, test]) => {
      const m = corse.filter(test);
      $('corseLegend').append(el('span', {}, el('i', { style: `background:${corseColor(m[0])}` }), `${n} (${m.length})`));
    });
    [...corse].sort((a, c) => a.mois - c.mois || a.nom.localeCompare(c.nom, 'fr')).forEach(c => {
      const title = c.url ? el('a', { href: c.url, rel: 'noopener', target: '_blank', text: c.nom }) : el('span', { text: c.nom });
      $('corseList').append(el('li', {}, title, el('small', { text: corseSub(c) })));
    });
  }

  /* ---------- Économie ---------- */
  function economy() {
    const rows = [['Charges artistiques', 9, 1], ['Technique, logistique, sécurité', 6, 1], ['Autres charges', 4, 1], ['Total des charges', 6, 1, 'sep'], ['Total des recettes', 4, 0], ['Inflation (Insee)', 2, 0]];
    const root = $('ecoBars');
    rows.forEach(([label, v, hot, sep]) => root.append(el('div', { class: `eco-row ${hot ? 'hot' : ''} ${sep || ''}` },
      el('span', { text: label }), el('span', { class: 'eco-bar' }, el('i', { style: `width:${v / 9 * 78}%` }), `+${v} %`))));
  }

  /* ---------- Annuaire ---------- */
  const STEP = 40;
  let shown = STEP, results = F;
  const search = F.map(f => norm(f.nom));

  function directory() {
    const opt = (sel, all, items) => { sel.append(el('option', { value: '', text: all })); items.forEach(([v, t]) => sel.append(el('option', { value: v, text: t }))); };
    opt($('fRegion'), 'Toutes les régions', REG.map((r, i) => [i, r.nom]).sort((a, b) => a[1].localeCompare(b[1], 'fr')));
    opt($('fDisc'), 'Toutes les disciplines', D.disciplines.map((d, i) => [i, d]));
    opt($('fPeriod'), 'Toute l\'année', D.periodes.map((p, i) => [i, ['Avant-saison (1er janv. au 20 juin)', 'Plein été (21 juin au 5 sept.)', 'Après-saison (6 sept. au 31 déc.)', 'Non précisée'][i]]));
    ['fName', 'fRegion', 'fDisc', 'fPeriod'].forEach(id => $(id).addEventListener('input', () => { shown = STEP; runSearch(); }));
    $('moreRows').addEventListener('click', () => { shown += STEP; renderRows(); });
    $('resetFilters').addEventListener('click', () => setFilter({}));
    $('downloadCsv').addEventListener('click', downloadCsv);
    runSearch();
  }

  function setFilter({ region = '' }) {
    $('fName').value = ''; $('fDisc').value = ''; $('fPeriod').value = '';
    $('fRegion').value = region; shown = STEP; runSearch();
  }

  function runSearch() {
    const q = norm($('fName').value.trim());
    const [r, d, p] = ['fRegion', 'fDisc', 'fPeriod'].map(id => $(id).value);
    results = F.filter((f, i) => (!q || search[i].includes(q)) && (r === '' || f.r === +r) && (d === '' || f.d === +d) && (p === '' || f.p === +p))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
    renderRows();
  }

  function renderRows() {
    const n = results.length;
    $('resultCount').textContent = `${fmt(n)} festival${n > 1 ? 's' : ''}`;
    const rows = results.slice(0, shown).map(f => el('tr', {},
      el('td', { text: f.nom }), el('td', { text: REG[f.r].nom }),
      el('td', {}, el('span', { class: 'disc' }, el('i', { style: `background:${COL_PAPER[f.d]}` }), SHORT[f.d])),
      el('td', { text: ['Avant-saison', 'Plein été', 'Après-saison', 'Non précisée'][f.p] }),
      el('td', { class: 'num', text: f.annee || '–' })));
    if (!n) rows.push(el('tr', {}, el('td', { class: 'empty', colspan: 5, text: 'Aucun festival ne correspond. Essayez un autre mot ou retirez un filtre.' })));
    $('resultRows').replaceChildren(...rows);
    $('moreRows').hidden = shown >= n;
    $('moreRows').textContent = `Afficher ${fmt(Math.min(STEP, Math.max(0, n - shown)))} de plus`;
  }

  function downloadCsv() {
    const esc = v => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [['Festival', 'Région', 'Discipline', 'Période', 'Année de création'].join(';'),
      ...results.map(f => [esc(f.nom), esc(REG[f.r].nom), esc(D.disciplines[f.d]), esc(D.periodes[f.p]), f.annee || ''].join(';'))];
    const url = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = el('a', { href: url, download: 'festivals-selection.csv' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- Page ---------- */
  function page() {
    const bar = document.querySelector('.topbar');
    const onScroll = () => bar.classList.toggle('scrolled', scrollY > 40);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(n => io.observe(n));
  }

  page();
  heroMap();
  choropleth();
  disciplines();
  mekko();
  history();
  corsica();
  economy();
  directory();
})();
