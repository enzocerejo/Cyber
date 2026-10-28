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
  key: 'M21 2l-2 2 M15.5 7.5l3 3L22 7l-3-3 M11.4 12.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8z M11.4 12.6L19 5',
  puzzle: 'M19.4 15a1.6 1.6 0 0 0 1.6-1.6V9a1 1 0 0 0-1-1h-3.1a1.5 1.5 0 1 1 0-3H8a1 1 0 0 0-1 1v3.1a1.5 1.5 0 1 1-3 0H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1a1.5 1.5 0 1 1 3 0v1a1 1 0 0 0 1 1h1.4',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  x: 'M18 6L6 18 M6 6l12 12',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
  trash: 'M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6',
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
  const input = h('input', { type: 'checkbox', checked, onchange: (e) => { onchange(e.target.checked); changer(); } });
  return h('div', { class: 'toggle' },
    h('div', { class: 't-text' }, h('b', { text: title }), desc ? h('span', { text: desc }) : null),
    h('label', { class: 'switch' }, input, h('span', { class: 'slider' })));
}

// ---------- Brouillon : modifications non enregistrées (comme sur Discord) ----------
// Chaque onglet modifie une copie des réglages. On peut changer d'onglet librement : rien n'est perdu.
// La barre du bas propose « Réinitialiser » (revenir à ce qui est enregistré) ou « Enregistrer » (tout envoyer d'un coup).
let enregistre = null; // { config, automod } tels qu'ils sont sur le bot
let brouillon = null;  // copie modifiée par le panel
const B = () => brouillon.config;
const BA = () => brouillon.automod;

function initBrouillon() {
  enregistre = structuredClone({ config: data.config, automod: data.automod });
  brouillon = structuredClone(enregistre);
}
const aDesModifs = () => !!brouillon && JSON.stringify(brouillon) !== JSON.stringify(enregistre);
function changer() { document.body.classList.toggle('modifie', aDesModifs()); }

// Ce qui a changé, prêt à envoyer au bot
function differences() {
  const patch = {};
  for (const [k, v] of Object.entries(brouillon.config)) {
    if (JSON.stringify(v) !== JSON.stringify(enregistre.config[k])) patch[k] = v;
  }
  if (JSON.stringify(brouillon.automod) !== JSON.stringify(enregistre.automod)) patch.automod = brouillon.automod;
  return patch;
}

async function enregistrer(btn) {
  const patch = differences();
  if (!Object.keys(patch).length) return;
  btn.disabled = true;
  btn.classList.add('chargement');
  try {
    const res = await api('PUT', `/guilds/${currentGuild}/config`, patch);
    // Le bot peut compléter (ex : salon du défi créé automatiquement)
    if (res?.config) for (const [k, v] of Object.entries(res.config)) brouillon.config[k] = { ...brouillon.config[k], ...v };
    if (res?.channels) data.channels = res.channels;
    data.config = structuredClone(brouillon.config);
    data.automod = structuredClone(brouillon.automod);
    enregistre = structuredClone(brouillon);
    changer();
    toast(res?.message || '✅ Modifications enregistrées');
    redessiner();
  } catch (err) {
    toast(`❌ ${err.message}`, false);
  } finally {
    btn.disabled = false;
    btn.classList.remove('chargement');
  }
}

function reinitialiser() {
  brouillon = structuredClone(enregistre);
  changer();
  redessiner();
  toast('↩️ Modifications annulées');
}

function barreEnregistrement() {
  const save = h('button', { class: 'btn save', type: 'button' }, 'Enregistrer les modifications');
  save.addEventListener('click', () => enregistrer(save));
  return h('div', { class: 'barre-modifs', role: 'region', 'aria-label': 'Modifications non enregistrées' },
    h('span', { class: 'bm-texte' }, icon('alert'), 'Attention, il reste des modifications non enregistrées !'),
    h('div', { class: 'bm-actions' },
      h('button', { class: 'btn ghost lien', type: 'button', text: 'Réinitialiser', onclick: reinitialiser }), save));
}

// Quitter le serveur avec des modifications : la barre clignote (comme Discord), un 2ᵉ clic quitte quand même
let confirmerSortie = false;
function quitterSiPossible(aller) {
  if (aDesModifs() && !confirmerSortie) {
    confirmerSortie = true;
    const barre = document.querySelector('.barre-modifs');
    barre?.classList.remove('secoue'); void barre?.offsetWidth; barre?.classList.add('secoue');
    toast('⚠️ Enregistre ou réinitialise d\'abord. Clique encore pour quitter sans enregistrer.', false);
    setTimeout(() => { confirmerSortie = false; }, 4000);
    return;
  }
  confirmerSortie = false;
  brouillon = null; enregistre = null;
  document.body.classList.remove('modifie');
  aller();
}
window.addEventListener('beforeunload', (e) => { if (aDesModifs()) { e.preventDefault(); e.returnValue = ''; } });

// ---------- Champs reliés au brouillon ----------
// obj = objet du brouillon (ex : B().defi), cle = nom du réglage. Chaque changement met à jour la barre.
function lierSelect(sel, obj, cle, apres) {
  sel.addEventListener('change', () => { obj[cle] = sel.value || null; changer(); apres?.(); });
  return sel;
}
const choixSalon = (liste, obj, cle, prefixe = '#', aucun = '— Désactivé —', apres) => lierSelect(channelSelect(liste, obj[cle], prefixe, aucun), obj, cle, apres);
const choixRole = (obj, cle, opts = {}, apres) => lierSelect(roleSelect(obj[cle], opts), obj, cle, apres);
const interrupteur = (titre, desc, obj, cle, apres) => toggle(titre, desc, !!obj[cle], (v) => { obj[cle] = v; apres?.(); });

function nombre(obj, cle, min, max, apres) {
  const input = h('input', { type: 'number', min, max, value: obj[cle] ?? min });
  input.addEventListener('input', () => {
    const n = Number(input.value);
    if (Number.isInteger(n) && n >= min && n <= max) { obj[cle] = n; changer(); apres?.(); }
  });
  return input;
}

function liste(valeurs, valeur, obj, cle, apres) {
  const sel = h('select', {}, valeurs.map(([v, t]) => h('option', { value: String(v), text: t })));
  sel.value = String(valeur);
  sel.addEventListener('change', () => { obj[cle] = Number.isNaN(Number(sel.value)) ? sel.value : Number(sel.value); changer(); apres?.(); });
  return sel;
}

function texte(obj, cle, max, placeholder = '', apres, zone = false) {
  const el = h(zone ? 'textarea' : 'input', { type: zone ? null : 'text', maxLength: max, placeholder });
  el.value = obj[cle] || '';
  el.addEventListener('input', () => { obj[cle] = el.value.trim() ? el.value : null; changer(); apres?.(); });
  return el;
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

// Message de Cyber tel qu'il apparaîtra dans Discord (format Components V2 : une carte avec barre de couleur,
// le texte, puis les boutons et menus dans la même carte)
function discordMsg({ content = null, embed = null, buttons = [], selects = [], ephemere = false } = {}) {
  const body = h('div', { class: 'dm-body' },
    h('div', { class: 'dm-head' }, h('b', { text: 'Cyber' }), h('span', { class: 'dm-app', text: 'APP' }), h('span', { class: 'dm-time', text: heureDiscord() })));
  if (content) body.append(h('div', { class: 'dm-content' }, content));
  if (embed) {
    const e = h('div', { class: 'dm-embed v2' });
    if (embed.color) e.style.borderLeftColor = embed.color;
    const main = h('div', { class: 'dm-embed-main' });
    if (embed.author) main.append(h('div', { class: 'dm-sub', text: embed.author }));
    if (embed.title) main.append(h('div', { class: 'dm-title', text: embed.title }));
    if (embed.desc) main.append(h('div', { class: 'dm-desc' }, embed.desc));
    const haut = h('div', { class: 'dm-haut' }, main);
    if (embed.thumb) haut.append(h('img', { class: 'dm-thumb', src: embed.thumb, alt: '' }));
    e.append(haut);
    if (embed.fields?.length) {
      e.append(h('div', { class: 'dm-sep' }));
      for (const [n, v] of embed.fields) e.append(h('div', { class: 'dm-field' }, h('b', { text: n }), h('div', { text: v })));
    }
    if (embed.footer) e.append(h('div', { class: 'dm-footer', text: embed.footer }));
    const rangees = [];
    if (buttons.length) rangees.push(h('div', { class: 'dm-buttons' }, buttons.map((b) => h('span', { class: `dm-btn ${b.style || 'grey'}` }, b.emoji ? h('span', { text: b.emoji }) : null, b.label))));
    for (const s of selects) rangees.push(h('div', { class: 'dm-select' }, h('span', { text: s }), icon('chevron')));
    if (rangees.length) e.append(h('div', { class: 'dm-rangees' }, rangees));
    body.append(e);
  }
  if (ephemere) body.append(h('div', { class: 'dm-eph', text: '👁️ Seul toi peux voir ce message' }));
  return h('div', { class: 'dmsg' }, h('img', { class: 'dm-av', src: LOGO, alt: '' }), body);
}

function apercuBox(build) {
  const box = h('div', { class: 'apercu' });
  const maj = () => { box.replaceChildren(build()); box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash'); };
  return { box, maj };
}
const etiquetteApercu = (t = 'Aperçu en direct dans Discord') => h('div', { class: 'apercu-label' }, h('span', { class: 'live-dot' }), t);

// Zone de texte reliée au brouillon (obj[cle]) avec variables cliquables et aperçu
function messageEditor(obj, cle, def, vars, max, construire) {
  const ta = h('textarea', { maxLength: max, placeholder: def });
  ta.value = obj[cle] || '';
  const compteur = h('span', { class: 'compteur' });
  const ap = apercuBox(() => construire(md(ta.value || def, vars)));
  const update = () => {
    obj[cle] = ta.value.trim() ? ta.value : null;
    compteur.textContent = `${ta.value.length} / ${max}`;
    ap.maj();
    changer();
  };
  ta.addEventListener('input', update);
  const chips = h('div', { class: 'chips' }, Object.keys(vars).map((k) => h('button', {
    type: 'button', class: 'chip var', text: k, title: 'Cliquer pour insérer',
    onclick: () => {
      const st = ta.selectionStart ?? ta.value.length;
      ta.value = ta.value.slice(0, st) + k + ta.value.slice(ta.selectionEnd ?? st);
      ta.focus(); update();
    },
  })), compteur);
  compteur.textContent = `${ta.value.length} / ${max}`;
  ap.maj();
  return h('div', {}, ta, chips, etiquetteApercu(), ap.box);
}
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

// [id, icône, nom, groupe, module, réglage actif ?]
const TABS = [
  ['apercu', 'grid', 'Aperçu', 'serveur', null, null],
  ['general', 'sliders', 'Général', 'serveur', null, null],
  ['bienvenue', 'userPlus', 'Bienvenue', 'communaute', 'communaute', (c) => !!c.welcomeChannelId],
  ['niveaux', 'trend', 'Niveaux', 'communaute', 'communaute', (c) => !!c.levelsEnabled],
  ['tickets', 'ticket', 'Tickets', 'communaute', 'communaute', (c) => !!c.ticketStaffRoleId],
  ['vocaux', 'volume', 'Vocaux temporaires', 'communaute', 'communaute', (c) => !!c.tempVoiceId],
  ['automod', 'shield', 'Automod', 'securite', 'communaute', () => !!BA().enabled],
  ['verification', 'key', 'Vérification', 'securite', 'communaute', (c) => !!c.verification?.roleId],
  ['academie', 'cap', 'Défi du jour', 'academie', 'academie', (c) => !!c.defi?.actif],
  ['modules', 'puzzle', 'Modules publics', 'modules', null, null],
];
const GROUPES = { serveur: 'Serveur', communaute: 'Communauté', securite: 'Sécurité', academie: 'Académie', modules: 'Modules' };
let ongletActuel = 'apercu';

const VUES = () => ({
  apercu: tabOverview, general: tabGeneral, bienvenue: tabWelcome, automod: tabAutomod, niveaux: tabLevels,
  tickets: tabTickets, verification: tabVerification, vocaux: tabVoice, academie: tabAcademie, modules: tabModules,
});

function guildPage(tab) {
  ongletActuel = TABS.some((t) => t[0] === tab) ? tab : 'apercu';
  const panel = h('div', { class: 'panel' });
  panel.append(...cascade(VUES()[ongletActuel]().filter(Boolean)));

  const c = B();
  const nav = h('nav', { class: 'tabs', 'aria-label': 'Sections' });
  let groupe;
  for (const [id, ico, label, grp, module, actif] of TABS) {
    const moduleOff = module && c.modules?.[module] === false;
    if (grp !== groupe) {
      groupe = grp;
      const off = grp === 'communaute' || grp === 'securite' ? c.modules?.communaute === false : grp === 'academie' ? c.modules?.academie === false : false;
      nav.append(h('div', { class: 'tab-group' }, h('span', { text: GROUPES[grp] }), off ? h('span', { class: 'mini off', text: 'off' }) : null));
    }
    const on = actif ? actif(c) : null;
    nav.append(h('button', {
      class: `tab${id === ongletActuel ? ' active' : ''}${moduleOff ? ' dim' : ''}`,
      'aria-current': id === ongletActuel ? 'page' : null,
      onclick: () => { if (id !== ongletActuel) location.hash = `#/g/${currentGuild}/${id}`; }, // le brouillon est gardé
    }, icon(ico), h('span', { class: 'tab-txt', text: label }), on === null ? null : h('span', { class: `etat${on ? ' on' : ''}`, title: on ? 'Activé' : 'Pas configuré' })));
  }

  return h('div', { class: 'layout' },
    h('aside', { class: 'sidebar' },
      h('div', { class: 'side-head' }, guildIcon(data.guild),
        h('div', { class: 'side-name' }, h('b', { text: data.guild.name }), h('small', { text: `${data.guild.memberCount} membres` }))),
      nav,
      h('a', { class: 'back', href: '#/serveurs', onclick: (e) => { e.preventDefault(); quitterSiPossible(() => { location.hash = '#/serveurs'; }); } }, icon('back'), 'Tous mes serveurs')),
    panel,
    barreEnregistrement());
}

// Redessine l'onglet ouvert à partir du brouillon (après Réinitialiser, Enregistrer, ajout d'un modèle…)
function redessiner() {
  if (!data || !brouillon) return;
  const y = window.scrollY;
  $app.replaceChildren(guildPage(ongletActuel));
  window.scrollTo(0, y);
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

const noteModuleOff = (module, nom) => (B().modules?.[module] === false
  ? h('div', { class: 'note warn' }, icon('alert'), `Le module ${nom} est désactivé. Active-le dans l'onglet Modules publics.`) : null);
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
      brouillon = null;
      toast('✅ Modules enregistrés. Tu pourras changer dans l\'onglet Modules publics.');
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
    carte('layers', 'Fonctions', 'Ce qui est actif sur ton serveur. Clique pour configurer.',
      h('div', { class: 'modules' },
        mod('list', 'Logs', !!c.logChannelId, 'general'), mod('userPlus', 'Bienvenue', !!c.welcomeChannelId, 'bienvenue'),
        mod('at', 'Rôle automatique', !!c.autoRoleId, 'general'), mod('shield', 'Automod', a.enabled, 'automod'),
        mod('trend', 'Niveaux', c.levelsEnabled, 'niveaux', c.levelsEnabled ? `${Object.keys(c.levelRewards).length} récompense(s)` : null),
        mod('ticket', 'Tickets', !!c.ticketStaffRoleId, 'tickets', c.ticketTypes?.length ? `${c.ticketTypes.length} type(s)` : null),
        mod('key', 'Vérification', !!c.verification?.roleId, 'verification'),
        mod('volume', 'Vocaux temporaires', !!c.tempVoiceId, 'vocaux'),
        mod('bulb', 'Suggestions', !!c.suggestionChannelId, 'general'),
        mod('zap', 'Défi du jour', !!c.defi?.actif, 'academie'),
        mod('puzzle', 'Modules', true, 'modules', `${['communaute', 'academie'].filter((m) => c.modules?.[m] !== false).length} actif(s)`))),
    leaderboardCard(),
  ];
}

function tabGeneral() {
  const c = B();
  return [
    ...header('Général', 'Les réglages de base de Cyber.'),
    h('div', { class: 'grid2' },
      carte('list', 'Logs', 'Sanctions, messages supprimés ou modifiés, tickets fermés, automod…', field('Salon des logs', choixSalon(data.channels.text, c, 'logChannelId'))),
      carte('at', 'Rôle automatique', 'Donné à chaque nouveau membre dès son arrivée.', field('Rôle', choixRole(c, 'autoRoleId', { onlyAssignable: true, none: '— Désactivé —' })))),
    carte('bulb', 'Suggestions', 'Salon où arrivent les idées envoyées avec /suggestion.', field('Salon des suggestions', choixSalon(data.channels.text, c, 'suggestionChannelId'))),
  ];
}

// Modules publics : les grandes parties de Cyber, activables par serveur.
// Bientôt : modules sur mesure activés avec un code unique (comme une cassette qu'on insère).
function tabModules() {
  const c = B();
  c.modules ??= { communaute: true, academie: true };
  const MODS = [
    ['communaute', 'shield', 'Communauté + Sécurité', 'Gratuit', 'Modération, automod avec bibliothèque de mots, vérification anti-raid, tickets avec 120+ modèles, niveaux et XP, vocaux temporaires, giveaways, rôles à boutons, bienvenue, suggestions, tags, jeux.'],
    ['academie', 'cap', 'Académie', 'Gratuit', 'Cours réseau et cybersécurité niveau CCNA (47 fiches), glossaire, quiz avec classement, défi du jour, outils réseau (/pingip, /dns, sous-réseaux), IA.'],
  ];
  return [
    ...header('Modules publics', 'Choisis ce que Cyber fait sur ton serveur. Les commandes d\'un module désactivé sont masquées.'),
    h('div', { class: 'modules-pub' }, MODS.map(([id, ico, nom, prix, desc]) => {
      const on = c.modules[id] !== false;
      const carteEl = h('div', { class: `card module-pub${on ? ' actif' : ''}` },
        h('div', { class: 'mp-head' }, h('span', { class: 'card-ico' }, icon(ico)),
          h('div', {}, h('h3', { text: nom }), h('span', { class: 'pill on', text: prix }))),
        h('p', { class: 'hint', text: desc }),
        toggle(on ? 'Activé' : 'Désactivé', null, on, (v) => { c.modules[id] = v; carteEl.classList.toggle('actif', v); carteEl.querySelector('.t-text b').textContent = v ? 'Activé' : 'Désactivé'; }));
      return carteEl;
    })),
    carte('key', 'Ajouter un module avec un code', 'Un module codé exprès pour ton serveur : tu reçois un identifiant unique, tu le saisis ici et Cyber l\'installe, comme une cassette qu\'on insère.',
      h('div', { class: 'inline' },
        h('input', { type: 'text', placeholder: 'CYB-XXXX-XXXX', disabled: true }),
        h('button', { class: 'btn ghost', type: 'button', disabled: true, text: 'Installer' })),
      h('p', { class: 'hint' }, h('span', { class: 'pill', text: 'Bientôt' }), ' Les modules sur mesure arrivent prochainement. Demande le tien sur le serveur de support.')),
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

function tabWelcome() {
  const c = B();
  const vars = {
    '{membre}': { text: `@${me.user.globalName || me.user.username}`, mention: true },
    '{nom}': { text: me.user.username },
    '{serveur}': { text: data.guild.name },
    '{nombre}': { text: String(data.guild.memberCount + 1) },
  };
  const ed = messageEditor(c, 'welcomeMessage', data.defaults.welcomeMessage, vars, 1000, (t) => discordMsg({
    content: h('span', { class: 'mention', text: `@${me.user.globalName || me.user.username}` }),
    embed: { title: '👋 Nouveau membre', desc: t, thumb: avatarMoi(), fields: [['Compte créé', 'il y a 3 ans']], footer: `ID : ${me.user.id}` },
  }));
  return [
    ...header('Bienvenue', 'Accueille les nouveaux membres avec un message personnalisé.'),
    noteModuleOff('communaute', 'Communauté'),
    carte('message', 'Message de bienvenue', null,
      field('Salon de bienvenue (et des départs)', choixSalon(data.channels.text, c, 'welcomeChannelId')),
      field('Message', ed, 'Clique sur une variable pour l\'insérer. Laisse vide pour le message par défaut. Mise en forme : **gras**, *italique*, __souligné__, ~~barré~~, `code`.')),
  ];
}

function tabLevels() {
  const c = B();
  c.levelRewards ??= {};
  const rewards = c.levelRewards;
  const vars = { '{membre}': { text: `@${me.user.globalName || me.user.username}`, mention: true }, '{niveau}': { text: '5' } };
  const ed = messageEditor(c, 'levelMessage', data.defaults.levelMessage, vars, 500, (t) => discordMsg({ content: t }));

  const list = h('ul', { class: 'rewards' });
  const drawRewards = () => {
    const entries = Object.entries(rewards).sort((x, y) => x[0] - y[0]);
    list.replaceChildren(...(entries.length ? entries.map(([lvl, id]) => {
      const r = data.roles.find((x) => x.id === id);
      const dot = h('span', { class: 'dot' });
      dot.style.background = r?.color && r.color !== '#000000' ? r.color : '#9d98a6';
      return h('li', {}, h('span', { class: 'lv', text: `Niveau ${lvl}` }), dot, h('span', { class: 'rl', text: `@${r?.name ?? 'rôle supprimé'}` }),
        h('button', { class: 'btn ghost small', text: 'Retirer', onclick: () => { delete rewards[lvl]; drawRewards(); changer(); } }));
    }) : [h('li', { class: 'empty', text: 'Aucune récompense.' })]));
  };
  const lvlInput = h('input', { type: 'number', min: 1, max: 500, placeholder: 'Niveau' });
  const roleIn = roleSelect('', { onlyAssignable: true, none: '— Rôle —' });
  const addReward = () => {
    const n = Number(lvlInput.value);
    if (!Number.isInteger(n) || n < 1 || n > 500) return toast('❌ Niveau entre 1 et 500', false);
    if (!roleIn.value) return toast('❌ Choisis un rôle', false);
    rewards[n] = roleIn.value; lvlInput.value = ''; roleIn.value = ''; drawRewards(); changer();
    return null;
  };
  drawRewards();

  return [
    ...header('Niveaux', 'Les membres gagnent de 15 à 25 XP par minute d\'activité.'),
    noteModuleOff('communaute', 'Communauté'),
    h('div', { class: 'card master' }, interrupteur('Activer les niveaux', 'Gain d\'XP, annonces et récompenses.', c, 'levelsEnabled')),
    carte('megaphone', 'Annonce de passage de niveau', null,
      field('Salon des annonces', choixSalon(data.channels.text, c, 'levelChannelId', '#', '— Salon où le membre a écrit —')),
      field('Message', ed, 'Laisse vide pour le message par défaut.')),
    carte('gift', 'Rôles récompenses', 'Donnés automatiquement quand un membre atteint le niveau.',
      list,
      h('div', { class: 'reward-add' }, roleIn, lvlInput, h('button', { class: 'btn ghost', text: 'Ajouter', onclick: addReward }))),
    leaderboardCard(),
  ];
}

// Liste de mots modifiable (chips + champ « Entrée pour ajouter »)
function listeMots(tableau, placeholder, apres) {
  const chips = h('div', { class: 'chips' });
  const draw = () => chips.replaceChildren(...(tableau.length ? tableau.map((w) => h('span', { class: 'chip' }, w,
    h('button', { title: 'Retirer', text: '×', onclick: () => { tableau.splice(tableau.indexOf(w), 1); draw(); changer(); apres?.(); } })))
    : [h('span', { class: 'hint', text: 'Aucun mot.' })]));
  const input = h('input', { type: 'text', placeholder, maxLength: 50 });
  const ajouter = () => {
    for (const v of input.value.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)) if (!tableau.includes(v)) tableau.push(v);
    input.value = ''; draw(); changer(); apres?.();
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ajouter(); } });
  draw();
  return h('div', {}, h('div', { class: 'inline' }, input, h('button', { class: 'btn ghost', type: 'button', text: 'Ajouter', onclick: ajouter })), chips);
}

function tabAutomod() {
  const a = BA();
  a.words ??= []; a.autorises ??= []; a.exemptRoles ??= []; a.bibliotheque ??= {};
  const MOTS = window.CYBER_MOTS;

  const roleChips = h('div', { class: 'chips' });
  const drawRoles = () => roleChips.replaceChildren(...a.exemptRoles.map((id) => {
    const r = data.roles.find((x) => x.id === id);
    return h('span', { class: 'chip' }, `@${r?.name ?? 'rôle supprimé'}`,
      h('button', { title: 'Retirer', text: '×', onclick: () => { a.exemptRoles.splice(a.exemptRoles.indexOf(id), 1); drawRoles(); changer(); } }));
  }));
  const roleAdd = roleSelect('', { none: '— Ajouter un rôle —' });
  roleAdd.addEventListener('change', () => { if (roleAdd.value && !a.exemptRoles.includes(roleAdd.value)) { a.exemptRoles.push(roleAdd.value); drawRoles(); changer(); } roleAdd.value = ''; });

  // Simulateur : mêmes règles que le bot (sauf l'anti-spam, qui dépend du rythme des messages)
  const essai = h('textarea', { placeholder: 'Tape un message pour voir comment l\'automod réagit… (essaie « c0nn4rd » ou « f.r.e.e n.i.t.r.o »)', maxLength: 500 });
  const verdict = h('div', { class: 'verdict' });
  function simuler() {
    const t = essai.value;
    if (!t.trim()) { verdict.className = 'verdict'; verdict.textContent = 'Le résultat s\'affiche ici.'; return; }
    let raison = null;
    const mentions = (t.match(/@\S+/g) || []).length;
    const lettres = t.replace(/[^a-zà-ÿ]/gi, '');
    const mot = MOTS ? MOTS.trouver(t, MOTS.listeActive(a), a.autorises) : null;
    if (a.invites && /(discord\.gg|discord(app)?\.com\/invite)\/\w+/i.test(t)) raison = 'Invitation Discord interdite';
    else if (a.links && /https?:\/\/\S+/i.test(t)) raison = 'Liens interdits';
    else if (a.mentions && mentions >= Number(a.maxMentions)) raison = 'Mentions de masse';
    else if (mot) raison = `Mot interdit (« ${mot} »)`;
    else if (a.caps && t.length >= 12 && lettres.length >= 10 && lettres.replace(/[^A-ZÀ-Þ]/g, '').length / lettres.length > 0.7) raison = 'Trop de majuscules';
    if (!a.enabled) { verdict.className = 'verdict neutre'; verdict.textContent = `⏸️ L'automod est désactivé : le message passerait.${raison ? ` (activé : ${raison.toLowerCase()})` : ''}`; } else if (raison) { verdict.className = 'verdict bloque'; verdict.textContent = `⛔ Message supprimé : ${raison}.`; } else { verdict.className = 'verdict passe'; verdict.textContent = '✅ Message autorisé.'; }
  }
  essai.addEventListener('input', simuler);
  drawRoles(); simuler();

  const biblio = h('div', { class: 'biblio' }, (MOTS?.CATEGORIES || []).map((cat) => {
    const actif = a.bibliotheque[cat.id] ?? cat.defaut;
    const voir = h('details', { class: 'mots-cat' }, h('summary', { text: `Voir les ${cat.mots.length} mots et expressions` }),
      h('div', { class: 'chips flou' }, cat.mots.map((m) => h('span', { class: 'chip', text: m }))));
    return h('div', { class: 'biblio-cat' },
      toggle(`${cat.nom} · ${cat.mots.length}`, cat.desc, actif, (v) => { a.bibliotheque[cat.id] = v; simuler(); }), voir);
  }));

  return [
    ...header('Automod', 'Cyber supprime automatiquement les messages interdits. Le staff (Gérer les messages) est toujours ignoré.'),
    noteModuleOff('communaute', 'Communauté'),
    h('div', { class: 'card master' }, interrupteur('Activer l\'automod', 'Interrupteur général de la modération automatique.', a, 'enabled', simuler)),
    carte('shield', 'Filtres', null,
      interrupteur('Invitations Discord', 'Bloque les liens discord.gg vers d\'autres serveurs.', a, 'invites', simuler),
      interrupteur('Liens', 'Bloque tous les liens http(s).', a, 'links', simuler),
      interrupteur('Spam', '6 messages ou plus en 5 secondes.', a, 'spam', simuler),
      interrupteur('Majuscules', 'Messages écrits à plus de 70 % en majuscules.', a, 'caps', simuler),
      interrupteur('Mentions de masse', 'Trop de mentions dans un seul message.', a, 'mentions', simuler)),
    carte('sliders', 'Réglages', null,
      h('div', { class: 'row' },
        field('Mentions maximum par message', nombre(a, 'maxMentions', 2, 50, simuler)),
        field('Infractions avant un mute de 10 min', nombre(a, 'timeoutAfter', 1, 10)))),
    carte('book', 'Bibliothèque de mots interdits', 'Listes prêtes à l\'emploi. Cyber reconnaît aussi les variantes : majuscules, accents, chiffres à la place des lettres (c0nn4rd), lettres répétées (connnnard) ou séparées (c.o.n.n.a.r.d), pluriels et féminins.', biblio),
    h('div', { class: 'grid2' },
      carte('ban', 'Mots interdits en plus', 'Tes propres mots ou expressions (variantes reconnues aussi). Sépare-les par des virgules.', listeMots(a.words, 'Ajouter un mot puis Entrée', simuler)),
      carte('check', 'Mots autorisés', 'Toujours acceptés, même s\'ils sont dans la bibliothèque (ex : « bite » si on parle anglais, un pseudo…).', listeMots(a.autorises, 'Ajouter un mot autorisé', simuler))),
    carte('users', 'Rôles ignorés', 'Les membres avec ces rôles ne sont pas filtrés.', roleAdd, roleChips),
    h('div', { class: 'card simu' },
      h('div', { class: 'card-head' }, h('span', { class: 'card-ico' }, icon('flask')),
        h('div', {}, h('h3', { text: 'Simulateur' }), h('p', { class: 'hint', text: 'Teste tes réglages avant de les enregistrer (y compris ceux pas encore enregistrés).' }))),
      essai, verdict),
  ];
}

// ---------- Tickets ----------
const ticketVide = () => ({ id: `perso-${Math.random().toString(36).slice(2, 8)}`, nom: 'Nouveau ticket', emoji: '🎫', desc: '', prefixe: 'ticket', questions: [], message: null, staffRoleId: null });

function previewPanneauTickets(types, titre, texte) {
  const liste = types.length ? types : [{ nom: 'Ouvrir un ticket', emoji: '🎫' }];
  const plusieurs = types.length > 1;
  return discordMsg({
    embed: {
      title: titre || '🎫 Support',
      desc: md(texte || (plusieurs ? 'Besoin d\'aide ? Choisis le type de demande ci-dessous pour ouvrir un ticket privé avec l\'équipe.' : 'Besoin d\'aide ? Clique sur le bouton pour ouvrir un ticket privé avec l\'équipe.')),
      fields: plusieurs ? types.slice(0, 25).map((t) => [`${t.emoji || '🎫'} ${t.nom}`, t.desc || ' ']) : [],
    },
    buttons: liste.length <= 4 ? liste.map((t, i) => ({ label: liste.length === 1 ? 'Ouvrir un ticket' : t.nom, emoji: t.emoji || '🎫', style: i === 0 ? 'red' : 'grey' })) : [],
    selects: liste.length > 4 ? ['📂 Choisis le type de ticket…'] : [],
  });
}

function editeurType(types, t, redraw) {
  t.questions ??= [];
  const i = types.indexOf(t);
  const qListe = h('div', { class: 'questions' });
  const drawQ = () => {
    qListe.replaceChildren(...t.questions.map((q, n) => h('div', { class: 'question' },
      h('span', { class: 'q-num', text: String(n + 1) }),
      texte(q, 'label', 45, 'Question (45 caractères max)'),
      h('label', { class: 'mini-check' }, h('input', { type: 'checkbox', checked: !!q.long, onchange: (e) => { q.long = e.target.checked; changer(); } }), 'Longue'),
      h('label', { class: 'mini-check' }, h('input', { type: 'checkbox', checked: q.requis !== false, onchange: (e) => { q.requis = e.target.checked; changer(); } }), 'Obligatoire'),
      h('button', { class: 'btn ghost small', type: 'button', title: 'Retirer', onclick: () => { t.questions.splice(n, 1); drawQ(); changer(); } }, icon('trash')))));
    if (!t.questions.length) qListe.append(h('p', { class: 'hint', text: 'Aucune question : le ticket s\'ouvre directement.' }));
  };
  drawQ();
  const nomTitre = h('b', { text: `${t.emoji || '🎫'} ${t.nom}` });
  const majTitre = () => { nomTitre.textContent = `${t.emoji || '🎫'} ${t.nom || 'Sans nom'}`; };
  const deplacer = (d) => { const j = i + d; if (j < 0 || j >= types.length) return; [types[i], types[j]] = [types[j], types[i]]; changer(); redraw(); };
  return h('details', { class: 'type-ticket' },
    h('summary', {}, nomTitre, h('span', { class: 'hint', text: `${t.questions.length} question(s)` }),
      h('span', { class: 'tt-actions' },
        h('button', { class: 'btn ghost small', type: 'button', title: 'Monter', onclick: (e) => { e.preventDefault(); deplacer(-1); } }, icon('up')),
        h('button', { class: 'btn ghost small', type: 'button', title: 'Descendre', onclick: (e) => { e.preventDefault(); deplacer(1); } }, icon('down')),
        h('button', { class: 'btn ghost small', type: 'button', title: 'Supprimer', onclick: (e) => { e.preventDefault(); types.splice(types.indexOf(t), 1); changer(); redraw(); } }, icon('trash')))),
    h('div', { class: 'row' },
      field('Emoji', texte(t, 'emoji', 16, '🎫', majTitre)),
      field('Nom', texte(t, 'nom', 80, 'Ex : Recrutement', majTitre)),
      field('Début du nom du salon', texte(t, 'prefixe', 30, 'ticket'))),
    field('Description (dans le panneau)', texte(t, 'desc', 100, 'Ex : Postuler pour rejoindre l\'équipe.')),
    field('Rôle qui voit ce type de ticket', choixRole(t, 'staffRoleId', { none: '— Rôle staff général —' })),
    field('Message d\'accueil dans le ticket', texte(t, 'message', 2000, 'Merci {membre} ! Explique ta demande, l\'équipe va te répondre.', null, true), '{membre} = la personne qui ouvre le ticket.'),
    field('Questions posées à l\'ouverture (5 maximum)', h('div', {}, qListe,
      h('button', { class: 'btn ghost small', type: 'button', onclick: () => { if (t.questions.length >= 5) return toast('❌ Discord limite à 5 questions', false); t.questions.push({ label: '', long: false, requis: true }); drawQ(); changer(); return null; } }, icon('plus'), 'Ajouter une question'))));
}

function ouvrirGalerie(types, apres) {
  const T = window.CYBER_TICKETS;
  if (!T) return toast('❌ Catalogue introuvable', false);
  let cat = null;
  const recherche = h('input', { type: 'search', placeholder: `Rechercher parmi ${T.MODELES.length} modèles…` });
  const grille = h('div', { class: 'galerie-grille' });
  const compteur = h('span', { class: 'pill' });
  const filtres = h('div', { class: 'chips' });
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const dessiner = () => {
    compteur.textContent = `${types.length} / 25 sur ton serveur`;
    filtres.replaceChildren(...[{ nom: null, emoji: '✨', nombre: T.MODELES.length }, ...T.CATEGORIES].map((c) => h('button', {
      type: 'button', class: `chip filtre${cat === c.nom ? ' on' : ''}`, text: `${c.emoji} ${c.nom ?? 'Tous'} · ${c.nombre}`,
      onclick: () => { cat = c.nom; dessiner(); },
    })));
    const q = norm(recherche.value.trim());
    const liste = T.MODELES.filter((m) => (!cat || m.cat === cat) && (!q || norm(`${m.nom} ${m.desc} ${m.cat}`).includes(q)));
    grille.replaceChildren(...(liste.length ? liste.map((m) => {
      const deja = types.some((t) => t.id === m.id);
      const btn = h('button', { class: `btn small${deja ? ' ghost' : ''}`, type: 'button', disabled: deja, text: deja ? 'Ajouté ✓' : 'Ajouter' });
      btn.addEventListener('click', () => {
        if (types.length >= 25) return toast('❌ 25 types maximum (limite de Discord)', false);
        types.push(structuredClone({ ...m, cat: undefined, staffRoleId: null }));
        changer(); dessiner(); apres(); toast(`✅ « ${m.nom} » ajouté : modifie-le à ta guise`);
        return null;
      });
      return h('div', { class: 'modele' },
        h('div', { class: 'modele-tete' }, h('span', { class: 'modele-emoji', text: m.emoji }), h('div', {}, h('b', { text: m.nom }), h('small', { text: m.cat }))),
        h('p', { text: m.desc }),
        h('div', { class: 'modele-q' }, m.questions.length ? m.questions.map((x) => h('span', { text: `• ${x.label}${x.requis ? '' : ' (facultatif)'}` })) : h('span', { text: 'Sans questions' })),
        btn);
    }) : [h('p', { class: 'empty', text: 'Aucun modèle ne correspond.' })]));
  };
  recherche.addEventListener('input', dessiner);
  const fermer = () => { fond.remove(); document.removeEventListener('keydown', echap); };
  const echap = (e) => { if (e.key === 'Escape') fermer(); };
  const fond = h('div', { class: 'fenetre-fond', onclick: (e) => { if (e.target === fond) fermer(); } },
    h('div', { class: 'fenetre', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Modèles de tickets' },
      h('div', { class: 'fenetre-tete' },
        h('div', {}, h('h3', { text: '📚 Modèles de tickets' }), h('p', { class: 'hint', text: 'Clique sur « Ajouter » : le modèle est copié sur ton serveur, tu peux ensuite tout modifier.' })),
        compteur, h('button', { class: 'btn ghost small', type: 'button', title: 'Fermer', onclick: fermer }, icon('x'))),
      recherche, filtres, grille));
  document.addEventListener('keydown', echap);
  document.body.append(fond);
  dessiner();
  recherche.focus();
  return null;
}

function publishCard(ico, title, hint, type, extra, apercu, titreDefaut) {
  const ch = channelSelect(data.channels.text, '', '#', '— Choisis un salon —');
  const titre = h('input', { type: 'text', maxLength: 200, placeholder: titreDefaut });
  const msg = h('textarea', { maxLength: 1000, placeholder: 'Texte du panneau (facultatif)' });
  const ap = apercuBox(() => apercu(titre.value.trim(), msg.value.trim()));
  titre.addEventListener('input', ap.maj);
  msg.addEventListener('input', ap.maj);
  ap.maj();
  const btn = h('button', { class: 'btn' }, icon('send'), 'Publier le panneau');
  btn.addEventListener('click', async () => {
    if (aDesModifs()) return toast('⚠️ Enregistre d\'abord tes modifications (barre en bas), puis publie.', false);
    btn.disabled = true;
    try {
      const res = await api('POST', `/guilds/${currentGuild}/publish`, { type, channelId: ch.value, titre: titre.value, message: msg.value, ...(extra ? extra.get() : {}) });
      toast(res?.message || '✅ Panneau publié sur Discord');
    } catch (err) { toast(`❌ ${err.message}`, false); } finally { btn.disabled = false; }
    return null;
  });
  // ces champs ne font pas partie des réglages : ils ne déclenchent pas la barre d'enregistrement
  const carteP = h('div', { class: 'card publication' },
    h('div', { class: 'card-head' }, h('span', { class: 'card-ico' }, icon(ico)), h('div', {}, h('h3', { text: title }), h('p', { class: 'hint', text: hint }))),
    h('div', { class: 'row' }, field('Salon', ch), extra ? extra.node : null),
    field('Titre', titre), field('Message', msg),
    etiquetteApercu('Aperçu du panneau'), ap.box,
    h('div', { class: 'actions' }, btn));
  carteP.majApercu = ap.maj;
  return carteP;
}

function tabTickets() {
  const c = B();
  c.ticketTypes ??= [];
  const types = c.ticketTypes;
  const liste = h('div', { class: 'types-tickets' });
  const apercu = apercuBox(() => previewPanneauTickets(types, '', ''));
  const titreTypes = h('h3', { text: '' });
  let majPublication = () => {};
  const dessiner = () => {
    titreTypes.textContent = `Types de tickets de ton serveur (${types.length}/25)`;
    majPublication();
    liste.replaceChildren(...(types.length ? types.map((t) => editeurType(types, t, dessiner))
      : [h('p', { class: 'empty', text: 'Aucun type : le panneau aura un seul bouton « Ouvrir un ticket ». Ajoute des modèles pour proposer plusieurs choix (recrutement, plainte, partenariat…).' })]));
    apercu.maj();
  };
  dessiner();
  liste.addEventListener('input', () => { apercu.maj(); majPublication(); });
  const nbModeles = window.CYBER_TICKETS?.MODELES.length ?? 0;
  return [
    ...header('Tickets', 'Support privé : chaque demande ouvre un salon visible seulement par le membre et l\'équipe.'),
    noteModuleOff('communaute', 'Communauté'),
    carte('ticket', 'Réglages des tickets', null,
      h('div', { class: 'row' },
        field('Rôle staff (voit tous les tickets)', choixRole(c, 'ticketStaffRoleId', { none: '— Choisis le rôle staff —' })),
        field('Catégorie des tickets', choixSalon(data.channels.categories, c, 'ticketCategoryId', '📁 ', '— Aucune catégorie —')))),
    h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('span', { class: 'card-ico' }, icon('layers')),
        h('div', {}, titreTypes,
          h('p', { class: 'hint', text: 'Chaque type a son bouton ou sa ligne dans le menu, ses questions et son message d\'accueil.' }))),
      h('div', { class: 'actions gauche' },
        h('button', { class: 'btn', type: 'button', onclick: () => ouvrirGalerie(types, dessiner) }, icon('book'), `Voir tous les modèles (${nbModeles})`),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { if (types.length >= 25) return toast('❌ 25 types maximum', false); types.push(ticketVide()); changer(); dessiner(); liste.lastChild?.setAttribute('open', ''); return null; } }, icon('plus'), 'Créer un type vide')),
      liste,
      etiquetteApercu('Aperçu du panneau avec ces types'), apercu.box),
    (() => {
      const carteP = publishCard('send', 'Publier le panneau de tickets', 'Envoie le panneau dans un salon. Enregistre tes modifications avant.', 'ticket', null,
        (titre, texte) => previewPanneauTickets(B().ticketTypes, titre, texte), '🎫 Support');
      majPublication = carteP.majApercu;
      return carteP;
    })(),
  ];
}

// ---------- Vérification ----------
function tabVerification() {
  const c = B();
  c.verification ??= { roleId: null, titre: null, message: null, ageMinHeures: 24 };
  const v = c.verification;
  const AGES = [[0, 'Aucun minimum'], [1, '1 heure'], [24, '24 heures (conseillé)'], [72, '3 jours'], [168, '7 jours'], [720, '30 jours']];
  return [
    ...header('Vérification', 'Protège le serveur des robots et des comptes de raid : les nouveaux cliquent sur un bouton pour recevoir leur rôle.'),
    noteModuleOff('communaute', 'Communauté'),
    carte('key', 'Réglages de la vérification', null,
      h('div', { class: 'row' },
        field('Rôle donné après vérification', choixRole(v, 'roleId', { onlyAssignable: true, none: '— Choisis le rôle —' })),
        field('Âge minimum du compte Discord', liste(AGES, v.ageMinHeures ?? 24, v, 'ageMinHeures'), 'Les comptes plus récents sont refusés (souvent des comptes de raid).')),
      field('Titre du panneau', texte(v, 'titre', 200, '🛡️ Vérification')),
      field('Message du panneau', texte(v, 'message', 1000, 'Clique sur le bouton pour accéder au serveur.', null, true))),
    h('div', { class: 'note' }, icon('bulb'), 'Astuce : retire la permission « Voir les salons » à @everyone et donne-la au rôle vérifié. Les nouveaux ne verront que le salon de vérification.'),
    publishCard('shield', 'Publier le panneau de vérification', 'Bouton « Je ne suis pas un robot ». Enregistre tes réglages avant.', 'verification', null,
      (titre, t) => discordMsg({ embed: { title: titre || v.titre || '🛡️ Vérification', desc: md(t || v.message || 'Clique sur le bouton pour accéder au serveur.') }, buttons: [{ label: 'Je ne suis pas un robot', emoji: '✅', style: 'green' }] }),
      v.titre || '🛡️ Vérification'),
  ];
}

// ---------- Vocaux temporaires ----------
const CONTROLES_VOCAUX = [
  ['renommer', '✏️', 'Renommer', 'Changer le nom du salon.'],
  ['limite', '👥', 'Limite de personnes', 'Nombre maximum de personnes (0 = illimité).'],
  ['verrou', '🔒', 'Verrouiller', 'Plus personne ne peut entrer (sauf invités).'],
  ['masquer', '👁️', 'Masquer', 'Le salon devient invisible pour les autres.'],
  ['statut', '💬', 'Statut', 'Texte affiché sous le nom du salon (« On joue à… »).'],
  ['expulser', '👢', 'Expulser', 'Sortir quelqu\'un du salon (il ne peut plus revenir).'],
  ['inviter', '📩', 'Autoriser un membre', 'Laisser entrer quelqu\'un même si c\'est verrouillé.'],
  ['transferer', '👑', 'Transférer', 'Donner la propriété du salon à un autre membre.'],
];

function tabVoice() {
  const c = B();
  c.vocaux ??= {};
  const v = c.vocaux;
  v.controles ??= {};
  const ap = apercuBox(() => {
    const actifs = CONTROLES_VOCAUX.filter(([id]) => v.controles[id] !== false);
    const boutons = actifs.filter(([id]) => !['expulser', 'inviter', 'transferer'].includes(id)).map(([, emoji, label]) => ({ emoji, label: label.split(' ')[0] }));
    boutons.push({ emoji: '🙋', label: 'Récupérer' });
    const nomSalon = (v.nom || '🔊 Salon de {membre}').replaceAll('{membre}', me.user.globalName || me.user.username).replaceAll('{pseudo}', me.user.username);
    return h('div', {},
      h('div', { class: 'vocal-apercu' }, icon('volume'), h('b', { text: nomSalon }), v.limite ? h('span', { class: 'pill', text: `0/${v.limite}` }) : null, v.verrouille ? h('span', { text: '🔒' }) : null),
      v.panneau === false ? h('p', { class: 'hint', text: 'Panneau de contrôle désactivé : les membres utiliseront /vocal.' }) : discordMsg({
        embed: { title: '🎛️ Ton salon vocal', desc: md(`@${me.user.globalName || me.user.username} est propriétaire de ce salon.\nUtilise les boutons pour le régler. Il disparaît dès qu'il est vide.`), fields: [['Accès', `${v.verrouille ? '🔒 Verrouillé' : '🔓 Ouvert'} · ${v.masque ? '🙈 Masqué' : '👁️ Visible'}`], ['Limite', v.limite ? `${v.limite} personnes` : 'Illimité']] },
        buttons: boutons, selects: actifs.filter(([id]) => ['expulser', 'inviter', 'transferer'].includes(id)).map(([, e, l]) => `${e} ${l}…`),
      }));
  });
  const maj = () => ap.maj();
  const nomCat = h('input', { type: 'text', maxLength: 100, placeholder: 'Ex : 🔊 Vocaux' });
  const nomCreateur = h('input', { type: 'text', maxLength: 100, value: '➕ Créer un vocal' });
  const installer = h('button', { class: 'btn', type: 'button' }, icon('plus'), 'Créer le salon créateur');
  installer.addEventListener('click', async () => {
    installer.disabled = true;
    try {
      const res = await api('POST', `/guilds/${currentGuild}/vocaux/installer`, { categorieId: v.categorieId || null, categorieNom: v.categorieId ? null : nomCat.value, salonNom: nomCreateur.value });
      if (res.channels) data.channels = res.channels;
      for (const cible of [enregistre.config, brouillon.config, data.config]) {
        cible.tempVoiceId = res.tempVoiceId;
        cible.vocaux = { ...(cible.vocaux || {}), categorieId: res.categorieId };
      }
      changer();
      toast('✅ Salon créateur créé sur Discord !');
      redessiner();
    } catch (err) { toast(`❌ ${err.message}`, false); } finally { installer.disabled = false; }
  });
  ap.maj();
  return [
    ...header('Vocaux temporaires', 'Comme les bots « Join to Create » : un membre rejoint le salon créateur, Cyber lui crée son propre vocal, supprimé dès qu\'il est vide.'),
    noteModuleOff('communaute', 'Communauté'),
    carte('layers', '1 · Catégorie', 'Où ranger les vocaux créés.',
      field('Catégorie', choixSalon(data.channels.categories, v, 'categorieId', '📁 ', '— Celle du salon créateur —', redessiner)),
      v.categorieId ? null : field('… ou crée une nouvelle catégorie (en même temps que le salon créateur)', nomCat)),
    carte('volume', '2 · Salon créateur', 'Le salon à rejoindre pour obtenir son vocal.',
      field('Salon créateur existant', choixSalon(data.channels.voice, c, 'tempVoiceId', '🔊 ')),
      h('div', { class: 'row bas' }, field('Ou crée-le maintenant', nomCreateur), installer),
      h('div', { class: 'note' }, icon('bulb'), 'Le salon créateur est séparé des vocaux qu\'il crée : chaque membre qui le rejoint obtient son propre salon, autant de fois qu\'il le faut. Seule limite : Discord accepte 50 salons par catégorie (au-delà, Cyber les crée hors catégorie) et 500 par serveur.')),
    carte('sliders', '3 · Options par défaut des nouveaux vocaux', null,
      h('div', { class: 'row' },
        field('Nom du salon', texte(v, 'nom', 100, '🔊 Salon de {membre}', maj), '{membre} = nom affiché · {pseudo} = pseudo Discord'),
        field('Limite de personnes (0 = illimité)', nombre(v, 'limite', 0, 99, maj))),
      interrupteur('Verrouillé à la création', 'Personne ne peut entrer sans invitation.', v, 'verrouille', maj),
      interrupteur('Masqué à la création', 'Le salon est invisible pour les autres membres.', v, 'masque', maj),
      interrupteur('Panneau de contrôle dans le chat du vocal', 'Boutons pour régler le salon, visibles dans son chat.', v, 'panneau', maj),
      interrupteur('Donner aussi « Gérer le salon » au créateur', 'Il peut alors tout modifier depuis le menu Discord (à éviter sur un grand serveur).', v, 'gestionDiscord', maj)),
    carte('users', '4 · Ce que le propriétaire du vocal peut faire', 'Désactive ce que tu ne veux pas laisser aux membres. Le staff (Gérer les salons) peut toujours tout faire.',
      ...CONTROLES_VOCAUX.map(([id, emoji, label, desc]) => toggle(`${emoji} ${label}`, desc, v.controles[id] !== false, (on) => { v.controles[id] = on; maj(); }))),
    h('div', { class: 'card' }, etiquetteApercu('Aperçu du vocal créé et de son panneau'), ap.box),
  ];
}

// ---------- Défi du jour ----------
function tabAcademie() {
  const c = B();
  c.defi ??= { actif: false, heure: 18, questions: 5, top: 10 };
  const d = c.defi;
  const salon = data.channels.text.find((x) => x.id === d.channelId);
  const ap = apercuBox(() => {
    const r = data.roles.find((x) => x.id === d.roleId);
    return h('div', { class: 'pile' },
      discordMsg({
        content: r ? h('span', { class: 'mention role', text: `@${r.name}` }) : null,
        embed: { color: '#4DA3FF', title: `🧠 Quiz du jour · ${new Date().toLocaleDateString('fr-FR')}`,
          desc: md(`**${d.questions ?? 5} question(s)** sur le réseau et la cybersécurité (niveau CCNA).\nClique sur **Jouer** : tes réponses ne sont visibles **que par toi**.\n+15 points par bonne réponse · résultats et top ${d.top ?? 10} demain à **${d.heure ?? 18} h**.`) },
        buttons: [{ label: 'Jouer', emoji: '▶️', style: 'red' }],
      }),
      discordMsg({
        ephemere: true,
        embed: { color: '#4DA3FF', author: '✅ Bonne réponse ! (+15)', title: `🧠 Question 2/${d.questions ?? 5}`, desc: md('**Combien d\'hôtes utilisables dans un /27 ?**\n\n🇦 30\n🇧 32\n🇨 62\n🇩 14'), footer: 'ITN · Masque de sous-réseau' },
        buttons: ['A', 'B', 'C', 'D'].map((l) => ({ label: l })),
      }),
      discordMsg({
        embed: { color: '#F1C40F', title: `🏆 Résultats du quiz du ${new Date(Date.now() - 864e5).toLocaleDateString('fr-FR')}`,
          desc: md(['🥇 @Alice · **5/5** en 1 min 12 s', '🥈 @Bob · **5/5** en 1 min 40 s', '🥉 @Chloé · **4/5** en 58 s'].slice(0, Math.min(3, d.top ?? 10)).join('\n')),
          fields: [['Participation', '12 joueur(s) · moyenne 3.4/5']], footer: 'Ce message reste dans le salon' },
      }));
  });
  const maj = () => ap.maj();
  ap.maj();
  const HEURES = Array.from({ length: 24 }, (_, i) => [i, `${String(i).padStart(2, '0')} h 00`]);
  const TOPS = [[3, 'Top 3'], [5, 'Top 5'], [10, 'Top 10'], [15, 'Top 15'], [20, 'Top 20'], [25, 'Top 25']];
  const QUESTIONS = Array.from({ length: 10 }, (_, i) => [i + 1, `${i + 1} question${i ? 's' : ''}`]);
  return [
    ...header('Défi du jour', 'Un quiz réseau et cybersécurité chaque jour. Chacun joue en privé, le salon reste propre, et le classement est publié tous les jours.'),
    noteModuleOff('academie', 'Académie'),
    h('div', { class: 'card master' }, interrupteur('Activer le défi du jour', 'À l\'enregistrement, Cyber crée le salon tout seul s\'il n\'existe pas.', d, 'actif', maj)),
    carte('hash', 'Salon du défi', salon ? `Le défi est publié dans #${salon.name}. Tu peux le déplacer où tu veux sur Discord, même hors de sa catégorie : Cyber le retrouve.` : 'Pas encore de salon : il sera créé (en lecture seule pour les membres) quand tu enregistres avec le défi activé.',
      h('div', { class: 'row' },
        field('Catégorie où créer le salon', choixSalon(data.channels.categories, d, 'categorieId', '📁 ', '— Aucune (en haut du serveur) —')),
        field('Salon utilisé', choixSalon(data.channels.text, d, 'channelId', '#', '— Créé automatiquement —')))),
    carte('sliders', 'Déroulement', 'Chaque jour à l\'heure choisie : le classement du quiz de la veille est publié (il reste dans le salon), puis un nouveau quiz commence. C\'est une boucle.',
      h('div', { class: 'row' },
        field('Heure (heure française)', liste(HEURES, d.heure ?? 18, d, 'heure', maj)),
        field('Questions par quiz', liste(QUESTIONS, d.questions ?? 5, d, 'questions', maj)),
        field('Classement publié', liste(TOPS, d.top ?? 10, d, 'top', maj))),
      field('Rôle à mentionner', choixRole(d, 'roleId', { none: '— Aucune mention —' }, maj))),
    h('div', { class: 'card' }, etiquetteApercu('Ce que verront les membres'), ap.box),
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
        brouillon = null;
      } catch (err) {
        $app.replaceChildren(h('div', { class: 'error-banner', text: err.message }), h('a', { class: 'btn ghost', href: '#/serveurs', text: '← Retour' }));
        return;
      }
    }
    if (!brouillon) initBrouillon(); // changer d'onglet garde les modifications en cours
    changer();
    if (!data.config.modulesChoisis) { $app.replaceChildren(choixModules()); return; }
    $app.replaceChildren(guildPage(tab));
    animerNombres($app);
    // Sur téléphone, les onglets défilent : on montre celui qui est ouvert
    const actif = $app.querySelector('.tabs .active');
    if (actif) actif.parentElement.scrollLeft = actif.offsetLeft - actif.parentElement.offsetLeft - 12;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  data = null; currentGuild = null; brouillon = null; enregistre = null;
  document.body.classList.remove('modifie');
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
