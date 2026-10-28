'use strict';
// Tableau de bord de Cyber : application d'une seule page, sans framework.

const $app = document.getElementById('app');
const $account = document.getElementById('account');
const $toast = document.getElementById('toast');

// Sur le site GitHub, un « adaptateur » remplace le serveur du bot (connexion Discord + mode aperçu)
const ADAPTER = window.CYBER_PANEL || null;
const LOGO = ADAPTER?.logo || '/logo.png';

let me = null;          // utilisateur connecté + ses serveurs
let data = null;        // données du serveur ouvert
let currentGuild = null;

// ---------- Petits outils ----------
function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let toastTimer;
function toast(msg, ok = true) {
  $toast.textContent = msg;
  $toast.className = `toast show ${ok ? 'ok' : 'err'}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $toast.className = 'toast'; }, 3200);
}

async function api(method, url, body) {
  if (ADAPTER) return ADAPTER.request(method, url, body);
  const r = await fetch(`/api${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Cyber': '1' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(json.error || `Erreur ${r.status}`), { status: r.status });
  return json;
}

// ---------- Icônes (traits SVG, sans fichier externe) ----------
const ICONES = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  sliders: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6',
  userPlus: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M19 8v6 M22 11h-6',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  trend: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6',
  ticket: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z M13 5v2 M13 11v2 M13 17v2',
  volume: 'M11 5L6 9H2v6h4l5 4V5z M15.5 8.5a5 5 0 0 1 0 7 M19 5a10 10 0 0 1 0 14',
  cap: 'M22 10L12 5 2 10l10 5 10-5z M6 12v5c3 3 9 3 12 0v-5',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  bot: 'M4 8h16v12H4z M12 8V4 M9 4h6 M9 13v2 M15 13v2',
  hash: 'M4 9h16 M4 15h16 M10 3L8 21 M16 3l-2 18',
  at: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9',
  alert: 'M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01',
  tag: 'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z M7 7h.01',
  trophy: 'M8 21h8 M12 17v4 M7 4h10v5a5 5 0 0 1-10 0z M17 5h3v2a3 3 0 0 1-3 3 M7 5H4v2a3 3 0 0 0 3 3',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
  layers: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  bulb: 'M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z M17 9a4 4 0 0 1 0 6 M20 6a8 8 0 0 1 0 12',
  gift: 'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  ban: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M4.9 4.9l14.2 14.2',
  check: 'M22 11.1V12a10 10 0 1 1-5.9-9.1 M22 4L12 14l-3-3',
  flask: 'M9 2h6 M10 2v6L4 19a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3L14 8V2 M7 15h10',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  back: 'M19 12H5 M12 19l-7-7 7-7',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  server: 'M2 3h20v8H2z M2 13h20v8H2z M6 7h.01 M6 17h.01',
  plus: 'M12 5v14 M5 12h14',
  sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  chevron: 'M9 18l6-6-6-6',
};
function icon(nom, cls = 'ico') {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', ICONES[nom] || ICONES.grid);
  svg.append(p);
  return svg;
}

// Carte avec en-tête (icône + titre + explication)
function carte(ico, titre, hint, ...enfants) {
  return h('div', { class: 'card' },
    titre ? h('div', { class: 'card-head' },
      ico ? h('span', { class: 'card-ico' }, icon(ico)) : null,
      h('div', {}, h('h3', { text: titre }), hint ? h('p', { class: 'hint', text: hint }) : null)) : null,
    ...enfants);
}

function guildIcon(g, cls = 'gicon') {
  const initials = g.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3);
  const url = g.icon && (g.icon.startsWith('http') ? g.icon : `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128`);
  return h('div', { class: cls }, url ? h('img', { src: url, alt: '' }) : initials);
}

// ---------- Champs de formulaire ----------
function field(label, input, hint) {
  return h('div', { class: 'field' }, h('label', { text: label }), input, hint ? h('small', { class: 'hint', text: hint }) : null);
}

function channelSelect(list, value, prefix = '#', none = '— Désactivé —') {
  const sel = h('select', {}, h('option', { value: '', text: none }));
  const groups = new Map();
  for (const c of list) {
    const key = c.parent || '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  for (const [parent, chans] of groups) {
    const target = parent ? h('optgroup', { label: parent }) : sel;
    for (const c of chans) target.append(h('option', { value: c.id, text: `${prefix}${c.name}` }));
    if (parent) sel.append(target);
  }
  sel.value = value || '';
  return sel;
}

function roleSelect(value, { onlyAssignable = false, none = '— Aucun —' } = {}) {
  const sel = h('select', {}, h('option', { value: '', text: none }));
  for (const r of data.roles) {
    const blocked = onlyAssignable && !r.assignable;
    sel.append(h('option', { value: r.id, disabled: blocked, text: `@${r.name}${blocked ? ' (au-dessus de Cyber)' : ''}` }));
  }
  sel.value = value || '';
  return sel;
}

function toggle(title, desc, checked, onchange) {
  const input = h('input', { type: 'checkbox', checked, onchange: (e) => { onchange(e.target.checked); marquerModifie(); } });
  return h('div', { class: 'toggle' },
    h('div', { class: 't-text' }, h('b', { text: title }), desc ? h('span', { text: desc }) : null),
    h('label', { class: 'switch' }, input, h('span', { class: 'slider' })));
}

function saveButton(getPatch, label = 'Enregistrer') {
  const btn = h('button', { class: 'btn save', text: label });
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.classList.add('chargement');
    try {
      const patch = getPatch();
      const res = await api('PUT', `/guilds/${currentGuild}/config`, patch);
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'automod') Object.assign(data.automod, v);
        else if (k === 'defi' || k === 'modules') data.config[k] = { ...(data.config[k] || {}), ...v };
        else data.config[k] = v;
      }
      toast(res?.message || '✅ Modifications enregistrées');
      remettreAZero();
      btn.classList.add('ok');
      setTimeout(() => btn.classList.remove('ok'), 1200);
    } catch (err) {
      toast(`❌ ${err.message}`, false);
    } finally {
      btn.disabled = false;
      btn.classList.remove('chargement');
    }
  });
  return h('div', { class: 'actions' }, h('span', { class: 'non-enregistre', text: '● Modifications non enregistrées' }), btn);
}

// ---------- Aperçus façon Discord (le texte est toujours échappé avant la mise en forme) ----------
function md(text, vars = {}) {
  let html = escapeHtml(text);
  for (const [k, v] of Object.entries(vars)) {
    html = html.split(escapeHtml(k)).join(v.mention ? `<span class="mention">${escapeHtml(v.text)}</span>` : escapeHtml(v.text));
  }
  html = html
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/(^|[^*])\*(?!\*)(.+?)\*/g, '$1<i>$2</i>')
    .replace(/\n/g, '<br>');
  const span = h('span', { class: 'md' });
  span.innerHTML = html;
  return span;
}

const heureDiscord = () => `Aujourd'hui à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
const avatarMoi = () => (me?.user?.avatar ? `https://cdn.discordapp.com/avatars/${me.user.id}/${me.user.avatar}.png?size=128` : 'https://cdn.discordapp.com/embed/avatars/0.png');

// Message de Cyber tel qu'il apparaîtra dans Discord
function discordMsg({ content = null, embed = null, buttons = [] } = {}) {
  const body = h('div', { class: 'dm-body' },
    h('div', { class: 'dm-head' }, h('b', { text: 'Cyber' }), h('span', { class: 'dm-app', text: 'APP' }), h('span', { class: 'dm-time', text: heureDiscord() })));
  if (content) body.append(h('div', { class: 'dm-content' }, content));
  if (embed) {
    const e = h('div', { class: 'dm-embed' });
    if (embed.color) e.style.borderLeftColor = embed.color;
    const main = h('div', { class: 'dm-embed-main' });
    if (embed.title) main.append(h('div', { class: 'dm-title', text: embed.title }));
    if (embed.desc) main.append(h('div', { class: 'dm-desc' }, embed.desc));
    for (const [n, v] of embed.fields || []) main.append(h('div', { class: 'dm-field' }, h('b', { text: n }), h('div', { text: v })));
    if (embed.footer) main.append(h('div', { class: 'dm-footer', text: embed.footer }));
    e.append(main);
    if (embed.thumb) e.append(h('img', { class: 'dm-thumb', src: embed.thumb, alt: '' }));
    body.append(e);
  }
  if (buttons.length) {
    body.append(h('div', { class: 'dm-buttons' }, buttons.map((b) => h('span', { class: `dm-btn ${b.style || 'grey'}` }, b.emoji ? h('span', { text: b.emoji }) : null, b.label))));
  }
  return h('div', { class: 'dmsg' }, h('img', { class: 'dm-av', src: LOGO, alt: '' }), body);
}

function apercuBox(build) {
  const box = h('div', { class: 'apercu' });
  const maj = () => { box.replaceChildren(build()); box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash'); };
  return { box, maj };
}

function messageEditor(value, def, vars, max, construire) {
  const ta = h('textarea', { maxLength: max, placeholder: def });
  ta.value = value || '';
  const compteur = h('span', { class: 'compteur' });
  const ap = apercuBox(() => construire(md(ta.value || def, vars)));
  const update = () => { compteur.textContent = `${ta.value.length} / ${max}`; ap.maj(); };
  ta.addEventListener('input', update);
  const chips = h('div', { class: 'chips' }, Object.keys(vars).map((k) => h('button', {
    type: 'button', class: 'chip var', text: k, title: 'Cliquer pour insérer',
    onclick: () => {
      const st = ta.selectionStart ?? ta.value.length;
      ta.value = ta.value.slice(0, st) + k + ta.value.slice(ta.selectionEnd ?? st);
      ta.focus(); update(); marquerModifie();
    },
  })), compteur);
  update();
  return { ta, node: h('div', {}, ta, chips, h('div', { class: 'apercu-label' }, h('span', { class: 'live-dot' }), 'Aperçu en direct dans Discord'), ap.box) };
}

// ---------- Modifications non enregistrées ----------
let modifie = false;
let confirmerSortie = false;
function marquerModifie() {
  if (modifie) return;
  modifie = true;
  document.body.classList.add('modifie');
}
function remettreAZero() { modifie = false; confirmerSortie = false; document.body.classList.remove('modifie'); }
function quitterSiPossible(aller) {
  if (modifie && !confirmerSortie) {
    confirmerSortie = true;
    toast('⚠️ Modifications non enregistrées : clique encore pour quitter sans enregistrer.', false);
    setTimeout(() => { confirmerSortie = false; }, 4000);
    return;
  }
  remettreAZero();
  aller();
}
window.addEventListener('beforeunload', (e) => { if (modifie) { e.preventDefault(); e.returnValue = ''; } });

// Compteurs animés
function animerNombres(racine) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  racine.querySelectorAll('[data-compte]').forEach((n) => {
    const cible = Number(n.dataset.compte);
    const pre = n.dataset.prefixe || '';
    const t0 = performance.now();
    const pas = (t) => {
      const p = Math.min(1, (t - t0) / 900);
      n.textContent = pre + Math.round(cible * (1 - (1 - p) ** 3));
      if (p < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  });
}

// Entrée en cascade des éléments
function cascade(enfants) {
  enfants.forEach((n, i) => { if (n instanceof Element) { n.classList.add('entree'); n.style.setProperty('--i', String(i)); } });
  return enfants;
}

// ---------- Pages ----------
function renderAccount() {
  $account.replaceChildren();
  if (!me) return;
  const u = me.user;
  const nom = u.globalName || u.username;
  const avatar = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : 'https://cdn.discordapp.com/embed/avatars/0.png';
  const lettre = h('span', { class: 'av-lettre', text: nom.slice(0, 1).toUpperCase() });
  const img = h('img', { src: avatar, alt: '' });
  img.addEventListener('error', () => img.replaceWith(lettre));
  $account.append(
    h('div', { class: 'moi' }, img, h('span', { class: 'name', text: nom })),
    h('button', {
      class: 'btn ghost small', title: 'Déconnexion', 'aria-label': 'Déconnexion',
      onclick: async () => {
        if (ADAPTER) ADAPTER.logout(); else await fetch('/logout', { method: 'POST' }).catch(() => {});
        me = null; data = null; currentGuild = null; location.hash = '#/'; render();
      },
    }, icon('logout'), h('span', { class: 'lbl', text: 'Déconnexion' })),
  );
}

function landing() {
  const err = new URLSearchParams(location.search).get('erreur') || ADAPTER?.error;
  return h('section', { class: 'landing' },
    err ? h('div', { class: 'error-banner', text: 'La connexion avec Discord a échoué. Réessaie.' }) : null,
    h('div', { class: 'hero' },
      h('div', { class: 'hero-logo' }, h('img', { src: LOGO, alt: 'Logo de Cyber' })),
      h('span', { class: 'kicker', text: 'Tableau de bord' }),
      h('h1', { text: 'CYBER' }),
      h('p', { text: 'Configure Cyber en quelques clics : modération, automod, niveaux, tickets, bienvenue et bien plus. Sans taper une seule commande.' }),
      ADAPTER
        ? h('div', { class: 'cta-row' },
          h('button', { class: 'btn big', text: 'Se connecter avec Discord', onclick: () => ADAPTER.login() }),
          ADAPTER.startDemo ? h('button', { class: 'btn big ghost', text: 'Essayer sans compte', onclick: async () => { ADAPTER.startDemo(); await boot(); } }) : null)
        : h('a', { class: 'btn big', href: '/login', text: 'Se connecter avec Discord' })),
    h('div', { class: 'features' }, cascade(
      [['shield', 'Automod', 'Anti-spam, anti-liens, mots interdits, sanctions automatiques.'],
        ['trend', 'Niveaux', 'XP, classement et rôles récompenses.'],
        ['ticket', 'Tickets', 'Support privé avec ton équipe en un clic.'],
        ['userPlus', 'Bienvenue', 'Messages personnalisés et rôle automatique.'],
        ['volume', 'Vocaux temporaires', 'Chaque membre crée son propre salon.'],
        ['cap', 'Académie', 'Cours réseau CCNA, quiz et défi du jour.']]
        .map(([i, t, d]) => h('div', { class: 'feature' }, h('span', { class: 'card-ico' }, icon(i)), h('b', { text: t }), h('span', { text: d }))))));
}

function serverList() {
  const withBot = me.guilds.filter((g) => g.botIn);
  return h('section', {},
    h('div', { class: 'page-head' },
      h('span', { class: 'kicker', text: 'Tes serveurs' }),
      h('h1', { class: 'page-title', text: 'Choisis un serveur' }),
      h('p', { class: 'page-sub', text: `Serveurs où tu as la permission « Gérer le serveur » · Cyber est présent sur ${withBot.length} d'entre eux.` })),
    me.guilds.length
      ? h('div', { class: 'guilds' }, cascade(me.guilds.map((g) => h('div', { class: `guild-card${g.botIn ? '' : ' off'}` },
        h('div', { class: 'guild-top' }, guildIcon(g)),
        h('div', { class: 'gname', text: g.name }),
        h('span', { class: `pill ${g.botIn ? 'on' : ''}`, text: g.botIn ? 'Cyber actif' : 'Pas encore invité' }),
        g.botIn
          ? h('a', { class: 'btn', href: `#/g/${g.id}/apercu` }, 'Configurer', icon('chevron'))
          : h('a', { class: 'btn ghost', href: g.invite, target: '_blank', rel: 'noopener' }, icon('plus'), 'Inviter Cyber')))))
      : h('p', { class: 'empty', text: 'Aucun serveur que tu peux gérer.' }));
}

// [id, icône, nom, module, réglage actif ?]
const TABS = [
  ['apercu', 'grid', 'Aperçu', null, null],
  ['general', 'sliders', 'Général', null, null],
  ['bienvenue', 'userPlus', 'Bienvenue', 'communaute', (c) => !!c.welcomeChannelId],
  ['automod', 'shield', 'Automod', 'communaute', () => !!data.automod.enabled],
  ['niveaux', 'trend', 'Niveaux', 'communaute', (c) => !!c.levelsEnabled],
  ['tickets', 'ticket', 'Tickets & vérification', 'communaute', (c) => !!c.ticketStaffRoleId],
  ['vocaux', 'volume', 'Vocaux temporaires', 'communaute', (c) => !!c.tempVoiceId],
  ['academie', 'cap', 'Académie', 'academie', (c) => !!c.defi?.channelId && c.defi?.actif !== false],
];
const GROUPES = { null: 'Serveur', communaute: 'Communauté', academie: 'Académie' };
let ongletActuel = 'apercu';

function guildPage(tab) {
  ongletActuel = TABS.some((t) => t[0] === tab) ? tab : 'apercu';
  const panel = h('div', { class: 'panel' });
  const views = { apercu: tabOverview, general: tabGeneral, bienvenue: tabWelcome, automod: tabAutomod, niveaux: tabLevels, tickets: tabTickets, vocaux: tabVoice, academie: tabAcademie };
  panel.append(...cascade(views[ongletActuel]().filter(Boolean)));
  panel.addEventListener('input', (e) => { if (!e.target.closest('.simu')) marquerModifie(); });
  panel.addEventListener('change', (e) => { if (!e.target.closest('.simu')) marquerModifie(); });

  const c = data.config;
  const nav = h('nav', { class: 'tabs', 'aria-label': 'Sections' });
  let groupe;
  for (const [id, ico, label, module, actif] of TABS) {
    const moduleOff = module && c.modules?.[module] === false;
    if (module !== groupe) {
      groupe = module;
      nav.append(h('div', { class: 'tab-group' }, h('span', { text: GROUPES[module] }), moduleOff ? h('span', { class: 'mini off', text: 'off' }) : null));
    }
    const on = actif ? actif(c) : null;
    nav.append(h('button', {
      class: `tab${id === ongletActuel ? ' active' : ''}${moduleOff ? ' dim' : ''}`,
      'aria-current': id === ongletActuel ? 'page' : null,
      onclick: () => { if (id !== ongletActuel) quitterSiPossible(() => { location.hash = `#/g/${currentGuild}/${id}`; }); },
    }, icon(ico), h('span', { class: 'tab-txt', text: label }), on === null ? null : h('span', { class: `etat${on ? ' on' : ''}`, title: on ? 'Activé' : 'Pas configuré' })));
  }

  return h('div', { class: 'layout' },
    h('aside', { class: 'sidebar' },
      h('div', { class: 'side-head' }, guildIcon(data.guild),
        h('div', { class: 'side-name' }, h('b', { text: data.guild.name }), h('small', { text: `${data.guild.memberCount} membres` }))),
      nav,
      h('a', { class: 'back', href: '#/serveurs', onclick: (e) => { e.preventDefault(); quitterSiPossible(() => { location.hash = '#/serveurs'; }); } }, icon('back'), 'Tous mes serveurs')),
    panel);
}

function choixModules() {
  const options = [
    ['communaute', 'shield', 'Communauté', 'Modération, automod, niveaux et XP, tickets, giveaways, rôles à boutons, bienvenue, vocaux temporaires, jeux.'],
    ['academie', 'cap', 'Académie', 'Cours réseau et cybersécurité niveau CCNA, glossaire, quiz avec classement, défi du jour, outils réseau, IA.'],
    ['tous', 'sparkles', 'Les deux', 'Tout Cyber : protège ta communauté et apprends le réseau et la cybersécurité.'],
  ];
  const choisir = async (id, carteEl) => {
    carteEl.classList.add('choisie');
    const modules = { communaute: id !== 'academie', academie: id !== 'communaute' };
    try {
      await api('PUT', `/guilds/${currentGuild}/config`, { modules, modulesChoisis: true });
      data.config.modules = modules;
      data.config.modulesChoisis = true;
      toast('✅ Modules enregistrés. Tu pourras changer dans l\'onglet Général.');
      setTimeout(render, 450);
    } catch (err) { carteEl.classList.remove('choisie'); toast(`❌ ${err.message}`, false); }
  };
  return h('section', { class: 'onboarding' },
    ...cascade([
      guildIcon(data.guild, 'gicon big'),
      h('span', { class: 'kicker', text: 'Première configuration' }),
      h('h1', { class: 'page-title', text: `Bienvenue sur ${data.guild.name} !` }),
      h('p', { class: 'page-sub', text: 'Que doit faire Cyber sur ce serveur ? Tu pourras changer à tout moment.' }),
      h('div', { class: 'choix' }, options.map(([id, ico, titre, desc]) => {
        const carteEl = h('button', { class: `choix-carte${id === 'tous' ? ' reco' : ''}`, type: 'button' },
          id === 'tous' ? h('span', { class: 'reco-badge', text: 'Recommandé' }) : null,
          h('span', { class: 'choix-ico' }, icon(ico)), h('b', { text: titre }), h('span', { text: desc }));
        carteEl.addEventListener('click', () => choisir(id, carteEl));
        return carteEl;
      })),
    ]));
}

function squelette() {
  return h('div', { class: 'layout' },
    h('aside', { class: 'sidebar sk-side' }, ...Array.from({ length: 8 }, () => h('div', { class: 'sk sk-line' }))),
    h('div', { class: 'panel' }, h('div', { class: 'sk sk-title' }), h('div', { class: 'sk sk-sub' }),
      ...Array.from({ length: 3 }, () => h('div', { class: 'sk sk-card' }))));
}

function header(title, desc) {
  const t = TABS.find((x) => x[0] === ongletActuel);
  return [h('div', { class: 'page-head' },
    h('div', { class: 'crumbs' },
      h('a', { href: '#/serveurs', text: 'Serveurs', onclick: (e) => { e.preventDefault(); quitterSiPossible(() => { location.hash = '#/serveurs'; }); } }),
      icon('chevron'), h('span', { text: data.guild.name }), icon('chevron'), h('span', { class: 'ici', text: title })),
    h('h2', {}, t ? h('span', { class: 'h-ico' }, icon(t[1])) : null, title),
    h('p', { class: 'desc', text: desc }))];
}

function tabOverview() {
  const s = data.stats;
  const c = data.config;
  const a = data.automod;
  const total = Math.max(1, s.humans + s.bots);
  const pctH = Math.round((s.humans / total) * 100);
  const barre = h('div', { class: 'meter' }, h('span', { class: 'meter-h' }), h('span', { class: 'meter-b' }));
  barre.firstChild.style.width = `${pctH}%`;
  barre.lastChild.style.width = `${100 - pctH}%`;
  const stat = (ico, v, l) => h('div', { class: 'stat' },
    h('span', { class: 'stat-ico' }, icon(ico)),
    h('div', {}, h('div', { class: 'v', 'data-compte': String(v), text: String(v) }), h('div', { class: 'l', text: l })));
  const aller = (tab) => () => { location.hash = `#/g/${currentGuild}/${tab}`; };
  const mod = (ico, name, on, tab, detail) => h('button', { class: `module${on ? ' actif' : ''}`, type: 'button', onclick: aller(tab) },
    h('span', { class: 'm-ico' }, icon(ico)),
    h('span', { class: 'm-txt' }, h('b', { text: name }), h('small', { text: detail || (on ? 'Activé' : 'Pas configuré') })),
    h('span', { class: `etat${on ? ' on' : ''}` }));
  return [
    ...header('Aperçu', `Vue d'ensemble de ${data.guild.name}.`),
    h('div', { class: 'overview' },
      h('div', { class: 'card hero-stat' },
        h('span', { class: 'kicker', text: 'Membres' }),
        h('div', { class: 'big-num', 'data-compte': String(data.guild.memberCount), text: String(data.guild.memberCount) }),
        barre,
        h('div', { class: 'legende' },
          h('span', {}, h('i', { class: 'pt h' }), `${s.humans} humains`),
          h('span', {}, h('i', { class: 'pt b' }), `${s.bots} bots`))),
      h('div', { class: 'stats' },
        stat('hash', s.channels, 'Salons'), stat('at', s.roles, 'Rôles'), stat('alert', s.warns, 'Avertissements'),
        stat('ticket', s.openTickets, 'Tickets ouverts'), stat('trophy', s.ranked, 'Membres classés'), stat('tag', s.tags, 'Tags'))),
    carte('layers', 'Modules', 'Ce qui est actif sur ton serveur. Clique pour configurer.',
      h('div', { class: 'modules' },
        mod('list', 'Logs', !!c.logChannelId, 'general'), mod('userPlus', 'Bienvenue', !!c.welcomeChannelId, 'bienvenue'),
        mod('at', 'Rôle automatique', !!c.autoRoleId, 'general'), mod('shield', 'Automod', a.enabled, 'automod'),
        mod('trend', 'Niveaux', c.levelsEnabled, 'niveaux', c.levelsEnabled ? `${Object.keys(c.levelRewards).length} récompense(s)` : null),
        mod('ticket', 'Tickets', !!c.ticketStaffRoleId, 'tickets'), mod('volume', 'Vocaux temporaires', !!c.tempVoiceId, 'vocaux'),
        mod('bulb', 'Suggestions', !!c.suggestionChannelId, 'general'), mod('cap', 'Module Académie', c.modules?.academie !== false, 'general'),
        mod('zap', 'Défi du jour', !!c.defi?.channelId && c.defi?.actif !== false, 'academie'))),
    leaderboardCard(),
  ];
}

function leaderboardCard() {
  return carte('trophy', 'Classement', null,
    data.leaderboard.length
      ? h('ol', { class: 'lb' }, data.leaderboard.map((u, i) => h('li', { class: i < 3 ? `top top${i + 1}` : '' },
        h('span', { class: 'pos', text: String(i + 1) }),
        u.avatar ? h('img', { src: u.avatar, alt: '' }) : h('span', { class: 'ph', text: u.name.slice(0, 1).toUpperCase() }),
        h('span', { class: 'who', text: u.name }),
        h('span', { class: 'score' }, h('span', { class: 'lvl', text: `Niv. ${u.level}` }), h('span', { class: 'xp', text: `${u.xp} XP` })))))
      : h('p', { class: 'empty', text: 'Personne n\'a encore gagné d\'XP.' }));
}

function tabGeneral() {
  const c = data.config;
  const logs = channelSelect(data.channels.text, c.logChannelId);
  const auto = roleSelect(c.autoRoleId, { onlyAssignable: true, none: '— Désactivé —' });
  const sugg = channelSelect(data.channels.text, c.suggestionChannelId);
  const mods = { communaute: c.modules?.communaute !== false, academie: c.modules?.academie !== false };
  return [
    ...header('Général', 'Les réglages de base de Cyber.'),
    carte('layers', 'Modules', 'Active les parties de Cyber dont ton serveur a besoin. Les commandes d\'un module désactivé sont masquées.',
      toggle('Communauté', 'Modération, automod, niveaux, tickets, giveaways, rôles, bienvenue, fun.', mods.communaute, (v) => { mods.communaute = v; }),
      toggle('Académie', 'Cours réseau et cybersécurité (CCNA), quiz, défi du jour, outils réseau, IA.', mods.academie, (v) => { mods.academie = v; })),
    h('div', { class: 'grid2' },
      carte('list', 'Logs', 'Sanctions, messages supprimés ou modifiés, tickets fermés, automod…', field('Salon des logs', logs)),
      carte('at', 'Rôle automatique', 'Donné à chaque nouveau membre dès son arrivée.', field('Rôle', auto))),
    carte('bulb', 'Suggestions', 'Salon où arrivent les idées envoyées avec /suggestion.', field('Salon des suggestions', sugg)),
    saveButton(() => ({ modules: { ...mods }, logChannelId: logs.value || null, autoRoleId: auto.value || null, suggestionChannelId: sugg.value || null })),
  ];
}

function tabAcademie() {
  const d = data.config.defi || {};
  let actif = d.actif !== false && !!d.channelId;
  const ch = channelSelect(data.channels.text, d.channelId, '#', '— Choisis un salon —');
  const heure = h('select', {}, Array.from({ length: 24 }, (_, i) => h('option', { value: String(i), text: `${String(i).padStart(2, '0')} h 00` })));
  heure.value = String(d.heure ?? 18);
  const role = roleSelect(d.roleId, { none: '— Aucune mention —' });
  const off = data.config.modules?.academie === false;
  const ap = apercuBox(() => {
    const r = data.roles.find((x) => x.id === role.value);
    return discordMsg({
      content: r ? h('span', { class: 'mention role', text: `@${r.name}` }) : null,
      embed: { color: '#4DA3FF', title: `🧠 Défi du jour · ${new Date().toLocaleDateString('fr-FR')}`,
        desc: md('**Combien d\'hôtes utilisables dans un /27 ?**\n\n🇦 30\n🇧 32\n🇨 62\n🇩 14'),
        fields: [['Comment jouer', 'Clique sur ta réponse : une seule tentative. +15 points si c\'est juste !']], footer: 'ITN · Masque de sous-réseau' },
      buttons: ['A', 'B', 'C', 'D'].map((l) => ({ label: l })),
    });
  });
  role.addEventListener('change', ap.maj);
  ap.maj();
  return [
    ...header('Académie', 'Cours réseau et cybersécurité niveau CCNA : /apprendre, /glossaire, /quiz, /osi, /port, /cisco, /ia.'),
    off ? h('div', { class: 'note warn' }, icon('alert'), 'Le module Académie est désactivé. Active-le dans l\'onglet Général.') : null,
    carte('zap', 'Défi du jour', 'Une question est publiée chaque jour. Chacun répond une seule fois (+15 points), la réponse est dévoilée au défi suivant.',
      toggle('Activer le défi du jour', null, actif, (v) => { actif = v; }),
      h('div', { class: 'row' }, field('Salon', ch), field('Heure (heure française)', heure)),
      field('Rôle à mentionner', role),
      h('div', { class: 'apercu-label' }, h('span', { class: 'live-dot' }), 'Exemple de défi publié'), ap.box),
    saveButton(() => ({ defi: { actif, channelId: ch.value || null, heure: Number(heure.value), roleId: role.value || null } })),
  ];
}

function tabWelcome() {
  const c = data.config;
  const ch = channelSelect(data.channels.text, c.welcomeChannelId);
  const vars = {
    '{membre}': { text: `@${me.user.globalName || me.user.username}`, mention: true },
    '{nom}': { text: me.user.username },
    '{serveur}': { text: data.guild.name },
    '{nombre}': { text: String(data.guild.memberCount + 1) },
  };
  const ed = messageEditor(c.welcomeMessage, data.defaults.welcomeMessage, vars, 1000, (texte) => discordMsg({
    content: h('span', { class: 'mention', text: `@${me.user.globalName || me.user.username}` }),
    embed: { title: '👋 Nouveau membre', desc: texte, thumb: avatarMoi(), fields: [['Compte créé', 'il y a 3 ans']], footer: `ID : ${me.user.id}` },
  }));
  return [
    ...header('Bienvenue', 'Accueille les nouveaux membres avec un message personnalisé.'),
    carte('message', 'Message de bienvenue', null,
      field('Salon de bienvenue (et des départs)', ch),
      field('Message', ed.node, 'Clique sur une variable pour l\'insérer. Laisse vide pour le message par défaut. Mise en forme : **gras**, *italique*, __souligné__, ~~barré~~, `code`.')),
    saveButton(() => ({ welcomeChannelId: ch.value || null, welcomeMessage: ed.ta.value.trim() || null })),
  ];
}

function tabAutomod() {
  const a = structuredClone(data.automod);
  const words = new Set(a.words);
  const exempt = new Set(a.exemptRoles);

  const wordChips = h('div', { class: 'chips' });
  const drawWords = () => wordChips.replaceChildren(...[...words].map((w) => h('span', { class: 'chip' }, w,
    h('button', { title: 'Retirer', text: '×', onclick: () => { words.delete(w); drawWords(); marquerModifie(); simuler(); } }))));
  const wordInput = h('input', { type: 'text', placeholder: 'Ajouter un mot puis Entrée', maxLength: 50 });
  const addWord = () => { const v = wordInput.value.trim().toLowerCase(); if (v) { words.add(v); wordInput.value = ''; drawWords(); marquerModifie(); simuler(); } };
  wordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addWord(); } });

  const roleChips = h('div', { class: 'chips' });
  const drawRoles = () => roleChips.replaceChildren(...[...exempt].map((id) => {
    const r = data.roles.find((x) => x.id === id);
    return h('span', { class: 'chip' }, `@${r?.name ?? 'rôle supprimé'}`,
      h('button', { title: 'Retirer', text: '×', onclick: () => { exempt.delete(id); drawRoles(); marquerModifie(); } }));
  }));
  const roleAdd = roleSelect('', { none: '— Ajouter un rôle —' });
  roleAdd.addEventListener('change', () => { if (roleAdd.value) { exempt.add(roleAdd.value); roleAdd.value = ''; drawRoles(); marquerModifie(); } });

  const maxMentions = h('input', { type: 'number', min: 2, max: 50, value: a.maxMentions });
  const timeoutAfter = h('input', { type: 'number', min: 1, max: 10, value: a.timeoutAfter });
  // Simulateur : mêmes règles que le bot (sauf l'anti-spam, qui dépend du rythme des messages)
  const essai = h('textarea', { placeholder: 'Tape un message pour voir comment l\'automod réagit…', maxLength: 500 });
  const verdict = h('div', { class: 'verdict' });
  function simuler() {
    const t = essai.value;
    if (!t.trim()) { verdict.className = 'verdict'; verdict.textContent = 'Le résultat s\'affiche ici.'; return; }
    let raison = null;
    const mentions = (t.match(/@\S+/g) || []).length;
    const lettres = t.replace(/[^a-zà-ÿ]/gi, '');
    if (!a.enabled) raison = null;
    else if (a.invites && /(discord\.gg|discord(app)?\.com\/invite)\/\w+/i.test(t)) raison = 'Invitation Discord interdite';
    else if (a.links && /https?:\/\/\S+/i.test(t)) raison = 'Liens interdits';
    else if (a.mentions && mentions >= Number(maxMentions.value)) raison = 'Mentions de masse';
    else if ([...words].some((w) => new RegExp(`(^|\\W)${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\W)`, 'i').test(t.toLowerCase()))) raison = 'Mot interdit';
    else if (a.caps && t.length >= 12 && lettres.length >= 10 && lettres.replace(/[^A-ZÀ-Þ]/g, '').length / lettres.length > 0.7) raison = 'Trop de majuscules';
    if (!a.enabled) { verdict.className = 'verdict neutre'; verdict.textContent = '⏸️ L\'automod est désactivé : le message passerait.'; }
    else if (raison) { verdict.className = 'verdict bloque'; verdict.textContent = `⛔ Message supprimé : ${raison.toLowerCase()}.`; }
    else { verdict.className = 'verdict passe'; verdict.textContent = '✅ Message autorisé.'; }
  }
  essai.addEventListener('input', simuler);
  maxMentions.addEventListener('input', simuler);
  drawWords(); drawRoles(); simuler();

  return [
    ...header('Automod', 'Cyber supprime automatiquement les messages interdits. Le staff (Gérer les messages) est toujours ignoré.'),
    h('div', { class: 'card master' },
      toggle('Activer l\'automod', 'Interrupteur général de la modération automatique.', a.enabled, (v) => { a.enabled = v; simuler(); })),
    carte('shield', 'Filtres', null,
      toggle('Invitations Discord', 'Bloque les liens discord.gg vers d\'autres serveurs.', a.invites, (v) => { a.invites = v; simuler(); }),
      toggle('Liens', 'Bloque tous les liens http(s).', a.links, (v) => { a.links = v; simuler(); }),
      toggle('Spam', '6 messages ou plus en 5 secondes.', a.spam, (v) => { a.spam = v; simuler(); }),
      toggle('Majuscules', 'Messages écrits à plus de 70 % en majuscules.', a.caps, (v) => { a.caps = v; simuler(); }),
      toggle('Mentions de masse', 'Trop de mentions dans un seul message.', a.mentions, (v) => { a.mentions = v; simuler(); })),
    carte('sliders', 'Réglages', null,
      h('div', { class: 'row' },
        field('Mentions maximum par message', maxMentions),
        field('Infractions avant un mute de 10 min', timeoutAfter))),
    h('div', { class: 'grid2' },
      carte('ban', 'Mots interdits', 'Le message est supprimé s\'il contient un de ces mots.',
        h('div', { class: 'inline' }, wordInput, h('button', { class: 'btn ghost', text: 'Ajouter', onclick: addWord })), wordChips),
      carte('check', 'Rôles ignorés', 'Les membres avec ces rôles ne sont pas filtrés.', roleAdd, roleChips)),
    h('div', { class: 'card simu' },
      h('div', { class: 'card-head' }, h('span', { class: 'card-ico' }, icon('flask')),
        h('div', {}, h('h3', { text: 'Simulateur' }), h('p', { class: 'hint', text: 'Teste tes réglages avant de les enregistrer. Les membres du staff ne sont jamais filtrés.' }))),
      essai, verdict),
    saveButton(() => ({ automod: {
      enabled: a.enabled, invites: a.invites, links: a.links, spam: a.spam, caps: a.caps, mentions: a.mentions,
      maxMentions: Number(maxMentions.value), timeoutAfter: Number(timeoutAfter.value), words: [...words], exemptRoles: [...exempt],
    } })),
  ];
}

function tabLevels() {
  const c = data.config;
  let enabled = c.levelsEnabled;
  const rewards = { ...c.levelRewards };
  const ch = channelSelect(data.channels.text, c.levelChannelId, '#', '— Salon où le membre a écrit —');
  const vars = { '{membre}': { text: `@${me.user.globalName || me.user.username}`, mention: true }, '{niveau}': { text: '5' } };
  const ed = messageEditor(c.levelMessage, data.defaults.levelMessage, vars, 500, (texte) => discordMsg({ content: texte }));

  const list = h('ul', { class: 'rewards' });
  const drawRewards = () => {
    const entries = Object.entries(rewards).sort((x, y) => x[0] - y[0]);
    list.replaceChildren(...(entries.length ? entries.map(([lvl, id]) => {
      const r = data.roles.find((x) => x.id === id);
      const dot = h('span', { class: 'dot' });
      dot.style.background = r?.color && r.color !== '#000000' ? r.color : '#9d98a6';
      return h('li', {}, h('span', { class: 'lv', text: `Niveau ${lvl}` }), dot, h('span', { class: 'rl', text: `@${r?.name ?? 'rôle supprimé'}` }),
        h('button', { class: 'btn ghost small', text: 'Retirer', onclick: () => { delete rewards[lvl]; drawRewards(); marquerModifie(); } }));
    }) : [h('li', { class: 'empty', text: 'Aucune récompense.' })]));
  };
  const lvlInput = h('input', { type: 'number', min: 1, max: 500, placeholder: 'Niveau' });
  const roleIn = roleSelect('', { onlyAssignable: true, none: '— Rôle —' });
  const addReward = () => {
    const n = Number(lvlInput.value);
    if (!Number.isInteger(n) || n < 1 || n > 500) return toast('❌ Niveau entre 1 et 500', false);
    if (!roleIn.value) return toast('❌ Choisis un rôle', false);
    rewards[n] = roleIn.value; lvlInput.value = ''; roleIn.value = ''; drawRewards(); marquerModifie();
  };
  drawRewards();

  return [
    ...header('Niveaux', 'Les membres gagnent de 15 à 25 XP par minute d\'activité.'),
    h('div', { class: 'card master' }, toggle('Activer les niveaux', 'Gain d\'XP, annonces et récompenses.', enabled, (v) => { enabled = v; })),
    carte('megaphone', 'Annonce de passage de niveau', null,
      field('Salon des annonces', ch),
      field('Message', ed.node, 'Laisse vide pour le message par défaut.')),
    carte('gift', 'Rôles récompenses', 'Donnés automatiquement quand un membre atteint le niveau.',
      list,
      h('div', { class: 'reward-add' }, roleIn, lvlInput, h('button', { class: 'btn ghost', text: 'Ajouter', onclick: addReward }))),
    saveButton(() => ({ levelsEnabled: enabled, levelChannelId: ch.value || null, levelMessage: ed.ta.value.trim() || null, levelRewards: rewards })),
    leaderboardCard(),
  ];
}

function publishCard(ico, title, hint, type, extra, apercu) {
  const ch = channelSelect(data.channels.text, '', '#', '— Choisis un salon —');
  const msg = h('textarea', { maxLength: 1000, placeholder: 'Texte du panneau (facultatif)' });
  const ap = apercuBox(() => apercu(msg.value.trim()));
  msg.addEventListener('input', ap.maj);
  ap.maj();
  const btn = h('button', { class: 'btn' }, icon('send'), 'Publier le panneau');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const res = await api('POST', `/guilds/${currentGuild}/publish`, { type, channelId: ch.value, message: msg.value, ...(extra ? extra.get() : {}) });
      toast(res?.message || '✅ Panneau publié sur Discord');
    } catch (err) { toast(`❌ ${err.message}`, false); } finally { btn.disabled = false; }
  });
  return carte(ico, title, hint,
    h('div', { class: 'row' }, field('Salon', ch), extra ? extra.node : null), field('Message', msg),
    h('div', { class: 'apercu-label' }, h('span', { class: 'live-dot' }), 'Aperçu du panneau'), ap.box,
    h('div', { class: 'actions' }, btn));
}

function tabTickets() {
  const c = data.config;
  const staff = roleSelect(c.ticketStaffRoleId, { none: '— Choisis le rôle staff —' });
  const cat = channelSelect(data.channels.categories, c.ticketCategoryId, '📁 ', '— Aucune catégorie —');
  const verifRole = roleSelect('', { onlyAssignable: true, none: '— Rôle à donner —' });
  return [
    ...header('Tickets & vérification', 'Support privé et protection contre les comptes suspects.'),
    carte('ticket', 'Réglages des tickets', null,
      h('div', { class: 'row' }, field('Rôle staff (voit les tickets)', staff), field('Catégorie des tickets', cat)),
      saveButton(() => ({ ticketStaffRoleId: staff.value || null, ticketCategoryId: cat.value || null }))),
    publishCard('send', 'Publier le panneau de tickets', 'Envoie le bouton « Ouvrir un ticket » dans un salon. Enregistre le rôle staff avant.', 'ticket', null,
      (t) => discordMsg({ embed: { title: '🎫 Support', desc: md(t || 'Besoin d\'aide ? Clique sur le bouton pour ouvrir un ticket privé avec l\'équipe.') }, buttons: [{ label: 'Ouvrir un ticket', emoji: '🎫', style: 'red' }] })),
    publishCard('shield', 'Publier le panneau de vérification', 'Bouton « Je ne suis pas un robot » qui donne un rôle. Les comptes de moins de 24 h sont refusés.', 'verification',
      { node: field('Rôle donné', verifRole), get: () => ({ roleId: verifRole.value }) },
      (t) => discordMsg({ embed: { title: '🛡️ Vérification', desc: md(t || 'Clique sur le bouton pour accéder au serveur.') }, buttons: [{ label: 'Je ne suis pas un robot', emoji: '✅', style: 'green' }] })),
  ];
}

function tabVoice() {
  const ch = channelSelect(data.channels.voice, data.config.tempVoiceId, '🔊 ');
  return [
    ...header('Vocaux temporaires', 'Quand un membre rejoint le salon créateur, Cyber lui crée son propre salon vocal, supprimé dès qu\'il est vide.'),
    carte('volume', 'Salon créateur', null,
      field('Salon vocal créateur', ch, 'Crée d\'abord un salon vocal nommé par exemple « ➕ Créer un vocal ».')),
    saveButton(() => ({ tempVoiceId: ch.value || null })),
  ];
}

// ---------- Navigation ----------
async function render() {
  renderAccount();
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  if (!me) { $app.replaceChildren(landing()); return; }

  if (parts[0] === 'g' && parts[1]) {
    const [, id, tab = 'apercu'] = parts;
    if (currentGuild !== id || !data) {
      $app.replaceChildren(squelette());
      try {
        data = await api('GET', `/guilds/${id}`);
        currentGuild = id;
      } catch (err) {
        $app.replaceChildren(h('div', { class: 'error-banner', text: err.message }), h('a', { class: 'btn ghost', href: '#/serveurs', text: '← Retour' }));
        return;
      }
    }
    remettreAZero();
    if (!data.config.modulesChoisis) { $app.replaceChildren(choixModules()); return; }
    $app.replaceChildren(guildPage(tab));
    animerNombres($app);
    // Sur téléphone, les onglets défilent : on montre celui qui est ouvert
    const actif = $app.querySelector('.tabs .active');
    if (actif) actif.parentElement.scrollLeft = actif.offsetLeft - actif.parentElement.offsetLeft - 12;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  data = null; currentGuild = null;
  $app.replaceChildren(serverList());
}

window.addEventListener('hashchange', render);

async function boot() {
  if (ADAPTER?.init) await ADAPTER.init();
  try { me = await api('GET', '/me'); } catch { me = null; }
  if (ADAPTER?.banner) {
    const b = document.getElementById('bandeau');
    if (b) { b.textContent = me ? ADAPTER.banner(me) : ''; b.hidden = !me; }
  }
  if (me && (!location.hash || location.hash === '#/')) location.hash = '#/serveurs';
  render();
}
boot();
