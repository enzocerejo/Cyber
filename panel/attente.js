'use strict';
// Page d'attente de cyberbot.fr/panel/ :
// - vérifie que le tableau de bord (servi par le bot sur panel.cyberbot.fr) répond, puis y envoie le visiteur ;
// - si Cyber est hors ligne ou lent à répondre, propose un mini-jeu (le petit robot Cyber saute par-dessus les bugs)
//   et réessaie tout seul toutes les 15 secondes.
(function () {
  const PANEL = 'https://panel.cyberbot.fr/';
  const etat = document.getElementById('etat');
  const zoneJeu = document.getElementById('jeu');
  let enLigne = false;

  // ---------- Le panel répond-il ? ----------
  async function verifier() {
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), 5000);
    try {
      const r = await fetch(PANEL + 'en-ligne', { cache: 'no-store', credentials: 'omit', signal: ctrl.signal });
      return r.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(minuteur);
    }
  }

  function ouvrir() { location.replace(PANEL); }

  async function tentative() {
    if (await verifier()) {
      enLigne = true;
      // Pas de redirection en pleine partie : on prévient, le joueur choisit
      if (jeu.enCours()) etat.textContent = 'Cyber est de retour ! Termine ta partie ou clique sur « Ouvrir le tableau de bord ».';
      else ouvrir();
      return;
    }
    etat.textContent = 'Cyber est hors ligne pour le moment. Nouvel essai toutes les 15 secondes : tu seras redirigé dès son retour.';
    montrerJeu();
    setTimeout(tentative, 15000);
  }

  function montrerJeu() {
    if (!zoneJeu.hidden) return;
    zoneJeu.hidden = false;
    jeu.demarrer();
  }

  // ---------- Mini-jeu ----------
  const jeu = (function () {
    const canvas = document.getElementById('jeu-canvas');
    const ctx = canvas.getContext('2d');
    const L = 720, H = 200, SOL = 168;
    const C = { rouge: '#ff3d5a', rouge2: '#ff7a8c', texte: '#f1edf0', gris: '#a39ca8', ligne: '#ffffff22', bug: '#3ddc84', bug2: '#1f8f53', or: '#ffc457' };
    const GRAVITE = 2600, SAUT = -760;

    let robot, bugs, vitesse, score, meilleur, mode, temps, prochain, derniere, anim = 0;
    try { meilleur = Number(localStorage.getItem('cyber-jeu-record')) || 0; } catch { meilleur = 0; }

    function adapter() {
      const r = window.devicePixelRatio || 1;
      canvas.width = L * r; canvas.height = H * r;
      ctx.setTransform(r, 0, 0, r, 0, 0);
    }

    function reinitialiser() {
      robot = { x: 60, y: SOL - 34, l: 28, h: 34, vy: 0, auSol: true };
      bugs = []; vitesse = 330; score = 0; temps = 0; prochain = 0.9;
    }

    function sauter() {
      if (mode === 'pret' || mode === 'perdu') { reinitialiser(); mode = 'jeu'; return; }
      if (mode === 'jeu' && robot.auSol) { robot.vy = SAUT; robot.auSol = false; }
    }

    function ajouterBugs() {
      // 1 à 3 bugs collés ; plus le score monte, plus les groupes sont fréquents
      const n = Math.random() < Math.min(0.15 + score / 3000, 0.45) ? 2 + (Math.random() < 0.3 ? 1 : 0) : 1;
      let x = L + 10;
      for (let i = 0; i < n; i++) {
        const grand = Math.random() < 0.35;
        const l = grand ? 30 : 22, h = grand ? 26 : 18;
        bugs.push({ x, l, h, y: SOL - h, phase: Math.random() * 6 });
        x += l + 4;
      }
      const ecart = Math.max(0.55, 1.35 - vitesse / 900);
      prochain = ecart + Math.random() * 0.8;
    }

    function touche(a, b) {
      // Boîtes un peu réduites : on ne perd pas pour un pixel
      return a.x + 5 < b.x + b.l - 3 && a.x + a.l - 5 > b.x + 3 && a.y + 4 < b.y + b.h && a.y + a.h > b.y + 4;
    }

    function maj(dt) {
      temps += dt; anim += dt;
      if (mode !== 'jeu') return;
      vitesse = Math.min(330 + temps * 9, 820);
      score += dt * vitesse / 25;

      robot.vy += GRAVITE * dt;
      robot.y += robot.vy * dt;
      if (robot.y >= SOL - robot.h) { robot.y = SOL - robot.h; robot.vy = 0; robot.auSol = true; }

      prochain -= dt;
      if (prochain <= 0) ajouterBugs();
      for (const b of bugs) b.x -= vitesse * dt;
      bugs = bugs.filter((b) => b.x + b.l > -10);

      if (bugs.some((b) => touche(robot, b))) {
        mode = 'perdu';
        if (score > meilleur) {
          meilleur = Math.floor(score);
          try { localStorage.setItem('cyber-jeu-record', String(meilleur)); } catch { /* navigation privée */ }
        }
        if (enLigne) ouvrir();
      }
    }

    function arrondi(x, y, l, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + l, y, x + l, y + h, r); ctx.arcTo(x + l, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + l, y, r); ctx.closePath();
    }

    function dessinerRobot() {
      const { x, y, l, h } = robot;
      const pas = robot.auSol && mode === 'jeu' ? Math.floor(anim * 12) % 2 : 0;
      // Antenne
      ctx.strokeStyle = C.rouge2; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + l / 2, y); ctx.lineTo(x + l / 2, y - 7); ctx.stroke();
      ctx.fillStyle = C.or; ctx.beginPath(); ctx.arc(x + l / 2, y - 8, 2.5, 0, 7); ctx.fill();
      // Corps
      ctx.fillStyle = C.rouge; arrondi(x, y, l, h - 6, 7); ctx.fill();
      // Visière et yeux
      ctx.fillStyle = '#07080c'; arrondi(x + 4, y + 6, l - 8, 10, 4); ctx.fill();
      ctx.fillStyle = mode === 'perdu' ? C.gris : C.texte;
      if (mode === 'perdu') {
        ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
        ctx.fillText('x  x', x + l / 2, y + 14.5);
      } else {
        ctx.fillRect(x + 8, y + 9, 4, 4); ctx.fillRect(x + l - 12, y + 9, 4, 4);
      }
      // Jambes
      ctx.fillStyle = C.rouge2;
      ctx.fillRect(x + 6, y + h - 6, 5, pas ? 4 : 6);
      ctx.fillRect(x + l - 11, y + h - 6, 5, pas ? 6 : 4);
    }

    function dessinerBug(b) {
      const cx = b.x + b.l / 2, cy = b.y + b.h / 2 + 2;
      const remue = Math.sin(anim * 18 + b.phase) * 2;
      ctx.strokeStyle = C.bug2; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) { // 6 pattes
        ctx.beginPath(); ctx.moveTo(cx + i * b.l / 5, cy); ctx.lineTo(cx + i * b.l / 4 - 4, SOL + (i ? remue : -remue) * 0.3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + i * b.l / 5, cy); ctx.lineTo(cx + i * b.l / 4 + 4, SOL - (i ? remue : -remue) * 0.3); ctx.stroke();
      }
      ctx.fillStyle = C.bug;
      ctx.beginPath(); ctx.ellipse(cx, cy, b.l / 2, b.h / 2 - 2, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#07080c'; ctx.beginPath(); ctx.moveTo(cx, cy - b.h / 2 + 3); ctx.lineTo(cx, cy + b.h / 2 - 3); ctx.stroke();
      // Tête et antennes (tournée vers le robot)
      ctx.fillStyle = C.bug2; ctx.beginPath(); ctx.arc(b.x + 2, cy - 2, 5, 0, 7); ctx.fill();
      ctx.strokeStyle = C.bug; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(b.x, cy - 5); ctx.lineTo(b.x - 6, cy - 11 + remue); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b.x + 3, cy - 6); ctx.lineTo(b.x, cy - 13 - remue); ctx.stroke();
    }

    function dessiner() {
      ctx.clearRect(0, 0, L, H);
      // Sol en pointillés qui défilent (effet circuit)
      ctx.strokeStyle = C.ligne; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, SOL + 1); ctx.lineTo(L, SOL + 1); ctx.stroke();
      const decal = mode === 'jeu' ? (temps * vitesse) % 40 : 0;
      ctx.fillStyle = C.ligne;
      for (let x = -decal; x < L; x += 40) ctx.fillRect(x, SOL + 10, 14, 2);

      bugs.forEach(dessinerBug);
      dessinerRobot();

      ctx.textAlign = 'right'; ctx.fillStyle = C.gris; ctx.font = '600 14px Orbitron, monospace';
      ctx.fillText(`RECORD ${String(meilleur).padStart(5, '0')}   ${String(Math.floor(score)).padStart(5, '0')}`, L - 12, 26);

      ctx.textAlign = 'center';
      if (mode === 'pret') {
        ctx.fillStyle = C.texte; ctx.font = '600 16px Orbitron, monospace';
        ctx.fillText('ESPACE OU TOUCHE L’ÉCRAN POUR JOUER', L / 2, 90);
      } else if (mode === 'perdu') {
        ctx.fillStyle = C.rouge; ctx.font = '800 22px Orbitron, monospace';
        ctx.fillText('BUG DÉTECTÉ', L / 2, 80);
        ctx.fillStyle = C.texte; ctx.font = '600 13px Orbitron, monospace';
        ctx.fillText('ESPACE OU TOUCHE L’ÉCRAN POUR REJOUER', L / 2, 108);
      }
    }

    function boucle(t) {
      const dt = Math.min((t - (derniere ?? t)) / 1000, 0.05); // pas de saut géant après un changement d'onglet
      derniere = t;
      maj(dt);
      dessiner();
      requestAnimationFrame(boucle);
    }

    function demarrer() {
      adapter();
      reinitialiser();
      mode = 'pret';
      document.addEventListener('keydown', (e) => {
        if (zoneJeu.hidden || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.code === 'Space' || e.code === 'ArrowUp') {
          if (document.activeElement && /^(A|BUTTON|INPUT)$/.test(document.activeElement.tagName)) return;
          e.preventDefault();
          sauter();
        }
      });
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); sauter(); });
      window.addEventListener('resize', adapter);
      requestAnimationFrame(boucle);
    }

    return { demarrer, enCours: () => mode === 'jeu' };
  })();

  // Si le panel met plus d'une seconde à répondre, le jeu apparaît déjà
  const lent = setTimeout(() => { if (!enLigne) { etat.textContent = 'Connexion au tableau de bord… ça prend un peu de temps.'; montrerJeu(); } }, 1200);
  tentative().then(() => clearTimeout(lent));
})();
