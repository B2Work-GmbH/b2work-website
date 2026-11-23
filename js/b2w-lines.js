/* b2work – Startbild Variante «Linien»
   Feine Energielinien fliessen um einen schlichten Baukörper.
   Beim Scrollen: Bau öffnet sich in Geschosse, Linien leuchten in den Farben der Leistungen,
   am Schluss fliesst alles zu «b2work» zusammen.
   Eigenes Werk, Canvas 2D, ohne Bibliotheken und ohne Bilder. */
(function () {
  var hero = document.querySelector('.b2w-vhero');
  var cv = document.querySelector('.b2w-canvas');
  if (!hero || !cv) return;
  var ctx = cv.getContext('2d');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var pitch = document.querySelector('.b2w-vcontent');
  var claim = document.querySelector('.b2w-claim');
  var scrollHint = document.querySelector('.b2w-vscroll');
  var groups = [].slice.call(document.querySelectorAll('.b2w-grp'));
  var GC = groups.map(function (g) { return (g.style.getPropertyValue('--c') || '#4a6f8f').trim(); });
  var cw = 0, ch = 0, mobile = false, T = 0;
  var N = 34;                              // Anzahl Linien
  var INK = '60,67,74', KEY = '74,111,143';

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(a, b, p) { var t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function hexA(hex, a) {
    var h = hex.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // Kurztitel für schmale Bildschirme
  var SHORT = ['Beratung', 'Planung', 'Lichtplanung', 'Nachweise', 'Blitzschutz', 'Brandmelder', 'Bauleitung'];
  function titles() {
    groups.forEach(function (g, k) { var b = g.querySelector('b'); if (!b) return;
      if (!b.dataset.full) b.dataset.full = b.textContent;
      b.textContent = mobile ? (SHORT[k] || b.dataset.full) : b.dataset.full; });
  }
  function size() {
    var r = cv.getBoundingClientRect();
    cw = r.width; ch = r.height;
    cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    mobile = cw < 900;
    titles();
  }

  // Welche Linie trägt welche Leistung (Linien nahe am Baukörper)
  var LINE_OF = [];
  (function () { var mid = Math.floor(N / 2), order = [-3, 3, -2, 2, -4, 4, -1]; for (var k = 0; k < 7; k++) LINE_OF.push(mid + order[k]); })();

  function TH(k) { return 0.2 + k * 0.045; }   // ab wann Leistung k erscheint
  var LAB = [];                                   // Beschriftungs-Anker je Geschoss

  function frame(p) {
    ctx.clearRect(0, 0, cw, ch);
    var intro = ease(0.05, 0.2, p);
    var open = ease(0.12, 0.34, p) * (1 - ease(0.68, 0.78, p));   // öffnet sich in 7 Geschosse (je eine Leistung), schliesst sich vor dem Schluss
    var bolt = 0, pulse = 0;   // ohne Blitz (Wunsch 23.11.2026)
    var merge = ease(0.8, 0.94, p);
    var t = reduce ? 0 : T;

    // Baukörper: Lage und Grösse
    var bw = Math.min(cw * (mobile ? .19 : .13), ch * .2), bd = bw * .62;      // Breite, Tiefe (isometrisch)
    var floors = 7, fh = Math.min(ch * (mobile ? .036 : .05), bw * .34), gap = open * fh * (mobile ? .55 : .5);
    var bh = floors * fh + (floors - 1) * gap;
    var cx = mobile ? cw * .5 : mix(cw * .7, cw * .5, intro);
    var cy = mobile ? mix(ch * .72, ch * .5, intro) : ch * .52;
    var top = cy - bh / 2, bot = cy + bh / 2;
    var R = bw * .95 + bd * .4;               // Umflussradius
    var scale = 1 - merge;

    ctx.save();
    // ---- Feldlinien ----
    var mob = mobile ? mix(.15, 1, intro) : 1;   // Handy: hinter dem Text zurückhaltend
    ctx.globalAlpha = (1 - ease(0.84, 0.93, p)) * mob;   // Linien blenden vor dem Claim aus
    var x0 = -20, x1 = cw + 20, steps = mobile ? 60 : 110, span = ch * (mobile ? .9 : .82);
    for (var i = 0; i < N; i++) {
      var y0 = ch / 2 - span / 2 + span * (i + .5) / N, d = y0 - cy;
      var sgn = d === 0 ? (i % 2 ? 1 : -1) : (d > 0 ? 1 : -1);
      var k = LINE_OF.indexOf(i);
      var lit = k >= 0 ? ease(TH(k), TH(k) + .05, p) * (1 - ease(0.7, 0.8, p)) : 0;
      var amp = (mobile ? 6 : 10) * (1 + .4 * Math.sin(i * 1.7));
      ctx.beginPath();
      for (var j = 0; j <= steps; j++) {
        var x = mix(x0, x1, j / steps);
        var g = Math.exp(-Math.pow((x - cx) / (R * 1.7), 2));
        var y = cy + sgn * Math.sqrt(d * d + R * R * g * (1 + open * .25));
        y += amp * Math.sin(x * .006 + i * .55 + t * .6) * (1 - g * .8) + 3 * Math.sin(x * .017 - t * 1.1 + i) * (1 - g);
        y = mix(y, cy + (y - cy) * .04, merge);                    // alles fliesst zusammen
        x = mix(x, cw / 2 + (x - cw / 2) * (.25 + .75 * (1 - merge)), merge);
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      var base = .1 + .12 * Math.exp(-Math.pow(d / (span * .35), 2));
      if (lit > .01) {
        ctx.strokeStyle = hexA(GC[k], .18 * lit); ctx.lineWidth = 6; ctx.stroke();
        ctx.strokeStyle = hexA(GC[k], .35 + .6 * lit); ctx.lineWidth = 1.6; ctx.stroke();
        if (!reduce && lit >= 1) {
          ctx.save(); ctx.setLineDash([2, 26]); ctx.lineDashOffset = -t * 40 - i * 7; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
        }
      } else {
        ctx.strokeStyle = 'rgba(' + INK + ',' + (base * (1 - merge * .4)) + ')'; ctx.lineWidth = 1; ctx.stroke();
      }
      // Blitz-Puls läuft über alle Linien
      if (pulse > .01 && pulse < .999) {
        var px = mix(cx, i % 2 ? x1 : x0, pulse), pr = 60;
        ctx.save(); ctx.strokeStyle = 'rgba(201,164,98,' + (.75 * (1 - pulse)) + ')'; ctx.lineWidth = 2;
        var grd = ctx.createLinearGradient(px - pr, 0, px + pr, 0);
        grd.addColorStop(0, 'rgba(201,164,98,0)'); grd.addColorStop(.5, 'rgba(201,164,98,' + (.9 * (1 - pulse)) + ')'); grd.addColorStop(1, 'rgba(201,164,98,0)');
        ctx.strokeStyle = grd; ctx.stroke(); ctx.restore();
      }
    }

    ctx.globalAlpha = 1;
    // ---- Baukörper (schlichte Isometrie, nur Linien und zarte Flächen) ----
    var a = (1 - merge) * mob;
    if (a > .01) {
      ctx.globalAlpha = a;
      var hx = bw / 2, dx = bd * .87, dy = bd * .5;      // halbe Breite, Tiefenversatz
      // Bodenlinie / Schatten
      var sh = ctx.createRadialGradient(cx, bot + dy * .6, 4, cx, bot + dy * .6, bw * 1.4);
      sh.addColorStop(0, 'rgba(60,50,40,.14)'); sh.addColorStop(1, 'rgba(60,50,40,0)');
      ctx.fillStyle = sh; ctx.fillRect(cx - bw * 1.6, bot - bw, bw * 3.2, bw * 2);
      for (var f = 0; f < floors; f++) {
        var zt = top + f * (fh + gap), zb = zt + fh;
        LAB[f] = { lx: cx - hx - dx / 2, ly: zt + dy / 2 + fh / 2, rx: cx + hx + dx / 2, ry: zt + fh / 2 - dy / 4 };
        var L = cx - hx - dx / 2, Rr = cx + hx + dx / 2;
        // Front (links) und Seite (rechts) als zarte Flächen
        var front = [[cx - hx - dx / 2, zt + dy / 2], [cx + hx - dx / 2, zt + dy / 2], [cx + hx - dx / 2, zb + dy / 2], [cx - hx - dx / 2, zb + dy / 2]];
        var side = [[cx + hx - dx / 2, zt + dy / 2], [cx + hx + dx / 2, zt - dy / 2], [cx + hx + dx / 2, zb - dy / 2], [cx + hx - dx / 2, zb + dy / 2]];
        var topF = [[cx - hx - dx / 2, zt + dy / 2], [cx - hx + dx / 2, zt - dy / 2], [cx + hx + dx / 2, zt - dy / 2], [cx + hx - dx / 2, zt + dy / 2]];
        poly(front, 'rgba(253,252,249,.92)'); poly(side, 'rgba(236,231,222,.95)');
        if (f === 0 || open > .05) poly(topF, f === 0 ? 'rgba(244,240,233,.98)' : 'rgba(244,240,233,' + (.9 * open) + ')');
        // Fensterband: feine vertikale Teilung
        ctx.strokeStyle = 'rgba(' + INK + ',.16)'; ctx.lineWidth = .8;
        var bands = 8;
        for (var b = 1; b < bands; b++) { var u = b / bands; line2([mix(front[0][0], front[1][0], u), zt + dy / 2 + fh * .18], [mix(front[0][0], front[1][0], u), zb + dy / 2 - fh * .12]); }
        for (b = 1; b < 5; b++) { var v = b / 5; line2([mix(side[0][0], side[1][0], v), mix(side[0][1], side[1][1], v) + fh * .18], [mix(side[0][0], side[1][0], v), mix(side[3][1], side[2][1], v) - fh * .12]); }
        // Kanten
        ctx.strokeStyle = 'rgba(' + INK + ',.75)'; ctx.lineWidth = 1.1;
        outline(front); outline(side); if (f === 0 || open > .05) outline(topF);
        // Leuchtpunkte je Geschoss in Leistungsfarbe (sobald geöffnet)
        if (open > .3) {
          var kk = f % 7, la = ease(TH(kk), TH(kk) + .05, p) * open;
          if (la > .01) { var m = [mix(topF[0][0], topF[2][0], .5), mix(topF[0][1], topF[2][1], .5)];
            ctx.fillStyle = hexA(GC[kk], .25 * la); ctx.beginPath(); ctx.arc(m[0], m[1], 9, 0, 7); ctx.fill();
            ctx.fillStyle = hexA(GC[kk], .95 * la); ctx.beginPath(); ctx.arc(m[0], m[1], 3, 0, 7); ctx.fill(); }
        }
      }
      // (Fangstange entfernt, Wunsch 23.11.2026)
      var rx = cx + hx * .35, rt = top - dy * .1;
      // Ableitung entlang der Kante (leuchtet beim Puls)
      if (pulse > .01) {
        ctx.save(); ctx.strokeStyle = 'rgba(201,164,98,' + (.9 * (1 - pulse * .5)) + ')'; ctx.lineWidth = 2;
        line2([rx, rt - fh * .9], [rx, rt]); line2([cx + hx - dx / 2, top + dy / 2], [cx + hx - dx / 2, mix(top + dy / 2, bot + dy / 2, clamp(pulse * 2))]); ctx.restore();
      }
      // Blitz
      if (bolt > .01) {
        var tip = [rx, rt - fh * .9], pts = [[tip[0] - 40, 0]], n = 7;
        for (var q = 1; q < n; q++) { var fq = q / n; pts.push([tip[0] - 40 + 40 * fq + (q % 2 ? 16 : -12), tip[1] * fq]); }
        pts.push(tip);
        var fl = (reduce ? 1 : .8 + .2 * Math.sin(t * 36)) * (1 - pulse * .9);
        ctx.save(); ctx.lineJoin = 'miter';
        ctx.globalAlpha = a * .35 * fl * bolt; ctx.strokeStyle = '#d9b56a'; ctx.lineWidth = 9; pl(pts); ctx.stroke();
        ctx.globalAlpha = a * fl * bolt; ctx.strokeStyle = 'rgb(170,132,64)'; ctx.lineWidth = 2.4; pl(pts); ctx.stroke();
        ctx.restore();
        ctx.save(); ctx.globalAlpha = .1 * bolt * (1 - pulse); ctx.fillStyle = '#fffbe8'; ctx.fillRect(0, 0, cw, ch); ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    // Führungslinien vom Geschoss zur Beschriftung
    var GAPX = mobile ? 14 : 46;
    if (a > .01) for (var g2 = 0; g2 < 7 && g2 < LAB.length; g2++) {
      var A = LAB[g2], vis = ease(TH(g2), TH(g2) + .05, p) * ease(.25, .7, open), left = g2 % 2 === 0;
      if (vis < .01) continue;
      var ax = left ? A.lx : A.rx, ay = left ? A.ly : A.ry, ex2 = left ? ax - GAPX : ax + GAPX;
      ctx.save(); ctx.globalAlpha = vis * a;
      ctx.strokeStyle = hexA(GC[g2], .8); ctx.lineWidth = 1; line2([ax + (left ? -3 : 3), ay], [ex2, ay]);
      ctx.fillStyle = hexA(GC[g2], 1); ctx.beginPath(); ctx.arc(ax + (left ? -3 : 3), ay, 2.4, 0, 7); ctx.fill();
      ctx.restore();
    }
    // Verschmelzen: ruhiger Kern
    if (merge > .01 && merge < .999) {
      var gg = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, 40 + 160 * Math.sin(merge * Math.PI));
      gg.addColorStop(0, 'rgba(' + KEY + ',' + (.3 * Math.sin(merge * Math.PI)) + ')'); gg.addColorStop(1, 'rgba(' + KEY + ',0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, cw, ch);
    }
    ctx.restore();

    // ---- DOM: Pitch, Leistungsgruppen, Claim (wie Startbild 1) ----
    if (pitch) { pitch.style.opacity = 1 - intro; pitch.style.transform = 'translate3d(0,' + (-intro * 40) + 'px,0)'; pitch.style.visibility = intro > .99 ? 'hidden' : 'visible'; }
    // Leistungen als Beschriftung direkt an den Geschossen (keine Kartenfelder)
    var gr = groups.length && groups[0].parentNode.getBoundingClientRect(), cr0 = cv.getBoundingClientRect();
    var offX = gr ? cr0.left - gr.left : 0, offY = gr ? cr0.top - gr.top : 0;
    groups.forEach(function (gEl, k) {
      var A = LAB[k]; if (!A) return;
      var left = k % 2 === 0, vis = ease(TH(k), TH(k) + .05, p) * ease(.25, .7, open) * (1 - merge);
      gEl.classList.toggle('on', vis > .02);
      gEl.classList.toggle('b2w-side-l', left);
      gEl.style.opacity = vis;
      gEl.style.pointerEvents = vis > .5 ? 'auto' : 'none';
      var hgt = gEl.offsetHeight || 40, y = (left ? A.ly : A.ry) + offY - hgt / 2;
      gEl.style.top = y + 'px';
      if (left) { gEl.style.left = 'auto'; gEl.style.right = (cw - (A.lx - GAPX - 8) - offX) + 'px'; }
      else { gEl.style.right = 'auto'; gEl.style.left = (A.rx + GAPX + 8 + offX) + 'px'; }
      gEl.style.maxWidth = (mobile ? Math.max(96, (cw - bw) / 2 - GAPX - 30) : 260) + 'px';
    });
    if (claim) {
      var cm = ease(0.86, 0.97, p);
      claim.style.opacity = cm; claim.style.transform = 'translate(-50%,-50%) scale(' + (.6 + .4 * cm) + ')';
      claim.style.pointerEvents = cm > .6 ? 'auto' : 'none';
      claim.style.filter = 'blur(' + (8 * (1 - cm)) + 'px)';
    }
    if (scrollHint) scrollHint.style.opacity = p > .05 ? 0 : .7;
  }
  function pl(pts) { ctx.beginPath(); pts.forEach(function (q, i) { i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); }
  function poly(pts, fill) { pl(pts); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  function outline(pts) { pl(pts); ctx.closePath(); ctx.stroke(); }
  function line2(a, b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }

  function layoutGroups() {
    var Lg = groups.filter(function (g) { return g.classList.contains('b2w-grp-l'); });
    var Rg = groups.filter(function (g) { return g.classList.contains('b2w-grp-r'); });
    if (!mobile) {
      Lg.forEach(function (g, k) { g.style.top = (ch * (.2 + k * .17)) + 'px'; });
      Rg.forEach(function (g, k) { g.style.top = (ch * (.26 + k * .2)) + 'px'; });
    } else {
      Lg.forEach(function (g, k) { g.style.top = (ch * .6 + k * 56) + 'px'; });
      Rg.forEach(function (g, k) { g.style.top = (ch * .6 + k * 56) + 'px'; });
    }
  }


  // Stil: Leistungen als ruhige Beschriftung statt Karten
  (function () {
    var st = document.createElement('style');
    st.textContent = '.b2w-groups .b2w-grp{background:none!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;padding:0!important;width:auto!important;display:block!important;transform:none!important;transition:none!important;border-radius:0!important}'
      + '.b2w-groups .b2w-grp::after,.b2w-groups .b2w-gi,.b2w-groups .b2w-ga{display:none!important}'
      + '.b2w-groups .b2w-grp b{display:block;padding:0!important;font-size:18px!important;line-height:1.2;color:#3c434a;transition:color .25s}'
      + '.b2w-groups .b2w-grp span{display:block!important;padding:0!important;margin-top:3px;font-size:12.5px!important;opacity:.6}'
      + '.b2w-groups .b2w-grp b,.b2w-groups .b2w-grp span{text-shadow:0 0 4px #f3efe7,0 0 8px #f3efe7,0 0 14px #f3efe7,0 0 22px #f3efe7}'
      + '.b2w-groups .b2w-grp.b2w-side-l{text-align:right}'
      + '.b2w-groups .b2w-grp:hover b{color:var(--c)}.b2w-groups .b2w-grp:hover b::after{content:" →"}'
      + '@media (max-width:900px){.b2w-groups .b2w-grp b{font-size:12px!important;hyphens:manual!important;-webkit-hyphens:manual!important;overflow-wrap:normal!important}.b2w-groups .b2w-grp span{display:none!important}}';
    document.head.appendChild(st);
  })();

  var cur = 0, last = performance.now();
  function progress() { var r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight; return clamp(-r.top / Math.max(span, 1)); }
  function loop(now) {
    T += Math.min(.05, (now - last) / 1000); last = now;
    cur += (progress() - cur) * 0.08;
    frame(cur);
    requestAnimationFrame(loop);
  }
  size();
  addEventListener('resize', function () { size(); if (reduce) frame(.6); });
  if (reduce) frame(.6); else requestAnimationFrame(loop);
})();
