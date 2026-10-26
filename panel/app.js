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
  const avatar = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=64` : 'https://cdn.discordapp.com/embed/avatars/0.png';
  $account.append(
    h('img', { src: avatar, alt: '' }),
    h('span', { class: 'name', text: u.globalName || u.username }),
    h('button', {
      class: 'btn ghost small', text: 'Déconnexion',
      onclick: async () => {
        if (ADAPTER) ADAPTER.logout(); else await fetch('/logout', { method: 'POST' }).catch(() => {});
        me = null; data = null; currentGuild = null; location.hash = '#/'; render();
      },
    }),
  );
}

function landing() {
  const err = new URLSearchParams(location.search).get('erreur') || ADAPTER?.error;
  return h('section', {},
    err ? h('div', { class: 'error-banner', text: 'La connexion avec Discord a échoué. Réessaie.' }) : null,
    h('div', { class: 'hero' },
      h('img', { src: LOGO, alt: 'Logo de Cyber' }),
      h('h1', { text: 'CYBER' }),
      h('p', { text: 'Configure Cyber en quelques clics : modération, automod, niveaux, tickets, bienvenue et bien plus. Sans taper une seule commande.' }),
      ADAPTER
        ? h('div', { class: 'cta-row' },
          h('button', { class: 'btn big', text: 'Se connecter avec Discord', onclick: () => ADAPTER.login() }),
          ADAPTER.startDemo ? h('button', { class: 'btn big ghost', text: 'Essayer sans compte', onclick: async () => { ADAPTER.startDemo(); await boot(); } }) : null)
        : h('a', { class: 'btn big', href: '/login', text: 'Se connecter avec Discord' })),
    h('div', { class: 'features' },
      [['🤖 Automod', 'Anti-spam, anti-liens, mots interdits, sanctions automatiques.'],
        ['📈 Niveaux', 'XP, classement et rôles récompenses.'],
        ['🎫 Tickets', 'Support privé avec ton équipe en un clic.'],
        ['👋 Bienvenue', 'Messages personnalisés et rôle automatique.'],
        ['🔊 Vocaux temporaires', 'Chaque membre crée son propre salon.'],
        ['🛡️ Vérification', 'Bloque les comptes suspects et les raids.']]
        .map(([t, d]) => h('div', { class: 'feature' }, h('b', { text: t }), h('span', { text: d })))));
}

function serverList() {
  const withBot = me.guilds.filter((g) => g.botIn);
  return h('section', {},
    h('h1', { class: 'page-title', text: 'Tes serveurs' }),
    h('p', { class: 'page-sub', text: `Serveurs où tu as la permission « Gérer le serveur » · Cyber est présent sur ${withBot.length} d'entre eux.` }),
    me.guilds.length
      ? h('div', { class: 'guilds' }, cascade(me.guilds.map((g) => h('div', { class: `guild-card${g.botIn ? '' : ' off'}` },
        guildIcon(g),
        h('div', { class: 'gname', text: g.name }),
        g.botIn
          ? h('a', { class: 'btn', href: `#/g/${g.id}/apercu`, text: 'Configurer' })
          : h('a', { class: 'btn ghost', href: g.invite, target: '_blank', rel: 'noopener', text: 'Inviter Cyber' })))))
      : h('p', { class: 'empty', text: 'Aucun serveur que tu peux gérer.' }));
}

const TABS = [
  ['apercu', '📊', 'Aperçu'],
  ['general', '⚙️', 'Général'],
  ['bienvenue', '👋', 'Bienvenue'],
  ['automod', '🤖', 'Automod'],
  ['niveaux', '📈', 'Niveaux'],
  ['tickets', '🎫', 'Tickets & vérification'],
  ['vocaux', '🔊', 'Vocaux temporaires'],
  ['academie', '🎓', 'Académie'],
];

function guildPage(tab) {
  const panel = h('div', { class: 'panel' });
  const views = { apercu: tabOverview, general: tabGeneral, bienvenue: tabWelcome, automod: tabAutomod, niveaux: tabLevels, tickets: tabTickets, vocaux: tabVoice, academie: tabAcademie };
  panel.append(...cascade((views[tab] || tabOverview)().filter(Boolean)));
  panel.addEventListener('input', (e) => { if (!e.target.closest('.simu')) marquerModifie(); });
  panel.addEventListener('change', (e) => { if (!e.target.closest('.simu')) marquerModifie(); });
  return h('div', { class: 'layout' },
    h('aside', { class: 'sidebar' },
      h('div', { class: 'side-head' }, guildIcon(data.guild), h('b', { text: data.guild.name })),
      h('nav', { class: 'tabs' }, TABS.map(([id, ico, label]) => h('button', {
        class: `tab${id === tab ? ' active' : ''}`,
        onclick: () => { if (id !== tab) quitterSiPossible(() => { location.hash = `#/g/${currentGuild}/${id}`; }); },
      }, h('span', { text: ico }), h('span', { text: label })))),
      h('a', { class: 'back', href: '#/serveurs', text: '← Tous mes serveurs', onclick: (e) => { e.preventDefault(); quitterSiPossible(() => { location.hash = '#/serveurs'; }); } })),
    panel);
}

function choixModules() {
  const options = [
    ['communaute', '🛡️', 'Communauté', 'Modération, automod, niveaux et XP, tickets, giveaways, rôles à boutons, bienvenue, vocaux temporaires, jeux.'],
    ['academie', '🎓', 'Académie', 'Cours réseau et cybersécurité niveau CCNA, glossaire, quiz avec classement, défi du jour, outils réseau, IA.'],
    ['tous', '✨', 'Les deux', 'Tout Cyber : protège ta communauté et apprends le réseau et la cybersécurité.'],
  ];
  const choisir = async (id, carte) => {
    carte.classList.add('choisie');
    const modules = { communaute: id !== 'academie', academie: id !== 'communaute' };
    try {
      await api('PUT', `/guilds/${currentGuild}/config`, { modules, modulesChoisis: true });
      data.config.modules = modules;
      data.config.modulesChoisis = true;
      toast('✅ Modules enregistrés. Tu pourras changer dans l\'onglet Général.');
      setTimeout(render, 450);
    } catch (err) { carte.classList.remove('choisie'); toast(`❌ ${err.message}`, false); }
  };
  return h('section', { class: 'onboarding' },
    ...cascade([
      guildIcon(data.guild, 'gicon big'),
      h('h1', { class: 'page-title', text: `Bienvenue sur ${data.guild.name} !` }),
      h('p', { class: 'page-sub', text: 'Que doit faire Cyber sur ce serveur ? Tu pourras changer à tout moment.' }),
      h('div', { class: 'choix' }, options.map(([id, ico, titre, desc]) => {
        const carte = h('button', { class: `choix-carte${id === 'tous' ? ' reco' : ''}`, type: 'button' },
          id === 'tous' ? h('span', { class: 'reco-badge', text: 'Recommandé' }) : null,
          h('span', { class: 'choix-ico', text: ico }), h('b', { text: titre }), h('span', { text: desc }));
        carte.addEventListener('click', () => choisir(id, carte));
        return carte;
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
  return [h('h2', { text: title }), h('p', { class: 'desc', text: desc })];
}

function tabOverview() {
  const s = data.stats;
  const c = data.config;
  const a = data.automod;
  const mod = (name, on, detail) => h('div', { class: 'module' },
    h('span', { class: on ? 'on' : 'off-txt', text: on ? '●' : '○' }),
    h('span', { text: name }), detail ? h('span', { class: 'off-txt', text: ` · ${detail}` }) : null);
  return [
    ...header('Aperçu', `${data.guild.memberCount} membres sur ${data.guild.name}.`),
    h('div', { class: 'stats' }, [
      ['👤', s.humans, 'Humains'], ['🤖', s.bots, 'Bots'], ['💬', s.channels, 'Salons'], ['🎭', s.roles, 'Rôles'],
      ['⚠️', s.warns, 'Avertissements'], ['🎫', s.openTickets, 'Tickets ouverts'], ['📈', s.ranked, 'Membres classés'], ['🏷️', s.tags, 'Tags'],
    ].map(([i, v, l]) => h('div', { class: 'stat' }, h('div', { class: 'v' }, h('span', { class: 'ico', text: i }), h('span', { 'data-compte': String(v), text: String(v) })), h('div', { class: 'l', text: l })))),
    h('div', { class: 'card' }, h('h3', { text: 'Modules' }), h('p', { class: 'hint', text: 'Ce qui est actif sur ton serveur.' }),
      h('div', { class: 'modules' },
        mod('Logs', !!c.logChannelId), mod('Bienvenue', !!c.welcomeChannelId), mod('Rôle automatique', !!c.autoRoleId),
        mod('Automod', a.enabled), mod('Niveaux', c.levelsEnabled, `${Object.keys(c.levelRewards).length} récompense(s)`),
        mod('Tickets', !!c.ticketStaffRoleId), mod('Vocaux temporaires', !!c.tempVoiceId), mod('Suggestions', !!c.suggestionChannelId),
        mod('Module Académie', c.modules?.academie !== false), mod('Défi du jour', !!c.defi?.channelId && c.defi?.actif !== false))),
    leaderboardCard(),
  ];
}

function leaderboardCard() {
  return h('div', { class: 'card' }, h('h3', { text: '🏆 Classement' }),
    data.leaderboard.length
      ? h('ol', { class: 'lb' }, data.leaderboard.map((u, i) => h('li', {},
        h('span', { class: 'pos', text: ['🥇', '🥈', '🥉'][i] || i + 1 }),
        u.avatar ? h('img', { src: u.avatar, alt: '' }) : h('span', { class: 'ph' }),
        h('span', { class: 'who', text: u.name }),
        h('span', {}, h('span', { class: 'lvl', text: `Niv. ${u.level}` }), ' ', h('span', { class: 'xp', text: `${u.xp} XP` })))))
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
    h('div', { class: 'card' },
      h('h3', { text: '🧩 Modules' }), h('p', { class: 'hint', text: 'Active les parties de Cyber dont ton serveur a besoin. Les commandes d\'un module désactivé sont masquées.' }),
      toggle('🛡️ Communauté', 'Modération, automod, niveaux, tickets, giveaways, rôles, bienvenue, fun.', mods.communaute, (v) => { mods.communaute = v; }),
      toggle('🎓 Académie', 'Cours réseau et cybersécurité (CCNA), quiz, défi du jour, outils réseau, IA.', mods.academie, (v) => { mods.academie = v; })),
    h('div', { class: 'card' },
      h('h3', { text: '📜 Logs' }), h('p', { class: 'hint', text: 'Sanctions, messages supprimés ou modifiés, tickets fermés, automod…' }),
      field('Salon des logs', logs)),
    h('div', { class: 'card' },
      h('h3', { text: '🎭 Rôle automatique' }), h('p', { class: 'hint', text: 'Donné à chaque nouveau membre dès son arrivée.' }),
      field('Rôle', auto)),
    h('div', { class: 'card' },
      h('h3', { text: '💡 Suggestions' }), h('p', { class: 'hint', text: 'Salon où arrivent les idées envoyées avec /suggestion.' }),
      field('Salon des suggestions', sugg)),
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
    off ? h('div', { class: 'card' }, h('p', { class: 'hint', text: '⚠️ Le module Académie est désactivé. Active-le dans l\'onglet Général.' })) : null,
    h('div', { class: 'card' },
      h('h3', { text: '🧠 Défi du jour' }), h('p', { class: 'hint', text: 'Une question est publiée chaque jour. Chacun répond une seule fois (+15 points), la réponse est dévoilée au défi suivant.' }),
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
    h('div', { class: 'card' },
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
    h('div', { class: 'card' },
      toggle('Activer l\'automod', 'Interrupteur général de la modération automatique.', a.enabled, (v) => { a.enabled = v; simuler(); })),
    h('div', { class: 'card' }, h('h3', { text: 'Filtres' }),
      toggle('Invitations Discord', 'Bloque les liens discord.gg vers d\'autres serveurs.', a.invites, (v) => { a.invites = v; simuler(); }),
      toggle('Liens', 'Bloque tous les liens http(s).', a.links, (v) => { a.links = v; simuler(); }),
      toggle('Spam', '6 messages ou plus en 5 secondes.', a.spam, (v) => { a.spam = v; simuler(); }),
      toggle('Majuscules', 'Messages écrits à plus de 70 % en majuscules.', a.caps, (v) => { a.caps = v; simuler(); }),
      toggle('Mentions de masse', 'Trop de mentions dans un seul message.', a.mentions, (v) => { a.mentions = v; simuler(); })),
    h('div', { class: 'card' }, h('h3', { text: 'Réglages' }),
      h('div', { class: 'row' },
        field('Mentions maximum par message', maxMentions),
        field('Infractions avant un mute de 10 min', timeoutAfter))),
    h('div', { class: 'card' }, h('h3', { text: '🚫 Mots interdits' }),
      h('div', { class: 'inline' }, wordInput, h('button', { class: 'btn ghost', text: 'Ajouter', onclick: addWord })), wordChips),
    h('div', { class: 'card' }, h('h3', { text: '✅ Rôles ignorés' }), h('p', { class: 'hint', text: 'Les membres avec ces rôles ne sont pas filtrés.' }),
      roleAdd, roleChips),
    h('div', { class: 'card simu' }, h('h3', { text: '🧪 Simulateur' }), h('p', { class: 'hint', text: 'Teste tes réglages avant de les enregistrer. Les membres du staff ne sont jamais filtrés.' }),
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
    h('div', { class: 'card' }, toggle('Activer les niveaux', 'Gain d\'XP, annonces et récompenses.', enabled, (v) => { enabled = v; })),
    h('div', { class: 'card' }, h('h3', { text: '📣 Annonce de passage de niveau' }),
      field('Salon des annonces', ch),
      field('Message', ed.node, 'Laisse vide pour le message par défaut.')),
    h('div', { class: 'card' }, h('h3', { text: '🎁 Rôles récompenses' }), h('p', { class: 'hint', text: 'Donnés automatiquement quand un membre atteint le niveau.' }),
      list,
      h('div', { class: 'reward-add' }, roleIn, lvlInput, h('button', { class: 'btn ghost', text: 'Ajouter', onclick: addReward }))),
    saveButton(() => ({ levelsEnabled: enabled, levelChannelId: ch.value || null, levelMessage: ed.ta.value.trim() || null, levelRewards: rewards })),
    leaderboardCard(),
  ];
}

function publishCard(title, hint, type, extra, apercu) {
  const ch = channelSelect(data.channels.text, '', '#', '— Choisis un salon —');
  const msg = h('textarea', { maxLength: 1000, placeholder: 'Texte du panneau (facultatif)' });
  const ap = apercuBox(() => apercu(msg.value.trim()));
  msg.addEventListener('input', ap.maj);
  ap.maj();
  const btn = h('button', { class: 'btn', text: 'Publier le panneau' });
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const res = await api('POST', `/guilds/${currentGuild}/publish`, { type, channelId: ch.value, message: msg.value, ...(extra ? extra.get() : {}) });
      toast(res?.message || '✅ Panneau publié sur Discord');
    } catch (err) { toast(`❌ ${err.message}`, false); } finally { btn.disabled = false; }
  });
  return h('div', { class: 'card' }, h('h3', { text: title }), h('p', { class: 'hint', text: hint }),
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
    h('div', { class: 'card' }, h('h3', { text: '🎫 Réglages des tickets' }),
      h('div', { class: 'row' }, field('Rôle staff (voit les tickets)', staff), field('Catégorie des tickets', cat)),
      saveButton(() => ({ ticketStaffRoleId: staff.value || null, ticketCategoryId: cat.value || null }))),
    publishCard('📤 Publier le panneau de tickets', 'Envoie le bouton « Ouvrir un ticket » dans un salon. Enregistre le rôle staff avant.', 'ticket', null,
      (t) => discordMsg({ embed: { title: '🎫 Support', desc: md(t || 'Besoin d\'aide ? Clique sur le bouton pour ouvrir un ticket privé avec l\'équipe.') }, buttons: [{ label: 'Ouvrir un ticket', emoji: '🎫', style: 'red' }] })),
    publishCard('🛡️ Publier le panneau de vérification', 'Bouton « Je ne suis pas un robot » qui donne un rôle. Les comptes de moins de 24 h sont refusés.', 'verification',
      { node: field('Rôle donné', verifRole), get: () => ({ roleId: verifRole.value }) },
      (t) => discordMsg({ embed: { title: '🛡️ Vérification', desc: md(t || 'Clique sur le bouton pour accéder au serveur.') }, buttons: [{ label: 'Je ne suis pas un robot', emoji: '✅', style: 'green' }] })),
  ];
}

function tabVoice() {
  const ch = channelSelect(data.channels.voice, data.config.tempVoiceId, '🔊 ');
  return [
    ...header('Vocaux temporaires', 'Quand un membre rejoint le salon créateur, Cyber lui crée son propre salon vocal, supprimé dès qu\'il est vide.'),
    h('div', { class: 'card' },
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
