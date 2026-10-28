// Bibliothèque de mots interdits de l'automod + moteur de détection des variantes.
// Ce fichier est utilisé à la fois par le bot (require) et par le panel (simulateur) : un seul endroit à modifier.
// Les variantes courantes sont reconnues automatiquement : majuscules, accents, l33t (c0nn4rd), lettres répétées
// (connnnard), lettres séparées (c.o.n.n.a.r.d / c o n n a r d), pluriels et féminins (connards, connasses).
(function (racine, fabrique) {
  if (typeof module === 'object' && module.exports) module.exports = fabrique();
  else racine.CYBER_MOTS = fabrique();
}(typeof self !== 'undefined' ? self : this, () => {
  // [id, nom, explication, activée par défaut, mots]
  const CATEGORIES = [
    ['insultes', 'Insultes', 'Insultes courantes en français (et leurs abréviations).', true, [
      'connard', 'conard', 'connasse', 'conasse', 'conne', 'salope', 'salopard', 'salaud', 'pute', 'putes', 'enculé', 'enculer', 'enculeur', 'enfoiré',
      'fils de pute', 'fdp', 'ntm', 'nique ta mère', 'nique ta mere', 'niquetamere', 'niktamer', 'nik ta mere', 'ta mère la pute',
      'tg', 'ta gueule', 'ferme ta gueule', 'ftg', 'batard', 'bâtard', 'bouffon', 'abruti', 'crétin', 'débile', 'idiot',
      'imbécile', 'pauvre con', 'gros con', 'sale con', 'grosse conne', 'trou du cul', 'trouduc', 'tête de con', 'sous-merde',
      'merdeux', 'clochard', 'cassos', 'cas soc', 'raclure', 'pourriture', 'boloss', 'bolosse', 'tocard',
      'tocarde', 'blaireau', 'chiasse', 'baltringue', 'pétasse', 'pouffiasse', 'grognasse', 'garce', 'catin', 'trainée',
      'suceur', 'suceuse', 'branleur', 'branleuse', 'couillon', 'connar', 'konar', 'kon', 'sal pute', 'slp',
      'tafiole', 'nul à chier', 'va te faire foutre', 'va te faire enculer', 'vtff', 'vtfe', 'ntr', 'nique ta race',
      'nique tes morts', 'ntm la pute',
    ]],
    ['haine', 'Haine et discriminations', 'Racisme, antisémitisme, homophobie, transphobie, validisme, sexisme.', true, [
      'nègre', 'negre', 'négro', 'negro', 'bamboula', 'bougnoule', 'bougnoul', 'bicot', 'crouille', 
      'youpin', 'youpine', 'youtre', 'feuj de merde', 'sale juif', 'sale arabe', 'sale noir', 'sale blanc', 'sale noire',
      'sale chinois', 'chinetoque', 'chintok', 'niakoué', 'macaque', 'singe noir', 'sale rebeu', 'sale renoi',
      'sale musulman', 'sale catho', 'sale gitan', 'romanichel', 'sale rom', 'pédé', 'pede', 'pd', 'tarlouze', 'tapette',
      'tantouze', 'fiotte', 'gouine', 'travelo', 'sale trans', 'sale gay', 'sale lesbienne', 'mongol', 'mongolien',
      'attardé', 'attardée', 'trisomique', 'autiste de merde', 'handicapé de merde', 'gogol', 'sieg heil', 'heil hitler',
      'hitler avait raison', 'white power', 'gas the jews', 'nigger', 'nigga', 'niggas', 'niggers', 'nigg3r',
      'faggot', 'faggots', 'fag', 'tranny', 'retard', 'retarded', 'chink', 'gook', 'spic', 'kike', 'wetback', 
      'sand nigger', 'raghead', 'towelhead',
    ]],
    ['harcelement', 'Harcèlement et menaces', 'Incitation au suicide, menaces de mort, doxxing.', true, [
      'suicide toi', 'suicide-toi', 'va te suicider', 'tue toi', 'tue-toi', 'va te tuer', 'va crever', 
      'je vais te tuer', 'je vais te buter', 'je vais te défoncer', 'je vais te retrouver', 'je sais où tu habites',
      'je connais ton adresse', 'on va te violer', 'je vais te violer', 'tu mérites de mourir', 'kys',
      'kill yourself', 'kill urself', 'go die', 'neck yourself', 'i will kill you', 'hope you die',
    ]],
    ['sexuel', 'Contenu sexuel', 'Vocabulaire sexuel explicite et demandes de photos.', true, [
      'bite', 'teub', 'zob', 'zizi', 'chatte', 'foufoune', 'nichons', 'nibards', 'branlette', 'branler', 'suce ma',
      'suce moi', 'sodomie', 'sodomiser', 'baiser ta', 'je te baise', 'baise ta mère', 'porno', 'porn', 'pornhub',
      'xvideos', 'nude', 'nudes', 'envoie des nudes', 'sextape', 'blowjob', 'dick pic', 'pussy', 'hentai',
      'onlyfans gratuit', 'leak nude',
    ]],
    ['arnaques', 'Arnaques et pièges', 'Faux Nitro, faux cadeaux Steam, fausses cryptos : les pièges les plus courants.', true, [
      'free nitro', 'nitro gratuit', 'nitro free', 'discord nitro free', 'free discord nitro', 'steam gift', 'free steam gift',
      'gift steam', 'cadeau steam', 'crypto giveaway', 'crypto airdrop', 'free robux', 'robux gratuit', 'robux gratuits',
      'free vbucks', 'vbucks gratuit', 'v-bucks gratuits', 'claim your nitro', 'claim nitro', 'gagne de l\'argent facilement',
      'double ton argent', 'investis maintenant', 'token grabber', 'scan this qr code', 'scanne ce qr code',
      'cs2 skins gratuit', 'free cs2 skins', 'free skins',
    ]],
    ['grossieretes', 'Grossièretés légères', 'Jurons du quotidien (putain, merde…). Désactivé par défaut : souvent toléré.', false, [
      'putain', 'ptn', 'merde', 'mrd', 'chier', 'fait chier', 'bordel', 'foutre', 'nique', 'niquer', 'couille', 'couilles',
      'cul', 'con', 'cons', 'fuck', 'fucking', 'fucked', 'motherfucker', 'wtf', 'shit', 'bullshit', 'bitch', 'bitches',
      'asshole', 'bastard', 'damn', 'crap', 'dick', 'dickhead', 'cunt', 'whore', 'slut', 'twat', 'wanker', 'prick',
    ]],
  ];

  const LEET = { 0: 'o', 1: 'i', 2: 'z', 3: 'e', 4: 'a', 5: 's', 6: 'g', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's', '€': 'e', '!': 'i', '|': 'i', '£': 'l', '+': 't' };

  // Texte -> liste de « mots » normalisés (minuscules, sans accents, l33t traduit, lettres répétées réduites)
  function decouper(texte) {
    const t = String(texte).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[0-9@$€!|£+]/g, (c) => LEET[c] || c)
      .replace(/œ/g, 'oe').replace(/æ/g, 'ae');
    const bruts = t.split(/[^a-z]+/).filter(Boolean);
    // Lettres séparées (c.o.n.n.a.r.d / c o n n a r d) : on recolle les suites d'au moins 3 lettres seules
    const mots = [];
    let suite = '';
    for (const m of bruts) {
      if (m.length === 1) { suite += m; continue; }
      if (suite.length >= 3) mots.push(suite); else if (suite) mots.push(...suite);
      suite = '';
      mots.push(m);
    }
    if (suite.length >= 3) mots.push(suite); else if (suite) mots.push(...suite);
    return mots;
  }
  const normaliser = (texte) => decouper(texte).join(' ');

  // Formes possibles d'un mot (pluriel, féminin) : seulement pour les mots d'au moins 4 lettres
  // (évite qu'un mot comme « cône » soit lu comme « con »)
  function formes(m) {
    const f = [m];
    for (const fin of ['es', 's', 'x', 'e']) if (m.endsWith(fin) && m.length - fin.length >= 4) f.push(m.slice(0, -fin.length));
    return f;
  }

  // Lettres étirées (« connnnard », « fuuuuck ») : réduites à une seule. On ne le fait QUE si une lettre est répétée
  // au moins 3 fois, sinon « cône » (cone) serait confondu avec « conne ».
  const reduire = (m) => m.replace(/(.)\1+/g, '$1');
  const etire = (m) => /(.)\1\1/.test(m);

  const caches = new Map();
  // Prépare une liste de mots/expressions (une seule fois tant qu'elle ne change pas)
  function preparer(liste, autorises = []) {
    const cle = `${liste.join('\n')}\u0000${autorises.join('\n')}`;
    let p = caches.get(cle);
    if (p) return p;
    p = { mots: new Map(), reduits: new Map(), expressions: [], autorises: new Set(autorises.map(normaliser).filter(Boolean)) };
    for (const brut of liste) {
      const n = normaliser(brut);
      if (!n) continue;
      if (n.includes(' ')) { p.expressions.push([n.split(' ').map(reduire).join(' '), brut]); continue; }
      if (!p.mots.has(n)) p.mots.set(n, brut);
      if (!p.reduits.has(reduire(n))) p.reduits.set(reduire(n), brut);
    }
    if (caches.size > 300) caches.clear();
    caches.set(cle, p);
    return p;
  }

  // Liste complète des mots à bloquer pour une config automod
  function listeActive(cfg) {
    const choix = cfg?.bibliotheque || {};
    const mots = [];
    for (const [id, , , parDefaut, liste] of CATEGORIES) if (choix[id] ?? parDefaut) mots.push(...liste);
    return mots.concat(cfg?.words || []);
  }

  // Renvoie le mot trouvé (tel qu'il est écrit dans la liste), ou null
  function trouver(texte, liste, autorises = []) {
    if (!liste.length || !texte) return null;
    const p = preparer(liste, autorises);
    const mots = decouper(texte).filter((m) => !p.autorises.has(m) && !p.autorises.has(reduire(m)));
    for (const m of mots) {
      const [carte, mot] = etire(m) ? [p.reduits, reduire(m)] : [p.mots, m];
      for (const f of formes(mot)) if (carte.has(f)) return carte.get(f);
    }
    if (p.expressions.length) {
      const reduits = mots.map(reduire);
      const phrase = ` ${reduits.join(' ')} `;
      for (const [n, brut] of p.expressions) if (phrase.includes(` ${n} `)) return brut;
      // Expression écrite collée (« niquetamere ») : comparée au mot sans espaces
      for (const [n, brut] of p.expressions) {
        const colle = reduire(n.replace(/ /g, ''));
        if (colle.length >= 8 && reduits.includes(colle)) return brut;
      }
    }
    return null;
  }

  return {
    CATEGORIES: CATEGORIES.map(([id, nom, desc, defaut, mots]) => ({ id, nom, desc, defaut, mots })),
    normaliser, decouper, listeActive, trouver,
  };
}));
