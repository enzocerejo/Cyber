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
  const input = h('input', { type: 'checkbox', checked, onchange: (e) => onchange(e.target.checked) });
  return h('div', { class: 'toggle' },
    h('div', { class: 't-text' }, h('b', { text: title }), desc ? h('span', { text: desc }) : null),
    h('label', { class: 'switch' }, input, h('span', { class: 'slider' })));
}

function saveButton(getPatch, label = 'Enregistrer') {
  const btn = h('button', { class: 'btn', text: label });
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const patch = getPatch();
      const res = await api('PUT', `/guilds/${currentGuild}/config`, patch);
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'automod') Object.assign(data.automod, v);
        else data.config[k] = v;
      }
      toast(res?.message || '✅ Modifications enregistrées');
    } catch (err) {
      toast(`❌ ${err.message}`, false);
    } finally {
      btn.disabled = false;
    }
  });
  return h('div', { class: 'actions' }, btn);
}

// Aperçu façon Discord (le texte est échappé avant toute mise en forme)
function renderPreview(el, text, vars) {
  let html = escapeHtml(text);
  for (const [k, v] of Object.entries(vars)) {
    html = html.split(escapeHtml(k)).join(v.mention ? `<span class="mention">${escapeHtml(v.text)}</span>` : escapeHtml(v.text));
  }
  html = html.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*(?!\*)(.+?)\*/g, '$1<i>$2</i>');
  el.innerHTML = html;
}

function messageEditor(value, def, vars, max) {
  const ta = h('textarea', { maxLength: max, placeholder: def });
  ta.value = value || '';
  const prev = h('div', { class: 'preview' });
  const update = () => renderPreview(prev, ta.value || def, vars);
  ta.addEventListener('input', update);
  const chips = h('div', { class: 'chips' }, Object.keys(vars).map((k) => h('span', {
    class: 'chip var', text: k, title: 'Cliquer pour insérer',
    onclick: () => {
      const s = ta.selectionStart ?? ta.value.length;
      ta.value = ta.value.slice(0, s) + k + ta.value.slice(ta.selectionEnd ?? s);
      ta.focus(); update();
    },
  })));
  update();
  return { ta, node: h('div', {}, ta, chips, h('div', { class: 'hint', text: 'Aperçu :' }), prev) };
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
      ? h('div', { class: 'guilds' }, me.guilds.map((g) => h('div', { class: `guild-card${g.botIn ? '' : ' off'}` },
        guildIcon(g),
        h('div', { class: 'gname', text: g.name }),
        g.botIn
          ? h('a', { class: 'btn', href: `#/g/${g.id}/apercu`, text: 'Configurer' })
          : h('a', { class: 'btn ghost', href: g.invite, target: '_blank', rel: 'noopener', text: 'Inviter Cyber' }))))
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
];

function guildPage(tab) {
  const panel = h('div', { class: 'panel' });
  const views = { apercu: tabOverview, general: tabGeneral, bienvenue: tabWelcome, automod: tabAutomod, niveaux: tabLevels, tickets: tabTickets, vocaux: tabVoice };
  panel.append(...(views[tab] || tabOverview)());
  return h('div', { class: 'layout' },
    h('aside', { class: 'sidebar' },
      h('div', { class: 'side-head' }, guildIcon(data.guild), h('b', { text: data.guild.name })),
      h('nav', { class: 'tabs' }, TABS.map(([id, ico, label]) => h('button', {
        class: `tab${id === tab ? ' active' : ''}`,
        onclick: () => { location.hash = `#/g/${currentGuild}/${id}`; },
      }, h('span', { text: ico }), h('span', { text: label })))),
      h('a', { class: 'back', href: '#/serveurs', text: '← Tous mes serveurs' })),
    panel);
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
    ].map(([i, v, l]) => h('div', { class: 'stat' }, h('div', { class: 'v', text: `${i} ${v}` }), h('div', { class: 'l', text: l })))),
    h('div', { class: 'card' }, h('h3', { text: 'Modules' }), h('p', { class: 'hint', text: 'Ce qui est actif sur ton serveur.' }),
      h('div', { class: 'modules' },
        mod('Logs', !!c.logChannelId), mod('Bienvenue', !!c.welcomeChannelId), mod('Rôle automatique', !!c.autoRoleId),
        mod('Automod', a.enabled), mod('Niveaux', c.levelsEnabled, `${Object.keys(c.levelRewards).length} récompense(s)`),
        mod('Tickets', !!c.ticketStaffRoleId), mod('Vocaux temporaires', !!c.tempVoiceId), mod('Suggestions', !!c.suggestionChannelId))),
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
  return [
    ...header('Général', 'Les réglages de base de Cyber.'),
    h('div', { class: 'card' },
      h('h3', { text: '📜 Logs' }), h('p', { class: 'hint', text: 'Sanctions, messages supprimés ou modifiés, tickets fermés, automod…' }),
      field('Salon des logs', logs)),
    h('div', { class: 'card' },
      h('h3', { text: '🎭 Rôle automatique' }), h('p', { class: 'hint', text: 'Donné à chaque nouveau membre dès son arrivée.' }),
      field('Rôle', auto)),
    h('div', { class: 'card' },
      h('h3', { text: '💡 Suggestions' }), h('p', { class: 'hint', text: 'Salon où arrivent les idées envoyées avec /suggestion.' }),
      field('Salon des suggestions', sugg)),
    saveButton(() => ({ logChannelId: logs.value || null, autoRoleId: auto.value || null, suggestionChannelId: sugg.value || null })),
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
  const ed = messageEditor(c.welcomeMessage, data.defaults.welcomeMessage, vars, 1000);
  return [
    ...header('Bienvenue', 'Accueille les nouveaux membres avec un message personnalisé.'),
    h('div', { class: 'card' },
      field('Salon de bienvenue (et des départs)', ch),
      field('Message', ed.node, 'Clique sur une variable pour l\'insérer. Laisse vide pour le message par défaut. **gras** et *italique* fonctionnent.')),
    saveButton(() => ({ welcomeChannelId: ch.value || null, welcomeMessage: ed.ta.value.trim() || null })),
  ];
}

function tabAutomod() {
  const a = structuredClone(data.automod);
  const words = new Set(a.words);
  const exempt = new Set(a.exemptRoles);

  const wordChips = h('div', { class: 'chips' });
  const drawWords = () => wordChips.replaceChildren(...[...words].map((w) => h('span', { class: 'chip' }, w,
    h('button', { title: 'Retirer', text: '×', onclick: () => { words.delete(w); drawWords(); } }))));
  const wordInput = h('input', { type: 'text', placeholder: 'Ajouter un mot puis Entrée', maxLength: 50 });
  const addWord = () => { const v = wordInput.value.trim().toLowerCase(); if (v) { words.add(v); wordInput.value = ''; drawWords(); } };
  wordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addWord(); } });

  const roleChips = h('div', { class: 'chips' });
  const drawRoles = () => roleChips.replaceChildren(...[...exempt].map((id) => {
    const r = data.roles.find((x) => x.id === id);
    return h('span', { class: 'chip' }, `@${r?.name ?? 'rôle supprimé'}`,
      h('button', { title: 'Retirer', text: '×', onclick: () => { exempt.delete(id); drawRoles(); } }));
  }));
  const roleAdd = roleSelect('', { none: '— Ajouter un rôle —' });
  roleAdd.addEventListener('change', () => { if (roleAdd.value) { exempt.add(roleAdd.value); roleAdd.value = ''; drawRoles(); } });

  const maxMentions = h('input', { type: 'number', min: 2, max: 50, value: a.maxMentions });
  const timeoutAfter = h('input', { type: 'number', min: 1, max: 10, value: a.timeoutAfter });
  drawWords(); drawRoles();

  return [
    ...header('Automod', 'Cyber supprime automatiquement les messages interdits. Le staff (Gérer les messages) est toujours ignoré.'),
    h('div', { class: 'card' },
      toggle('Activer l\'automod', 'Interrupteur général de la modération automatique.', a.enabled, (v) => { a.enabled = v; })),
    h('div', { class: 'card' }, h('h3', { text: 'Filtres' }),
      toggle('Invitations Discord', 'Bloque les liens discord.gg vers d\'autres serveurs.', a.invites, (v) => { a.invites = v; }),
      toggle('Liens', 'Bloque tous les liens http(s).', a.links, (v) => { a.links = v; }),
      toggle('Spam', '6 messages ou plus en 5 secondes.', a.spam, (v) => { a.spam = v; }),
      toggle('Majuscules', 'Messages écrits à plus de 70 % en majuscules.', a.caps, (v) => { a.caps = v; }),
      toggle('Mentions de masse', 'Trop de mentions dans un seul message.', a.mentions, (v) => { a.mentions = v; })),
    h('div', { class: 'card' }, h('h3', { text: 'Réglages' }),
      h('div', { class: 'row' },
        field('Mentions maximum par message', maxMentions),
        field('Infractions avant un mute de 10 min', timeoutAfter))),
    h('div', { class: 'card' }, h('h3', { text: '🚫 Mots interdits' }),
      h('div', { class: 'inline' }, wordInput, h('button', { class: 'btn ghost', text: 'Ajouter', onclick: addWord })), wordChips),
    h('div', { class: 'card' }, h('h3', { text: '✅ Rôles ignorés' }), h('p', { class: 'hint', text: 'Les membres avec ces rôles ne sont pas filtrés.' }),
      roleAdd, roleChips),
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
  const ed = messageEditor(c.levelMessage, data.defaults.levelMessage, vars, 500);

  const list = h('ul', { class: 'rewards' });
  const drawRewards = () => {
    const entries = Object.entries(rewards).sort((x, y) => x[0] - y[0]);
    list.replaceChildren(...(entries.length ? entries.map(([lvl, id]) => {
      const r = data.roles.find((x) => x.id === id);
      const dot = h('span', { class: 'dot' });
      dot.style.background = r?.color && r.color !== '#000000' ? r.color : '#9d98a6';
      return h('li', {}, h('span', { class: 'lv', text: `Niveau ${lvl}` }), dot, h('span', { class: 'rl', text: `@${r?.name ?? 'rôle supprimé'}` }),
        h('button', { class: 'btn ghost small', text: 'Retirer', onclick: () => { delete rewards[lvl]; drawRewards(); } }));
    }) : [h('li', { class: 'empty', text: 'Aucune récompense.' })]));
  };
  const lvlInput = h('input', { type: 'number', min: 1, max: 500, placeholder: 'Niveau' });
  const roleIn = roleSelect('', { onlyAssignable: true, none: '— Rôle —' });
  const addReward = () => {
    const n = Number(lvlInput.value);
    if (!Number.isInteger(n) || n < 1 || n > 500) return toast('❌ Niveau entre 1 et 500', false);
    if (!roleIn.value) return toast('❌ Choisis un rôle', false);
    rewards[n] = roleIn.value; lvlInput.value = ''; roleIn.value = ''; drawRewards();
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

function publishCard(title, hint, type, extra) {
  const ch = channelSelect(data.channels.text, '', '#', '— Choisis un salon —');
  const msg = h('textarea', { maxLength: 1000, placeholder: 'Texte du panneau (facultatif)' });
  const btn = h('button', { class: 'btn', text: 'Publier le panneau' });
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const res = await api('POST', `/guilds/${currentGuild}/publish`, { type, channelId: ch.value, message: msg.value, ...(extra ? extra.get() : {}) });
      toast(res?.message || '✅ Panneau publié sur Discord');
    } catch (err) { toast(`❌ ${err.message}`, false); } finally { btn.disabled = false; }
  });
  return h('div', { class: 'card' }, h('h3', { text: title }), h('p', { class: 'hint', text: hint }),
    h('div', { class: 'row' }, field('Salon', ch), extra ? extra.node : null), field('Message', msg), h('div', { class: 'actions' }, btn));
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
    publishCard('📤 Publier le panneau de tickets', 'Envoie le bouton « Ouvrir un ticket » dans un salon. Enregistre le rôle staff avant.', 'ticket'),
    publishCard('🛡️ Publier le panneau de vérification', 'Bouton « Je ne suis pas un robot » qui donne un rôle. Les comptes de moins de 24 h sont refusés.', 'verification',
      { node: field('Rôle donné', verifRole), get: () => ({ roleId: verifRole.value }) }),
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
      $app.replaceChildren(h('div', { class: 'loading', text: 'Chargement du serveur…' }));
      try {
        data = await api('GET', `/guilds/${id}`);
        currentGuild = id;
      } catch (err) {
        $app.replaceChildren(h('div', { class: 'error-banner', text: err.message }), h('a', { class: 'btn ghost', href: '#/serveurs', text: '← Retour' }));
        return;
      }
    }
    $app.replaceChildren(guildPage(tab));
    window.scrollTo({ top: 0 });
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
