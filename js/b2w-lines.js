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

  function size() {
    var r = cv.getBoundingClientRect();
    cw = r.width; ch = r.height;
    cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    mobile = cw < 900;
    layoutGroups();
  }

  // Welche Linie trägt welche Leistung (Linien nahe am Baukörper)
  var LINE_OF = [];
  (function () { var mid = Math.floor(N / 2), order = [-3, 3, -2, 2, -4, 4, -1]; for (var k = 0; k < 7; k++) LINE_OF.push(mid + order[k]); })();

  function frame(p) {
    ctx.clearRect(0, 0, cw, ch);
    var intro = ease(0.05, 0.2, p);
    var open = ease(0.14, 0.46, p) * (1 - ease(0.54, 0.63, p));   // öffnet sich in Geschosse, schliesst sich vor dem Blitz wieder
    var bolt = 0, pulse = 0;   // ohne Blitz (Wunsch 23.11.2026)
    var merge = ease(0.8, 0.94, p);
    var t = reduce ? 0 : T;

    // Baukörper: Lage und Grösse
    var bw = Math.min(cw * (mobile ? .26 : .13), ch * .2), bd = bw * .62;      // Breite, Tiefe (isometrisch)
    var floors = 6, fh = Math.min(ch * (mobile ? .04 : .056), bw * .36), gap = open * fh * .42;
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
      var k = LINE_OF.indexOf(i), on = k >= 0 && p > 0.24 + k * 0.05;
      var lit = k >= 0 ? ease(0.24 + k * 0.05, 0.3 + k * 0.05, p) : 0;
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
          var kk = f % 7, la = ease(0.24 + kk * 0.05, 0.3 + kk * 0.05, p) * open;
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
    // Verschmelzen: ruhiger Kern
    if (merge > .01 && merge < .999) {
      var gg = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, 40 + 160 * Math.sin(merge * Math.PI));
      gg.addColorStop(0, 'rgba(' + KEY + ',' + (.3 * Math.sin(merge * Math.PI)) + ')'); gg.addColorStop(1, 'rgba(' + KEY + ',0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, cw, ch);
    }
    ctx.restore();

    // ---- DOM: Pitch, Leistungsgruppen, Claim (wie Startbild 1) ----
    if (pitch) { pitch.style.opacity = 1 - intro; pitch.style.transform = 'translate3d(0,' + (-intro * 40) + 'px,0)'; pitch.style.visibility = intro > .99 ? 'hidden' : 'visible'; }
    groups.forEach(function (gEl, k) {
      var on = p > 0.24 + k * 0.05;
      gEl.classList.toggle('on', on);
      if (merge > 0.001) {
        var cr = cv.getBoundingClientRect(), r = gEl.getBoundingClientRect(), ddx = (cr.left + cw / 2) - (r.left + r.width / 2), ddy = (cr.top + ch / 2) - (r.top + r.height / 2);
        var m = ease(0, 1, merge * 1.15);
        gEl.style.transition = 'none';
        gEl.style.transform = 'translate(' + (ddx * m) + 'px,' + (ddy * m) + 'px) scale(' + (1 - .75 * m) + ')';
        gEl.style.opacity = on ? 1 - m : 0;
        gEl.style.pointerEvents = m > .15 ? 'none' : '';
      } else if (gEl.style.transform) {
        gEl.style.transition = ''; gEl.style.transform = ''; gEl.style.opacity = ''; gEl.style.pointerEvents = '';
      }
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
