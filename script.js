'use strict';

const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Menu mobile ----------
const menuBtn = $('.menu-btn');
const links = $('.links');
if (menuBtn && links) {
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });
}

document.querySelectorAll('[data-annee]').forEach((n) => { n.textContent = new Date().getFullYear(); });

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------- Liste des commandes (page d'accueil) ----------
const data = window.CYBER_COMMANDES;
if (data && $('#liste')) {
  const total = data.reduce((n, c) => n + c.commands.length, 0);
  const $nb = $('#nb-commandes');
  if ($nb) $nb.textContent = total;
  const $cats = $('#cats');
  const $liste = $('#liste');
  const $recherche = $('#recherche');
  let categorie = 'toutes';

  const boutonCat = (id, label, n) => {
    const b = el('button', `cat${id === categorie ? ' active' : ''}`, label);
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(id === categorie));
    b.append(el('small', null, n));
    b.addEventListener('click', () => { categorie = id; afficher(); });
    return b;
  };

  function afficher() {
    $cats.replaceChildren(boutonCat('toutes', 'Toutes', total), ...data.map((c) => boutonCat(c.id, `${c.emoji} ${c.label}`, c.commands.length)));
    const q = $recherche.value.trim().toLowerCase().replace(/^\//, '');
    const cmds = data
      .filter((c) => categorie === 'toutes' || c.id === categorie)
      .flatMap((c) => c.commands.map((cmd) => ({ ...cmd, emoji: c.emoji })))
      .filter((cmd) => !q || cmd.name.includes(q) || cmd.desc.toLowerCase().includes(q) || cmd.subs.some((s) => s.name.includes(q)));

    if (!cmds.length) { $liste.replaceChildren(el('p', 'vide', 'Aucune commande trouvée.')); return; }
    $liste.replaceChildren(...cmds.map((cmd, i) => {
      const card = el('article', 'cmd');
      card.style.animationDelay = `${Math.min(i, 20) * 15}ms`;
      const head = el('div', 'cmd-head');
      head.append(el('span', null, cmd.emoji), el('span', 'cmd-name', `/${cmd.name}`));
      if (cmd.staff) head.append(el('span', 'tag-staff', 'staff'));
      card.append(head, el('p', null, cmd.desc));
      if (cmd.subs.length) {
        const subs = el('div', 'subs');
        subs.append(...cmd.subs.map((s) => { const t = el('span', null, s.name); t.title = s.desc; return t; }));
        card.append(subs);
      }
      return card;
    }));
  }
  $recherche.addEventListener('input', afficher);
  afficher();
}

// ---------- Compteurs animés ----------
function compter(node) {
  const target = parseInt(node.textContent, 10);
  if (!Number.isFinite(target) || reduceMotion) return;
  const suffix = node.textContent.replace(/^\d+/, '');
  const start = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - start) / 1200);
    node.textContent = Math.round(target * (1 - (1 - p) ** 3)) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- Halo qui suit la souris sur les cartes ----------
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--x', `${e.clientX - r.left}px`);
    card.style.setProperty('--y', `${e.clientY - r.top}px`);
  });
});

// ---------- Boutons « copier la commande » ----------
document.querySelectorAll('.cmd-copy').forEach((b) => {
  b.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
    } catch {
      const t = el('textarea'); t.value = b.dataset.copy; document.body.append(t); t.select();
      document.execCommand('copy'); t.remove();
    }
    b.classList.add('copied');
    setTimeout(() => b.classList.remove('copied'), 1600);
  });
});

// ---------- Apparition douce au défilement ----------
const io = 'IntersectionObserver' in window && !reduceMotion ? new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('visible');
    if (e.target.matches('.counters')) e.target.querySelectorAll('b').forEach(compter);
    io.unobserve(e.target);
  }
}, { threshold: 0.12 }) : null;
document.querySelectorAll('.card, .section > h2, .faq details, .split > *, .step, .release, .legal article, .counters').forEach((n) => {
  if (io) { n.classList.add('reveal'); io.observe(n); }
});

// ---------- Statut de Cyber (via le widget Discord) ----------
const cfg = window.CYBER_CONFIG || {};
const pills = document.querySelectorAll('[data-statut]');
const carte = $('#statut-carte');

function afficherStatut(etat, titre, detail) {
  pills.forEach((p) => {
    p.classList.add('show');
    p.querySelector('.dot-status').className = `dot-status ${etat}`;
    p.querySelector('.pill-txt').textContent = etat === 'on' ? 'En ligne' : etat === 'off' ? 'Hors ligne' : 'Statut inconnu';
  });
  if (carte) {
    carte.className = `status-card ${etat}`;
    $('#statut-point').className = `dot-status ${etat}`;
    $('#statut-titre').textContent = titre;
    $('#statut-detail').textContent = detail;
    $('#statut-heure').textContent = `Vérifié à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
}

async function verifierStatut() {
  if (!/^\d{17,20}$/.test(cfg.statutServeurId || '')) {
    if (carte) afficherStatut('', 'Statut bientôt disponible', 'L\'indicateur en direct sera activé avec le serveur de support de Cyber.');
    return;
  }
  try {
    const r = await fetch(`https://discord.com/api/guilds/${cfg.statutServeurId}/widget.json`, { cache: 'no-store' });
    if (!r.ok) throw new Error(String(r.status));
    const w = await r.json();
    const nom = (cfg.nomDuBot || 'Cyber').toLowerCase();
    const enLigne = (w.members || []).some((m) => (m.username || '').toLowerCase() === nom && m.status !== 'offline');
    if (enLigne) afficherStatut('on', '✅ Cyber est en ligne', 'Toutes les commandes fonctionnent normalement.');
    else afficherStatut('off', '🔴 Cyber est hors ligne', 'Le bot est en maintenance ou redémarre. Réessaie dans quelques minutes.');
  } catch {
    afficherStatut('', 'Statut indisponible', 'Impossible de joindre Discord pour le moment.');
  }
}
verifierStatut();
setInterval(verifierStatut, 60_000);

// ---------- Chiffres en direct : membres du serveur de support (invitation publique Discord) ----------
const blocSupport = document.querySelectorAll('[data-support]');
if (blocSupport.length) {
  fetch('https://discord.com/api/v10/invites/erqHM5s8Vz?with_counts=true')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((inv) => {
      const n = inv.approximate_member_count;
      if (!Number.isFinite(n) || n < 1) return;
      const langue = document.documentElement.lang === 'en' ? 'en-US' : 'fr-FR';
      blocSupport.forEach((b) => {
        b.querySelector('[data-support-membres]').textContent = n.toLocaleString(langue);
        b.hidden = false;
      });
    })
    .catch(() => {}); // Discord injoignable : le compteur reste caché
}

// ---------- Captures du tableau de bord (onglets) ----------
const capture = document.querySelector('#capture img');
document.querySelectorAll('[data-capture]').forEach((btn, i, tous) => {
  btn.addEventListener('click', () => {
    tous.forEach((b) => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
    const src = `assets/captures/${btn.dataset.capture}.webp`;
    if (capture.getAttribute('src') === src) return;
    capture.classList.add('change');
    const img = new Image();
    img.onload = img.onerror = () => { capture.src = src; capture.alt = btn.dataset.alt; capture.classList.remove('change'); };
    img.src = src;
  });
  // Flèches gauche/droite pour passer d'un onglet à l'autre au clavier
  btn.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const suivant = tous[(i + (e.key === 'ArrowRight' ? 1 : tous.length - 1)) % tous.length];
    suivant.focus(); suivant.click();
  });
});

// ---------- Fond : réseau de nœuds connectés ----------
(function reseau() {
  const cv = document.getElementById('reseau');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  let w, h, dpr, nodes = [], raf = null;
  const souris = { x: -9999, y: -9999 };
  const DIST = 140;

  function taille() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(90, Math.round((w * h) / 17000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.8, phase: Math.random() * Math.PI * 2,
    }));
  }

  function dessiner(t) {
    ctx.clearRect(0, 0, w, h);
    for (const a of nodes) {
      if (!reduceMotion) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = w + 20; if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20; if (a.y > h + 20) a.y = -20;
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < DIST) {
          ctx.strokeStyle = `rgba(255, 61, 90, ${(1 - d / DIST) * 0.34})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const dm = Math.hypot(a.x - souris.x, a.y - souris.y);
      if (dm < 180) {
        ctx.strokeStyle = `rgba(255, 122, 140, ${(1 - dm / 180) * 0.55})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(souris.x, souris.y); ctx.stroke();
      }
      const lueur = reduceMotion ? 0.7 : 0.55 + Math.sin(t / 900 + a.phase) * 0.35;
      ctx.fillStyle = `rgba(255, 90, 110, ${lueur})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduceMotion) raf = requestAnimationFrame(dessiner);
  }

  taille();
  dessiner(0);
  window.addEventListener('resize', () => { taille(); if (reduceMotion) dessiner(0); });
  window.addEventListener('pointermove', (e) => { souris.x = e.clientX; souris.y = e.clientY; });
  window.addEventListener('pointerleave', () => { souris.x = souris.y = -9999; });
  document.addEventListener('visibilitychange', () => {
    if (reduceMotion) return;
    if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(dessiner);
  });
})();

// ---------- Démo animée : Cyber en action dans Discord ----------
(function demo() {
  const feed = document.getElementById('demo-feed');
  const input = document.querySelector('.demo-input');
  const typing = document.getElementById('demo-typing');
  if (!feed) return;
  const heure = () => `Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  const pause = (ms) => new Promise((r) => setTimeout(r, reduceMotion ? 0 : ms));
  const COULEURS = { Léo: '#5865f2', Spam_bot: '#ed4245', Enzo: '#ff3d5a', Maya: '#3ba55d' };

  function ajouter(auteur, contenu, opts = {}) {
    const m = el('div', 'msg');
    const av = el('div', 'av');
    if (auteur === 'Cyber') { const i = el('img'); i.src = 'assets/logo.webp'; i.alt = ''; av.append(i); }
    else { av.textContent = auteur[0]; av.style.background = COULEURS[auteur] || '#4e5058'; }
    const corps = el('div');
    const who = el('div', 'who', auteur);
    if (auteur === 'Cyber') who.append(el('span', 'app', 'APP'));
    who.append(el('time', null, heure()));
    corps.append(who);
    if (contenu) corps.append(el('div', `txt${opts.cmd ? ' cmd' : ''}`, contenu));
    if (opts.embed) corps.append(opts.embed);
    m.append(av, corps);
    feed.append(m);
    while (feed.children.length > 6) feed.firstElementChild.remove();
    return m;
  }

  function embed(titre, lignes, extra) {
    const e = el('div', 'emb');
    e.append(el('b', null, titre));
    for (const l of lignes) {
      const d = el('div');
      for (const part of l) d.append(typeof part === 'string' ? part : part);
      e.append(d);
    }
    if (extra) e.append(extra);
    return e;
  }
  const mention = (n) => el('span', 'mention', `@${n}`);

  async function taper(texte) {
    input.classList.add('typing');
    typing.textContent = '';
    for (const c of texte) { typing.textContent += c; await pause(55); }
    await pause(350);
    input.classList.remove('typing');
    typing.textContent = 'Envoyer un message dans #général';
  }

  const scenes = [
    async () => {
      ajouter('Cyber', null, { embed: embed('👋 Nouveau membre', [['Bienvenue ', mention('Léo'), ' sur ', el('b', null, 'Mon serveur'), ' ! Tu es notre 128ᵉ membre 🎉']]) });
    },
    async () => {
      const spam = ajouter('Spam_bot', 'nitro gratuit ici 🎁 discord.gg/free-nitro');
      await pause(1100);
      spam.classList.add('deleted');
      await pause(500);
      const w = ajouter('Cyber', null, { embed: embed('🤖 Automod', [[mention('Spam_bot'), ', invitation Discord interdite (1/3).']]) });
      w.querySelector('.emb').style.borderLeftColor = '#ffc457';
      await pause(1400);
      spam.classList.add('gone');
      await pause(400);
      spam.remove();
    },
    async () => {
      await taper('/rang');
      ajouter('Enzo', '/rang', { cmd: true });
      await pause(600);
      const bar = el('div', 'bar'); const fill = el('span'); bar.append(fill);
      ajouter('Cyber', null, { embed: embed('📈 Rang de Enzo', [['Niveau ', el('b', null, '12'), ' · Classement ', el('b', null, '#3')], ['1 840 / 2 400 XP']], bar) });
      await pause(80); fill.style.width = '77%';
    },
    async () => {
      await taper('/ticket ouvrir');
      ajouter('Maya', '🎫 Ouvrir un ticket');
      await pause(600);
      const b = el('span', 'btn-d', '🔒 Fermer le ticket');
      ajouter('Cyber', null, { embed: embed('🎫 Ticket ouvert', [['Ton ticket est prêt : ', el('b', null, '#ticket-0042')], ['L\'équipe va te répondre.']], b) });
    },
    async () => {
      await taper('/sousreseau 10.0.0.0/26');
      ajouter('Enzo', '/sousreseau 10.0.0.0/26', { cmd: true });
      await pause(600);
      ajouter('Cyber', null, { embed: embed('🧮 10.0.0.0/26', [['Masque ', el('b', null, '255.255.255.192')], ['Broadcast ', el('b', null, '10.0.0.63'), ' · ', el('b', null, '62'), ' hôtes']]) });
    },
  ];

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(feed);
  }
  (async () => {
    if (reduceMotion) { for (const s of scenes) await s(); return; }
    for (let i = 0; ; i = (i + 1) % scenes.length) {
      while (!visible || document.hidden) await pause(500);
      await scenes[i]();
      await pause(2600);
    }
  })();
})();

// ---------- Visite guidée : les étapes défilent toutes seules (pause au survol) ----------
document.querySelectorAll('[data-visite]').forEach((visite) => {
  const onglets = [...visite.querySelectorAll('.visite-onglet')];
  const DUREE = 7000;
  visite.style.setProperty('--visite-duree', DUREE + 'ms');
  let actuel = 0, minuteur = null, reste = DUREE, debut = 0, enVue = false, survol = false;
  const montrer = (i, focus) => {
    actuel = (i + onglets.length) % onglets.length;
    onglets.forEach((o, j) => {
      const on = j === actuel;
      o.classList.toggle('actif', on);
      o.setAttribute('aria-selected', on);
      o.tabIndex = on ? 0 : -1;
      const p = document.getElementById(o.getAttribute('aria-controls'));
      p.hidden = !on;
      p.classList.toggle('actif', on);
    });
    if (focus) onglets[actuel].focus();
    reste = DUREE;
    planifier();
  };
  const planifier = () => {
    clearTimeout(minuteur);
    const pause = reduceMotion || !enVue || survol;
    visite.classList.toggle('pause', pause);
    if (pause) return;
    debut = Date.now();
    minuteur = setTimeout(() => montrer(actuel + 1), reste);
  };
  const arreter = () => { if (!visite.classList.contains('pause')) reste = Math.max(0, reste - (Date.now() - debut)); };
  onglets.forEach((o, i) => {
    o.addEventListener('click', () => montrer(i));
    o.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); montrer(actuel + (e.key === 'ArrowRight' ? 1 : -1), true); }
    });
  });
  visite.addEventListener('mouseenter', () => { arreter(); survol = true; planifier(); });
  visite.addEventListener('mouseleave', () => { survol = false; planifier(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) arreter(); enVue = e.isIntersecting; planifier(); }, { threshold: 0.3 }).observe(visite);
  } else { enVue = true; planifier(); }
  onglets.forEach((o, j) => { o.tabIndex = j === 0 ? 0 : -1; });
});
