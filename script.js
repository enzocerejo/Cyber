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
