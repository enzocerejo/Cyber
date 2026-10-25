'use strict';

// Menu mobile
const menuBtn = document.querySelector('.menu-btn');
const links = document.querySelector('.links');
menuBtn.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
links.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
});

document.getElementById('annee').textContent = new Date().getFullYear();

// Liste des commandes (données générées depuis le code du bot dans commandes.js)
const data = window.CYBER_COMMANDES || [];
const total = data.reduce((n, c) => n + c.commands.length, 0);
document.getElementById('nb-commandes').textContent = total;

const $cats = document.getElementById('cats');
const $liste = document.getElementById('liste');
const $recherche = document.getElementById('recherche');
let categorie = 'toutes';

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function boutonCat(id, label, n) {
  const b = el('button', `cat${id === categorie ? ' active' : ''}`, label);
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-selected', String(id === categorie));
  b.append(el('small', null, n));
  b.addEventListener('click', () => { categorie = id; afficher(); });
  return b;
}

function afficher() {
  $cats.replaceChildren(boutonCat('toutes', 'Toutes', total), ...data.map((c) => boutonCat(c.id, `${c.emoji} ${c.label}`, c.commands.length)));
  const q = $recherche.value.trim().toLowerCase().replace(/^\//, '');
  const cmds = data
    .filter((c) => categorie === 'toutes' || c.id === categorie)
    .flatMap((c) => c.commands.map((cmd) => ({ ...cmd, emoji: c.emoji })))
    .filter((cmd) => !q || cmd.name.includes(q) || cmd.desc.toLowerCase().includes(q) || cmd.subs.some((s) => s.name.includes(q)));

  if (!cmds.length) { $liste.replaceChildren(el('p', 'vide', 'Aucune commande trouvée.')); return; }
  $liste.replaceChildren(...cmds.map((cmd) => {
    const card = el('article', 'cmd');
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

// Apparition douce des blocs au défilement
const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
}, { threshold: 0.12 }) : null;
document.querySelectorAll('.card, .section h2, .faq details, .split > *').forEach((n) => {
  if (io) { n.classList.add('reveal'); io.observe(n); }
});
