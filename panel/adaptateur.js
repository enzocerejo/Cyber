'use strict';
// Adaptateur du tableau de bord pour le site GitHub Pages.
// - Connexion avec un vrai compte Discord (OAuth2 dans le navigateur, autorisations « identify » et « guilds » seulement).
// - Tant que le bot n'est pas hébergé en ligne, les réglages sont gardés dans ce navigateur (mode aperçu).
// - Le jour où l'API du bot sera en ligne, il suffira de remplacer cet adaptateur.
(function () {
  const CLIENT_ID = '1563977964616421376';
  const API = 'https://discord.com/api/v10';
  // Adresse de retour toujours identique (avec ou sans « index.html »), elle doit être enregistrée telle quelle dans le Developer Portal
  const REDIRECT = location.origin + location.pathname.replace(/index\.html$/, '');
  const DEMO_ID = 'demo';

  // Stockage protégé (le navigateur peut le bloquer en navigation privée)
  const ss = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* ignoré */ } },
    del: (k) => { try { sessionStorage.removeItem(k); } catch { /* ignoré */ } },
  };
  const ls = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignoré */ } },
  };

  const memoire = {}; // secours si le stockage est bloqué
  const lireConfig = (id) => ls.get(`cyber-apercu-${id}`) || memoire[id] || {};
  const ecrireConfig = (id, cfg) => { memoire[id] = cfg; ls.set(`cyber-apercu-${id}`, cfg); };

  let cache = null; // { user, guilds }

  // ---------- Données d'exemple (salons et rôles fictifs) ----------
  const CATS = [
    ['c1', 'Informations'], ['c2', 'Discussions'], ['c3', 'Staff'], ['c4', 'Support'], ['c5', 'Vocaux'], ['c6', 'Tickets'],
  ];
  const TEXT = [
    ['t1', 'règlement', 'Informations'], ['t2', 'annonces', 'Informations'], ['t3', 'bienvenue', 'Informations'],
    ['t4', 'général', 'Discussions'], ['t5', 'médias', 'Discussions'], ['t6', 'suggestions', 'Discussions'], ['t7', 'niveaux', 'Discussions'],
    ['t8', 'logs', 'Staff'], ['t9', 'staff', 'Staff'],
    ['t10', 'support', 'Support'], ['t11', 'vérification', 'Support'],
  ];
  const VOICE = [['v1', '➕ Créer un vocal', 'Vocaux'], ['v2', 'Salon vocal', 'Vocaux'], ['v3', 'AFK', 'Vocaux']];
  const ROLES = [
    ['r1', 'Admin', '#ff5a6e', false], ['r2', 'Modérateur', '#f1c40f', true], ['r3', 'Staff', '#e67e22', true],
    ['r4', 'Actif', '#5865f2', true], ['r5', 'Vétéran', '#9b59b6', true], ['r6', 'Gamer', '#1abc9c', true],
    ['r7', 'Réseau', '#3498db', true], ['r8', 'Membre', '#3ddc84', true],
  ];
  const PSEUDOS = ['Léo', 'Maya', 'Noah', 'Inès', 'Hugo', 'Jade', 'Lucas', 'Chloé', 'Nathan', 'Lina'];
  const DEFAULTS = {
    welcomeMessage: 'Bienvenue {membre} sur **{serveur}** ! Tu es notre {nombre}ᵉ membre 🎉',
    levelMessage: '🎉 GG {membre}, tu passes au **niveau {niveau}** !',
  };
  const AUTOMOD = {
    enabled: false, links: false, invites: true, spam: true, caps: false, mentions: true,
    maxMentions: 5, words: [], exemptRoles: [], timeoutAfter: 3,
  };

  // Petit générateur pseudo-aléatoire stable (mêmes chiffres pour un même serveur)
  function graine(str) {
    let h = 2166136261;
    for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }
  const xpPourNiveau = (n) => 5 * n * n + 50 * n + 100;
  function niveau(xp) { let l = 0; while (xp >= xpPourNiveau(l)) { xp -= xpPourNiveau(l); l++; } return l; }

  function donneesServeur(g) {
    const rnd = graine(g.id);
    const membres = g.memberCount || 20 + Math.floor(rnd() * 400);
    const cfg = lireConfig(g.id);
    const lb = PSEUDOS.map((name) => ({ id: name, name, avatar: null, xp: Math.floor(rnd() * 9000) + 200, messages: Math.floor(rnd() * 1500) }))
      .sort((a, b) => b.xp - a.xp).map((u) => ({ ...u, level: niveau(u.xp) }));
    return {
      guild: { id: g.id, name: g.name, icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128` : null, memberCount: membres },
      channels: {
        text: TEXT.map(([id, name, parent]) => ({ id, name, parent })),
        voice: VOICE.map(([id, name, parent]) => ({ id, name, parent })),
        categories: CATS.map(([id, name]) => ({ id, name, parent: null })),
      },
      roles: ROLES.map(([id, name, color, assignable]) => ({ id, name, color, assignable })),
      config: {
        logChannelId: null, welcomeChannelId: null, suggestionChannelId: null, levelChannelId: null,
        tempVoiceId: null, ticketCategoryId: null, autoRoleId: null, ticketStaffRoleId: null,
        welcomeMessage: null, levelMessage: null, levelsEnabled: true, levelRewards: {},
        ...cfg, automod: undefined,
      },
      defaults: DEFAULTS,
      automod: { ...AUTOMOD, ...(cfg.automod || {}) },
      stats: {
        humans: Math.max(1, membres - 3), bots: 3, channels: TEXT.length + VOICE.length + CATS.length, roles: ROLES.length,
        warns: Math.floor(rnd() * 12), openTickets: Math.floor(rnd() * 4), ranked: PSEUDOS.length, tags: Math.floor(rnd() * 6),
      },
      leaderboard: lb,
    };
  }

  // ---------- Connexion Discord ----------
  async function discord(route, token) {
    const r = await fetch(API + route, { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 401) { ss.del('cyber-token'); throw Object.assign(new Error('Session expirée, reconnecte-toi.'), { status: 401 }); }
    if (!r.ok) throw new Error(`Discord a répondu ${r.status}`);
    return r.json();
  }

  const peutGerer = (g) => {
    const p = BigInt(g.permissions || 0);
    return g.owner || (p & 0x8n) === 0x8n || (p & 0x20n) === 0x20n;
  };

  const DEMO_GUILD = { id: DEMO_ID, name: 'Serveur de démonstration', icon: null, memberCount: 128 };

  window.CYBER_PANEL = {
    logo: '../assets/logo.png',
    error: null,

    // Au retour de Discord : récupère le jeton dans l'adresse puis l'efface de la barre d'adresse
    async init() {
      const frag = new URLSearchParams(location.hash.slice(1));
      if (frag.has('access_token') || frag.has('error')) {
        const attendu = ss.get('cyber-state');
        ss.del('cyber-state');
        if (frag.get('error')) this.error = 'Connexion annulée.';
        else if (!attendu || frag.get('state') !== attendu) this.error = 'Connexion refusée (vérification de sécurité échouée).';
        else {
          ss.set('cyber-token', frag.get('access_token'));
          ss.del('cyber-demo');
        }
        history.replaceState(null, '', location.pathname.replace(/index\.html$/, '') + location.search);
      }
    },

    login() {
      const state = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
      ss.set('cyber-state', state);
      const p = new URLSearchParams({ client_id: CLIENT_ID, response_type: 'token', redirect_uri: REDIRECT, scope: 'identify guilds', state, prompt: 'none' });
      location.href = `https://discord.com/oauth2/authorize?${p}`;
    },

    startDemo() { ss.set('cyber-demo', '1'); cache = null; },

    logout() { ss.del('cyber-token'); ss.del('cyber-demo'); cache = null; },

    banner(me) {
      return me.user.id === 'demo'
        ? '🧪 Mode démo : explore librement, rien n\'est envoyé à Discord. Tes réglages restent dans ce navigateur.'
        : '🛠️ Aperçu : Cyber n\'est pas encore hébergé en ligne. Tes réglages sont gardés dans ce navigateur et ne sont pas encore appliqués au bot. Les salons et rôles affichés sont des exemples.';
    },

    async request(method, url, body = {}) {
      const token = ss.get('cyber-token');
      const demo = ss.get('cyber-demo') === '1';

      if (method === 'GET' && url === '/me') {
        if (cache) return cache;
        if (token) {
          const [u, guilds] = await Promise.all([discord('/users/@me', token), discord('/users/@me/guilds?with_counts=true', token)]);
          cache = {
            user: { id: u.id, username: u.username, globalName: u.global_name, avatar: u.avatar },
            guilds: [
              { ...DEMO_GUILD, botIn: true },
              ...guilds.filter(peutGerer).map((g) => ({ id: g.id, name: g.name, icon: g.icon, memberCount: g.approximate_member_count, botIn: true })),
            ],
          };
          return cache;
        }
        if (demo) {
          cache = { user: { id: 'demo', username: 'visiteur', globalName: 'Visiteur', avatar: null }, guilds: [{ ...DEMO_GUILD, botIn: true }] };
          return cache;
        }
        throw Object.assign(new Error('Non connecté'), { status: 401 });
      }

      const m = /^\/guilds\/([^/]+)(\/config|\/publish)?$/.exec(url);
      if (!m) throw new Error('Action inconnue');
      const me = cache || await this.request('GET', '/me');
      const g = me.guilds.find((x) => x.id === m[1]);
      if (!g) throw Object.assign(new Error('Tu n\'as pas la permission « Gérer le serveur » ici.'), { status: 403 });

      if (method === 'GET' && !m[2]) return donneesServeur(g);

      if (method === 'PUT' && m[2] === '/config') {
        const cfg = lireConfig(g.id);
        if (body.automod) cfg.automod = { ...(cfg.automod || {}), ...body.automod };
        for (const [k, v] of Object.entries(body)) if (k !== 'automod') cfg[k] = v;
        ecrireConfig(g.id, cfg);
        return { ok: true, message: '✅ Enregistré dans ce navigateur (aperçu)' };
      }

      if (method === 'POST' && m[2] === '/publish') {
        throw new Error('Aperçu : la publication sur Discord sera disponible quand Cyber sera hébergé en ligne.');
      }
      throw new Error('Action inconnue');
    },
  };
})();
