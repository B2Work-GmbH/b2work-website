/* b2work – Startbild «Explosionsansicht» (moderner Bürobau)
   Ablauf beim Scrollen:
   1) Pitch-Text links, Bau rechts  2) Bau wandert in die Mitte, dreht sich, fährt in Ebenen auseinander
   3) Installationen zeichnen sich ein, Leistungsgruppen erscheinen
   4) Blitz in die Fangstange, Ableitung in die Erde  5) alles verschmilzt zu «b2work»
   Eigenes Werk, Canvas 2D, ohne Bibliotheken. */
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
  var cw = 0, ch = 0, s = 30, s0 = 30, ox = 0, oy = 0, mobile = false, T = 0, RC = 1, RS = 0;

  var C = {
    slabTop: '240,236,229', slabL: '214,208,198', slabR: '199,192,181',
    core: '205,198,186', edge: 'rgba(60,67,74,.14)', frame: '58,65,72',
    power: '#1f6fd1', data: '#0f9d8a', light: '#d99a00', lps: '#e4572e', hvac: '138,107,209', heat: '#d64b6a', fire: '#c62828'
  };
  var W = 9, D = 7, COS = Math.cos(Math.PI / 6), SIN = Math.sin(Math.PI / 6);
  var LEVELS = [
    { key: 'ug', h: 1.1 }, { key: 'eg', h: 1.15 }, { key: 'og1', h: .95 }, { key: 'og2', h: .95 },
    { key: 'og3', h: .95 }, { key: 'og4', h: .95 }, { key: 'dach', h: .3 }
  ];
  var NL = LEVELS.length;
  var RODS = [[.4, .4], [W - .4, .4], [W - .4, D - .4], [.4, D - .4], [W * .72, D * .3]];
  var COLS = [[1.5, 1.5], [4.5, 1.5], [7.5, 1.5], [1.5, 5.5], [4.5, 5.5], [7.5, 5.5]];

  // Kies-Textur
  var gravel = document.createElement('canvas'); gravel.width = gravel.height = 96;
  (function () {
    var g = gravel.getContext('2d'); g.fillStyle = '#d9d4ca'; g.fillRect(0, 0, 96, 96);
    for (var i = 0; i < 900; i++) {
      var v = 170 + Math.random() * 60 | 0; g.fillStyle = 'rgba(' + v + ',' + (v - 6) + ',' + (v - 14) + ',.9)';
      g.beginPath(); g.arc(Math.random() * 96, Math.random() * 96, Math.random() * 1.4 + .3, 0, 7); g.fill();
    }
  })();
  var gravelPat = ctx.createPattern(gravel, 'repeat');

  function size() {
    var r = cv.getBoundingClientRect();
    cw = r.width; ch = r.height;
    cv.width = Math.round(cw * DPR); cv.height = Math.round(ch * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    mobile = cw < 900;
    s0 = Math.min((mobile ? 0.6 : 0.34) * cw / ((W + D) * COS), ch / (mobile ? 22 : 15.5));
    layoutGroups();
  }
  function P(x, y, z) {
    var dx = x - W / 2, dy = y - D / 2, rx = dx * RC - dy * RS + W / 2, ry = dx * RS + dy * RC + D / 2;
    return [ox + (rx - ry) * COS * s, oy + (rx + ry) * SIN * s - z * s];
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(a, b, p) { var t = clamp((p - a) / (b - a)); return t * t * (3 - 2 * t); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function path(pts) { ctx.beginPath(); pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); }
  function poly(pts, fill, stroke, lw) { path(pts); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); } }
  function rgba(c, a) { return 'rgba(' + c + ',' + a + ')'; }
  function grad(p1, p2, c1, c2) { var g = ctx.createLinearGradient(p1[0], p1[1], p2[0], p2[1]); g.addColorStop(0, c1); g.addColorStop(1, c2); return g; }
  function box(x, y, z, w, d, h, top, left, right, stroke) {
    poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], left, stroke);
    poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], right, stroke);
    poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top, stroke);
  }
  function line(pts3, color, t, lw, opts) {
    if (t <= 0.005) return;
    opts = opts || {};
    var pts = pts3.map(function (q) { return P(q[0], q[1], q[2]); });
    var L = 0, seg = [];
    for (var i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    var cut = L * clamp(t), out = [pts[0]], acc = 0;
    for (i = 1; i < pts.length; i++) {
      if (acc + seg[i - 1] >= cut) { var f = (cut - acc) / (seg[i - 1] || 1); out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]); break; }
      out.push(pts[i]); acc += seg[i - 1];
    }
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (opts.dash) ctx.setLineDash(opts.dash);
    ctx.strokeStyle = color; ctx.globalAlpha *= .16; ctx.lineWidth = (lw || 1.5) * 3; path(out); ctx.stroke();
    ctx.globalAlpha /= .16; ctx.lineWidth = lw || 1.5; path(out); ctx.stroke();
    if (opts.flow && t >= 1 && !reduce) {
      ctx.setLineDash([1.5, 22]); ctx.lineDashOffset = -T * 22; ctx.strokeStyle = '#fff'; ctx.globalAlpha *= .7; ctx.lineWidth = (lw || 1.5) * .9; path(out); ctx.stroke();
    }
    ctx.restore();
  }
  function dot(q, r, color, a) {
    if (a <= .01) return;
    var p = P(q[0], q[1], q[2]);
    ctx.save(); ctx.globalAlpha *= a * .22; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p[0], p[1], r * 2.4, 0, 7); ctx.fill();
    ctx.globalAlpha *= 1 / .22; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); ctx.restore();
  }
  function tree(x, y, z, r, a) {
    if (a <= .01) return;
    var b = P(x, y, z), t = P(x, y, z + r * 2.2);
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(60,50,40,.10)'; ctx.beginPath(); ctx.ellipse(b[0] + r * s * .5, b[1], r * s * 1.1, r * s * .45, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(110,95,80,.8)'; ctx.lineWidth = 2; path([b, t]); ctx.stroke();
    var g = ctx.createRadialGradient(t[0] - r * s * .35, t[1] - r * s * .5, 2, t[0], t[1], r * s);
    g.addColorStop(0, 'rgba(176,198,150,.95)'); g.addColorStop(1, 'rgba(118,146,108,.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(t[0], t[1] - r * s * .2, r * s, 0, 7); ctx.fill();
    ctx.restore();
  }
  // Glasfassade mit dunklen Profilen (eine Seite)
  function facade(side, fb, ft, a, ug) {
    var n = side === 'L' ? 8 : 6, len = side === 'L' ? W : D;
    var F = function (u, z) { return side === 'L' ? P(u, D, z) : P(W, D - u, z); };
    var g1 = ug ? ft - .32 : fb + .06, g2 = ft - .1;
    // Brüstung/Deckenstirn
    poly([F(0, fb), F(len, fb), F(len, ft), F(0, ft)], grad(F(0, ft), F(0, fb), side === 'L' ? 'rgba(232,227,218,1)' : 'rgba(214,207,195,1)', side === 'L' ? 'rgba(220,213,201,1)' : 'rgba(198,190,177,1)'), C.edge);
    // Glas
    poly([F(.15, g1), F(len - .15, g1), F(len - .15, g2), F(.15, g2)],
      grad(F(.15, g2), F(len - .15, g1), side === 'L' ? 'rgba(186,208,226,.96)' : 'rgba(160,186,206,.96)', side === 'L' ? 'rgba(96,126,152,.96)' : 'rgba(80,108,134,.96)'));
    // Spiegelung (diagonaler Lichtstreifen)
    ctx.save(); ctx.globalAlpha *= .22;
    poly([F(len * .18, g2), F(len * .3, g2), F(len * .22, g1), F(len * .1, g1)], '#fff');
    poly([F(len * .62, g2), F(len * .67, g2), F(len * .59, g1), F(len * .54, g1)], '#fff');
    ctx.restore();
    // Profile
    ctx.save(); ctx.strokeStyle = rgba(C.frame, .85); ctx.lineWidth = 1.1;
    for (var k = 0; k <= n; k++) { var u = .15 + k * (len - .3) / n; path([F(u, g1), F(u, g2)]); ctx.stroke(); }
    path([F(.15, g2), F(len - .15, g2)]); ctx.stroke(); path([F(.15, g1), F(len - .15, g1)]); ctx.stroke();
    ctx.restore();
  }

  function frame(p) {
    ctx.clearRect(0, 0, cw, ch);
    var intro = ease(0.05, 0.2, p);
    var ex = ease(0.12, 0.46, p);
    var draw = ease(0.2, 0.6, p);
    var bolt = ease(0.66, 0.71, p), pulse = ease(0.71, 0.8, p);
    var merge = ease(0.8, 0.94, p);          // alles verschmilzt zu b2work
    var wallA = 1 - ease(0.12, 0.38, p) * 0.92, terrA = 1 - ease(0.1, 0.28, p);
    var gap = ex * 1.05;

    var rot = (-12 + 22 * ease(0.05, .8, p)) * Math.PI / 180; RC = Math.cos(rot); RS = Math.sin(rot);
    s = s0 * (1 - 0.18 * ex) * (1 - .92 * merge);
    ox = mobile ? cw * .5 : mix(cw * .68, cw * .5, intro);
    var total = 0; LEVELS.forEach(function (L) { total += L.h; }); total += gap * (NL - 1) + 1.6;
    oy = mix((mobile ? mix(ch * .66, ch * .36, intro) : ch * .53) + (total * s - (W + D) * SIN * s) / 2, ch * .5, merge);

    var base = [], z = 0;
    LEVELS.forEach(function (L, i) { base.push(z + gap * i); z += L.h; });
    var roofZ = base[NL - 1] + .18;
    var sub = function (i, k) { return clamp(draw * 1.5 - i * .08 - (k || 0)); };

    ctx.save(); ctx.globalAlpha = (1 - merge) * (mobile ? mix(.18, 1, intro) : 1);

    var c0 = P(W / 2, D / 2, 0), g0 = ctx.createRadialGradient(c0[0], c0[1] + 10, 10, c0[0], c0[1], s * 9);
    g0.addColorStop(0, 'rgba(70,58,44,.2)'); g0.addColorStop(1, 'rgba(70,58,44,0)');
    ctx.fillStyle = g0; ctx.fillRect(0, 0, cw, ch);

    if (terrA > .01) {
      var tz = base[1];
      ctx.save(); ctx.globalAlpha *= terrA;
      poly([P(-3, -2.5, tz), P(W + 3.5, -2.5, tz), P(W + 3.5, D + 3.5, tz), P(-3, D + 3.5, tz)], grad(P(-3, -2.5, tz), P(W + 3.5, D + 3.5, tz), 'rgba(230,224,211,.95)', 'rgba(214,206,190,.95)'));
      poly([P(W, D * .42, tz + .01), P(W + 3.5, D * .42, tz + .01), P(W + 3.5, D * .58, tz + .01), P(W, D * .58, tz + .01)], 'rgba(200,192,178,.95)');
      ctx.restore();
      tree(-1.6, 1.3, tz, .55, terrA); tree(-1.8, 5, tz, .7, terrA); tree(W + 2.3, D + 1.8, tz, .65, terrA); tree(3, D + 2.2, tz, .5, terrA);
    }

    LEVELS.forEach(function (L, i) {
      var b = base[i], h = L.h, t = .16, zz = b + t + .01, top = i === NL - 1;
      if (i > 0 && ex > .05) {
        var sp = [P(.3, .3, base[i - 1] + .2), P(W + .6, .3, base[i - 1] + .2), P(W + .6, D + .6, base[i - 1] + .2), P(.3, D + .6, base[i - 1] + .2)];
        ctx.save(); ctx.globalAlpha *= .1 * ex; ctx.filter = 'blur(8px)'; poly(sp, '#3c434a'); ctx.restore();
      }
      box(0, 0, b, W, D, t, top ? '#ddd' : rgba(C.slabTop, .96 - ex * .32), rgba(C.slabL, .96), rgba(C.slabR, .96), C.edge);
      if (top) {
        poly([P(0, 0, b + t), P(W, 0, b + t), P(W, D, b + t), P(0, D, b + t)], gravelPat);
        // Attika
        box(0, 0, b + t, W, .12, .22, 'rgba(226,221,212,1)', 'rgba(210,203,192,1)', 'rgba(196,189,177,1)');
        box(0, D - .12, b + t, W, .12, .22, 'rgba(226,221,212,1)', 'rgba(210,203,192,1)', 'rgba(196,189,177,1)');
        box(W - .12, 0, b + t, .12, D, .22, 'rgba(226,221,212,1)', 'rgba(210,203,192,1)', 'rgba(196,189,177,1)');
      }
      if (h >= .9) {
        ctx.save(); ctx.globalAlpha *= .5 + .5 * ex;
        COLS.forEach(function (q) { box(q[0] - .09, q[1] - .09, zz, .18, .18, h - t - .02, rgba(C.core, .9), rgba('226,220,210', .9), rgba('210,203,191', .9)); });
        box(3.6, 2.7, zz, 1.8, 1.6, h - t - .02, rgba(C.core, .5), rgba(C.core, .65), rgba('210,203,191', .65), C.edge);
        ctx.restore();
      }

      if (L.key === 'ug') {
        line([[-.4, -.4, b], [W + .4, -.4, b], [W + .4, D + .4, b], [-.4, D + .4, b], [-.4, -.4, b]], C.lps, sub(0), 1.5, { dash: [7, 6] });
        [[.8, .6], [2.5, .6], [5.6, .6], [7.3, .6]].forEach(function (q) { box(q[0], q[1], zz, 1.1, 1.9, .42, 'rgba(132,146,160,.9)', 'rgba(104,118,132,.9)', 'rgba(88,102,116,.9)'); });
        box(.4, 5.8, zz, 1.4, .5, .75, 'rgba(78,116,170,.95)', 'rgba(58,96,150,.95)', 'rgba(46,82,132,.95)');
        line([[1.8, 6.05, zz + .5], [W - .4, 6.05, zz + .5], [W - .4, .25, zz + .5], [1.2, .25, zz + .5]], C.power, sub(0, .05), 1.5, { flow: true });
        [[1.3, .15], [3, .15], [6.1, .15], [7.8, .15]].forEach(function (q) { box(q[0], q[1], zz, .28, .13, .5, 'rgba(244,247,250,.95)', 'rgba(218,224,232,.95)', 'rgba(196,204,216,.95)'); });
      }
      if (L.key === 'eg') {
        [[2, 2], [7, 2], [2, 5.2], [7, 5.2]].forEach(function (q) { dot([q[0], q[1], zz + .9], 2.1, C.light, sub(1)); });
        [[3, 3.5], [6.5, 4.5]].forEach(function (q) { dot([q[0], q[1], zz + .95], 1.8, C.fire, sub(1, .1)); });
      }
      if (L.key === 'og1') {
        line([[.5, 4.6, zz + .7], [W - .5, 4.6, zz + .7]], C.power, sub(2), 1.6, { flow: true });
        [1.5, 7.5].forEach(function (x) { line([[x, 4.6, zz + .7], [x, 1, zz + .3]], C.power, sub(2, .1), 1); });
      }
      if (L.key === 'og2') {
        line([[5.4, 3.3, zz + .7], [W - .6, 3.3, zz + .7], [W - .6, 1, zz + .7]], C.data, sub(3), 1.4, { flow: true });
        poly([P(.5, 4.9, zz + .78), P(W - .5, 4.9, zz + .78), P(W - .5, 5.35, zz + .78), P(.5, 5.35, zz + .78)], rgba(C.hvac, .18 * sub(3)), rgba(C.hvac, .7 * sub(3)), 1);
      }
      if (L.key === 'og3') {
        line([[.35, .35, zz + .12], [W - .35, .35, zz + .12], [W - .35, D - .35, zz + .12]], C.heat, sub(4), 1.3, { flow: true });
        [[2, 2], [7, 2], [2, 5.2], [7, 5.2]].forEach(function (q) { dot([q[0], q[1], zz + .75], 2.1, C.light, sub(4, .05)); });
      }
      if (L.key === 'og4') {
        [[2, 2], [4.5, 1.6], [7, 2], [2, 5.2], [7, 5.2]].forEach(function (q) { dot([q[0], q[1], zz + .75], 2.1, C.light, sub(5)); });
      }
      if (top) {
        for (var px = .6; px < W - 1.6; px += 2.2) for (var py = .6; py < D - 1; py += 1.6) {
          if (px > 3 && px < 5.6 && py > 2.2 && py < 4.6) continue;
          var a1 = P(px, py, zz), a2 = P(px + 1.85, py, zz + .1), a3 = P(px + 1.85, py + 1.15, zz + .1), a4 = P(px, py + 1.15, zz);
          poly([a1, a2, a3, a4], grad(a1, a3, 'rgba(58,84,120,.95)', 'rgba(28,44,70,.95)'), 'rgba(190,210,232,.65)', 1);
          ctx.save(); ctx.globalAlpha *= .18; path([a1, a2]); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        }
        box(3.7, 2.8, zz, 1.6, 1.4, .65, 'rgba(232,234,238,.97)', 'rgba(206,210,217,.97)', 'rgba(186,191,200,.97)', C.edge);
        line([[0, 0, zz + .2], [W, 0, zz + .2], [W, D, zz + .2], [0, D, zz + .2], [0, 0, zz + .2]], C.lps, sub(6), 1.5);
        line([[W / 2, 0, zz + .2], [W / 2, D, zz + .2]], C.lps, sub(6, .05), 1);
        RODS.forEach(function (q) { line([[q[0], q[1], zz], [q[0], q[1], zz + 1.3]], C.lps, Math.max(sub(6, .1), .4), 1.5); dot([q[0], q[1], zz + 1.3], 2.1, C.lps, Math.max(sub(6, .1), .45)); });
      }

      if (h >= .9 && wallA > .02) {
        ctx.save(); ctx.globalAlpha *= wallA;
        facade('L', b + t, b + h, wallA, i === 0);
        facade('R', b + t, b + h, wallA, i === 0);
        ctx.restore();
      }
    });

    [[0, D], [W, D], [W, 0]].forEach(function (q) { line([[q[0], q[1], roofZ + .2], [q[0], q[1], base[0]]], C.lps, sub(6, .15), 1.2); });
    line([[5.25, 2.95, base[0] + .85], [5.25, 2.95, base[NL - 2] + .7]], C.data, sub(2, .1), 1.6, { flow: true });

    var rod = RODS[4], rodTop = [rod[0], rod[1], roofZ + 1.3];
    if (bolt > .01) {
      var tip = P(rodTop[0], rodTop[1], rodTop[2]);
      var fl = (reduce ? 1 : .8 + .2 * Math.sin(T * 36)) * (1 - pulse * .9);
      var pts = [[tip[0] - 50, 0]], n = 7;
      for (var j = 1; j < n; j++) { var f = j / n; pts.push([tip[0] - 50 + 50 * f + (j % 2 ? 18 : -14), tip[1] * f]); }
      pts.push(tip);
      ctx.save(); ctx.lineJoin = 'miter';
      ctx.globalAlpha *= .22 * fl * bolt; ctx.strokeStyle = '#f5b800'; ctx.lineWidth = 8; path(pts); ctx.stroke();
      ctx.globalAlpha /= .22; ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 2.4; path(pts); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalAlpha = .12 * bolt * (1 - pulse); ctx.fillStyle = '#fffbe8'; ctx.fillRect(0, 0, cw, ch); ctx.restore();
    }
    if (pulse > .01) {
      var bz = roofZ + .2;
      [[[rod[0], rod[1], bz], [W, rod[1], bz], [W, 0, bz], [W, 0, base[0]]],
       [[rod[0], rod[1], bz], [W, rod[1], bz], [W, D, bz], [W, D, base[0]]],
       [[rod[0], rod[1], bz], [rod[0], D, bz], [0, D, bz], [0, D, base[0]]]].forEach(function (r) { line(r, '#f2b705', pulse, 2.2); });
      if (pulse > .9) line([[-.4, -.4, base[0]], [W + .4, -.4, base[0]], [W + .4, D + .4, base[0]], [-.4, D + .4, base[0]], [-.4, -.4, base[0]]], '#f2b705', 1, 2, { dash: [7, 6] });
    }
    ctx.restore();

    // Verschmelzen: leuchtender Kern in der Mitte
    if (merge > .01 && merge < .999) {
      var gx = cw / 2, gy = ch / 2, rr = 40 + 160 * Math.sin(merge * Math.PI);
      var gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, rr);
      gg.addColorStop(0, 'rgba(74,111,143,' + (.35 * Math.sin(merge * Math.PI)) + ')'); gg.addColorStop(1, 'rgba(74,111,143,0)');
      ctx.fillStyle = gg; ctx.fillRect(0, 0, cw, ch);
    }

    // DOM
    if (pitch) { pitch.style.opacity = 1 - intro; pitch.style.transform = 'translate3d(0,' + (-intro * 40) + 'px,0)'; pitch.style.visibility = intro > .99 ? 'hidden' : 'visible'; }
    var cr = cv.getBoundingClientRect();
    groups.forEach(function (gEl, k) {
      var on = p > 0.24 + k * 0.05;
      gEl.classList.toggle('on', on);
      if (merge > 0.001) {            // Karten fliegen in die Mitte und verschmelzen
        var r = gEl.getBoundingClientRect(), dx = (cr.left + cw / 2) - (r.left + r.width / 2), dy = (cr.top + ch / 2) - (r.top + r.height / 2);
        var m = ease(0, 1, merge * 1.15);
        gEl.style.transition = 'none';
        gEl.style.transform = 'translate(' + (dx * m) + 'px,' + (dy * m) + 'px) scale(' + (1 - .75 * m) + ')';
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
