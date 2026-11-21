/*
 * "In motion" — an animated transportation strip for sujaykolpuru.com.
 * One traveler rides a single route and changes mode at each station:
 * walk → skate → bike → bus → rail → fly.
 *
 * Self-contained: injects its own styles and markup. Follows the site's
 * design system (black ground, #F7FFF7 ink, #B3B3B3 secondary, Big Shoulders
 * display + JetBrains Mono). Mount it by adding <div id="in-motion"></div>
 * anywhere, or let it place itself above the footer on the Framer pages.
 */
(function () {
  "use strict";

  var INK = "#F7FFF7";
  var MUTE = "#B3B3B3";
  var DIM = "#3a3a3a";

  var MODES = [
    { key: "walk",  label: "WALK",  kmh: 5,   pace: 0.55, note: "where most ideas start" },
    { key: "skate", label: "SKATE", kmh: 14,  pace: 0.85, note: "the city as a playground" },
    { key: "bike",  label: "BIKE",  kmh: 20,  pace: 1.15, note: "the best way to learn a town" },
    { key: "bus",   label: "BUS",   kmh: 35,  pace: 1.45, note: "shared streets, shared time" },
    { key: "rail",  label: "RAIL",  kmh: 160, pace: 2.1,  note: "cities stitched together" },
    { key: "fly",   label: "FLY",   kmh: 820, pace: 2.6,  note: "and then, somewhere new" }
  ];

  var CSS = [
    "#in-motion{--im-ink:" + INK + ";--im-mute:" + MUTE + ";--im-dim:" + DIM + ";",
    "  width:100%;max-width:560px;margin:8px 0 0;color:var(--im-mute);",
    "  font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:2em;",
    "  box-sizing:border-box;position:relative;z-index:1}",
    "#in-motion *{box-sizing:border-box}",
    "#in-motion .im-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px}",
    "#in-motion .im-title{font-family:'Big Shoulders','Big Shoulders Display',Impact,sans-serif;",
    "  font-size:40px;line-height:1em;letter-spacing:-0.02em;color:var(--im-ink)!important;margin:0;font-weight:400;text-transform:uppercase}",
    "#in-motion .im-count{color:var(--im-mute);font-variant-numeric:tabular-nums;white-space:nowrap}",
    "#in-motion .im-count b{color:var(--im-ink);font-weight:400}",
    "#in-motion .im-stage{display:block;width:100%;height:auto;overflow:hidden;margin-top:8px}",
    "#in-motion .im-read{display:flex;justify-content:space-between;gap:16px;margin-top:4px;min-height:2em}",
    "#in-motion .im-mode{color:var(--im-ink);letter-spacing:0.08em}",
    "#in-motion .im-note{text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "#in-motion .im-speed{font-variant-numeric:tabular-nums}",
    "#in-motion .im-st text{font-family:inherit;font-size:10px;letter-spacing:0.08em;fill:var(--im-mute);transition:fill .3s}",
    "#in-motion .im-st.on text{fill:var(--im-ink)}",
    "@media (max-width:640px){#in-motion .im-title{font-size:32px}#in-motion .im-note{display:none}}"
  ].join("\n");

  // ---------- SVG helpers ----------
  var NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function stroke(extra) {
    var a = { fill: "none", stroke: INK, "stroke-width": 1.75, "stroke-linecap": "round", "stroke-linejoin": "round" };
    for (var k in extra) a[k] = extra[k];
    return a;
  }

  // Each vehicle is drawn in a local box whose ground line is y=0 and whose
  // horizontal centre is x=0. Returns { g, tick(t, speed) } for animation.
  function wheel(parent, cx, cy, r, spokes) {
    var g = el("g", { transform: "translate(" + cx + "," + cy + ")" }, parent);
    el("circle", stroke({ r: r }), g);
    var rot = el("g", {}, g);
    for (var i = 0; i < spokes; i++) {
      var a = (Math.PI * 2 * i) / spokes;
      el("line", stroke({ x1: 0, y1: 0, x2: (r - 1) * Math.cos(a), y2: (r - 1) * Math.sin(a), "stroke-width": 1, stroke: MUTE }), rot);
    }
    return { rot: rot, r: r };
  }
  function spin(w, dist) {
    w.rot.setAttribute("transform", "rotate(" + ((dist / w.r) * 180 / Math.PI) % 360 + ")");
  }

  var DRAW = {
    walk: function (g) {
      var body = el("g", {}, g);
      el("circle", stroke({ cx: 0, cy: -46, r: 5 }), body);
      el("line", stroke({ x1: 0, y1: -40, x2: 0, y2: -22 }), body);
      var armA = el("line", stroke({ x1: 0, y1: -37, x2: 0, y2: -26 }), body);
      var armB = el("line", stroke({ x1: 0, y1: -37, x2: 0, y2: -26, stroke: MUTE }), body);
      var legA = el("line", stroke({ x1: 0, y1: -22, x2: 0, y2: 0 }), body);
      var legB = el("line", stroke({ x1: 0, y1: -22, x2: 0, y2: 0, stroke: MUTE }), body);
      function limb(line, ox, oy, len, ang) {
        line.setAttribute("x2", ox + len * Math.sin(ang));
        line.setAttribute("y2", oy + len * Math.cos(ang));
      }
      return function (dist) {
        var s = Math.sin(dist / 7);
        limb(legA, 0, -22, 22, s * 0.5); limb(legB, 0, -22, 22, -s * 0.5);
        limb(armA, 0, -37, 13, -s * 0.45); limb(armB, 0, -37, 13, s * 0.45);
        body.setAttribute("transform", "translate(0," + (-Math.abs(Math.cos(dist / 7)) * 1.5).toFixed(2) + ")");
      };
    },
    skate: function (g) {
      var rider = el("g", {}, g);
      el("circle", stroke({ cx: 2, cy: -50, r: 5 }), rider);
      el("path", stroke({ d: "M2 -44 L0 -28 M0 -28 L-8 -9 M0 -28 L9 -9 M1 -40 L-12 -34 M1 -40 L14 -38" }), rider);
      el("path", stroke({ d: "M-20 -9 Q-22 -11 -23 -13 M-20 -9 L20 -9 Q22 -11 23 -13" }), g);
      var w1 = wheel(g, -13, -4, 3, 2), w2 = wheel(g, 13, -4, 3, 2);
      return function (dist) {
        spin(w1, dist); spin(w2, dist);
        rider.setAttribute("transform", "rotate(" + (Math.sin(dist / 30) * 3).toFixed(2) + " 0 -9)");
      };
    },
    bike: function (g) {
      var w1 = wheel(g, -17, -11, 11, 6), w2 = wheel(g, 17, -11, 11, 6);
      // frame: rear hub, bottom bracket, seat, head tube, front hub
      el("path", stroke({ d: "M-17 -11 L-2 -11 L-7 -28 Z M-2 -11 L12 -27 L-7 -28 M12 -27 L17 -11 M12 -27 L10 -33 L15 -33 M-10 -29 L-4 -29" }), g);
      var rider = el("g", {}, g);
      el("circle", stroke({ cx: 6, cy: -50, r: 5 }), rider);
      el("path", stroke({ d: "M3 -45 L-6 -31 M2 -42 L12 -33" }), rider);
      var leg = el("path", stroke({ d: "" }), g);
      return function (dist) {
        spin(w1, dist); spin(w2, dist);
        var a = dist / 11;
        var px = -2 + 5 * Math.cos(a), py = -11 + 5 * Math.sin(a);
        leg.setAttribute("d", "M-6 -31 L" + ((-6 + px) / 2 + 4).toFixed(1) + " " + ((-31 + py) / 2).toFixed(1) + " L" + px.toFixed(1) + " " + py.toFixed(1));
      };
    },
    bus: function (g) {
      el("path", stroke({ d: "M-34 -9 L-34 -40 Q-34 -44 -30 -44 L30 -44 Q34 -44 35 -38 L36 -9 Z" }), g);
      for (var i = 0; i < 5; i++) el("rect", stroke({ x: -29 + i * 11, y: -38, width: 8, height: 11, rx: 1.5, "stroke-width": 1.25, stroke: MUTE }), g);
      el("path", stroke({ d: "M27 -38 L33 -38 L34 -26 L27 -26 Z", "stroke-width": 1.25 }), g);
      el("line", stroke({ x1: -34, y1: -20, x2: 36, y2: -20, "stroke-width": 1, stroke: MUTE }), g);
      var w1 = wheel(g, -20, -6, 6, 4), w2 = wheel(g, 22, -6, 6, 4);
      return function (dist) {
        spin(w1, dist); spin(w2, dist);
      };
    },
    rail: function (g) {
      el("path", stroke({ d: "M-54 -8 L-54 -38 Q-54 -42 -50 -42 L36 -42 Q52 -40 58 -20 L60 -8 Z" }), g);
      for (var i = 0; i < 6; i++) el("rect", stroke({ x: -48 + i * 13, y: -36, width: 9, height: 10, rx: 1.5, "stroke-width": 1.25, stroke: MUTE }), g);
      el("path", stroke({ d: "M36 -36 Q46 -34 50 -24 L36 -24 Z", "stroke-width": 1.25 }), g);
      el("line", stroke({ x1: -54, y1: -18, x2: 59, y2: -18, "stroke-width": 1, stroke: MUTE }), g);
      el("path", stroke({ d: "M-20 -42 L-12 -52 L-4 -42 M-16 -52 L-8 -52", "stroke-width": 1.25 }), g);
      var ws = [-44, -34, 30, 40].map(function (x) { return wheel(g, x, -4, 4, 3); });
      return function (dist) { ws.forEach(function (w) { spin(w, dist); }); };
    },
    fly: function (g) {
      var plane = el("g", {}, g);
      el("path", stroke({ d: "M-38 -22 Q-36 -30 -28 -30 L26 -30 Q40 -30 44 -24 Q40 -18 26 -18 L-30 -18 Q-36 -18 -38 -22 Z" }), plane);
      el("path", stroke({ d: "M-28 -30 L-36 -46 L-30 -46 L-16 -30 M2 -22 L-10 -8 L-3 -8 L16 -22" }), plane);
      for (var i = 0; i < 6; i++) el("circle", { cx: -18 + i * 7, cy: -25, r: 1.1, fill: MUTE }, plane);
      var gear = el("path", stroke({ d: "M-14 -18 L-14 -12 M18 -18 L18 -12", "stroke-width": 1.25 }), plane);
      return { plane: plane, gear: gear };
    }
  };

  function build(root) {
    if (root.getAttribute("data-built")) return;
    root.setAttribute("data-built", "1");
    root.setAttribute("aria-label", "Animation: one traveler moving through walking, skating, biking, bus, rail and flight");
    root.innerHTML =
      '<div class="im-head"><h2 class="im-title">In motion</h2>' +
      '<span class="im-count"><b class="im-i">01</b> / 0' + MODES.length + "</span></div>";

    var W = 560, H = 150, GROUND = 104, PAD = 36;
    var svg = el("svg", { class: "im-stage", viewBox: "0 0 " + W + " " + H, role: "img", "aria-hidden": "true" }, root);

    var read = document.createElement("div");
    read.className = "im-read";
    read.innerHTML = '<span><span class="im-mode">WALK</span> · <span class="im-speed">5 km/h</span></span><span class="im-note"></span>';
    root.appendChild(read);
    var modeEl = read.querySelector(".im-mode"), speedEl = read.querySelector(".im-speed"),
        noteEl = read.querySelector(".im-note"), idxEl = root.querySelector(".im-i");

    // route
    var x0 = PAD, x1 = W - PAD, seg = (x1 - x0) / (MODES.length - 1);
    var stations = MODES.map(function (_, i) { return x0 + i * seg; });
    el("line", { x1: 0, y1: GROUND, x2: W, y2: GROUND, stroke: DIM, "stroke-width": 1, "stroke-dasharray": "2 5" }, svg);
    var done = el("line", { x1: 0, y1: GROUND, x2: 0, y2: GROUND, stroke: MUTE, "stroke-width": 1.25 }, svg);
    var stEls = MODES.map(function (m, i) {
      var g = el("g", { class: "im-st", transform: "translate(" + stations[i] + "," + GROUND + ")" }, svg);
      var dot = el("circle", { r: 3, fill: "#000", stroke: MUTE, "stroke-width": 1.25 }, g);
      var t = el("text", { y: 26, "text-anchor": "middle" }, g);
      t.textContent = m.label;
      return { g: g, dot: dot };
    });

    // speed lines + traveler
    var trails = el("g", {}, svg);
    var trailLines = [0, 1, 2].map(function (i) {
      return el("line", { y1: GROUND - 14 - i * 9, y2: GROUND - 14 - i * 9, stroke: MUTE, "stroke-width": 1, "stroke-linecap": "round" }, trails);
    });
    var traveler = el("g", {}, svg);
    var vehicles = MODES.map(function (m) {
      var g = el("g", { opacity: 0 }, traveler);
      var tick = DRAW[m.key](g);
      return { g: g, tick: tick };
    });

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // timeline: each segment i runs from station i to station i+1 at its mode's pace;
    // the last mode (fly) takes off from the final station and leaves the frame.
    var BASE = 60; // px per second at pace 1
    var legs = MODES.map(function (m, i) {
      var len = i < MODES.length - 1 ? seg : W - stations[i] + 80;
      return { from: stations[i], len: len, dur: len / (BASE * m.pace) };
    });
    var PAUSE = 0.55, FADE_IN = 0.8;
    var total = FADE_IN + legs.reduce(function (s, l) { return s + l.dur + PAUSE; }, 0);

    var lastIdx = -1;
    function setMode(i) {
      if (i === lastIdx) return;
      lastIdx = i;
      var m = MODES[i];
      modeEl.textContent = m.label;
      noteEl.textContent = m.note;
      idxEl.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
      stEls.forEach(function (s, j) {
        s.g.classList.toggle("on", j === i);
        s.dot.setAttribute("fill", j <= i ? INK : "#000");
        s.dot.setAttribute("stroke", j <= i ? INK : MUTE);
      });
    }

    function frame(t) {
      t = (t / 1000) % total;
      var opacityAll = 1, i = 0, x = stations[0], local = 0, moving = false, dist = 0;
      if (t < FADE_IN) {
        opacityAll = t / FADE_IN;
      } else {
        t -= FADE_IN;
        for (i = 0; i < legs.length; i++) {
          var L = legs[i];
          if (t < PAUSE) { x = L.from; local = 0; break; }
          t -= PAUSE;
          if (t < L.dur || i === legs.length - 1) {
            local = Math.min(1, t / L.dur);
            // ease in/out within each leg, except the take-off which accelerates
            var e = i === legs.length - 1 ? local * local : local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
            x = L.from + L.len * e;
            moving = true;
            break;
          }
          t -= L.dur;
        }
      }
      if (i >= MODES.length) i = MODES.length - 1;
      // cumulative distance drives wheels and legs
      dist = x * 1.0;

      // crossfade into the next vehicle as we approach a station
      var near = moving && i < MODES.length - 1 ? Math.max(0, (local - 0.86) / 0.14) : 0;
      vehicles.forEach(function (v, j) {
        var o = j === i ? 1 - near : j === i + 1 ? near : 0;
        v.g.setAttribute("opacity", (o * opacityAll).toFixed(3));
        if (o > 0 && typeof v.tick === "function") v.tick(dist, MODES[j].pace);
      });
      setMode(near > 0.5 ? i + 1 : i);

      var y = 0, tilt = 0;
      if (i === MODES.length - 1 && moving) {
        // take-off: roll, rotate, climb, fade
        var lift = Math.max(0, (local - 0.25) / 0.75);
        y = -Math.pow(lift, 1.6) * 80;
        tilt = -Math.min(14, lift * 40);
        vehicles[i].g.setAttribute("opacity", (1 - Math.max(0, (local - 0.75) / 0.25)).toFixed(3));
        vehicles[i].tick.gear.setAttribute("opacity", lift > 0.15 ? 0 : 1);
      }
      if (i === MODES.length - 1) vehicles[i].tick.plane.setAttribute("transform", "rotate(" + tilt.toFixed(2) + " 0 -18)");
      traveler.setAttribute("transform", "translate(" + x.toFixed(2) + "," + (GROUND + y).toFixed(2) + ")");
      done.setAttribute("x2", Math.min(x, x1).toFixed(2));

      // speed lines scale with the pace of the current mode
      var p = moving ? MODES[i].pace * Math.sin(Math.PI * Math.min(local, 0.98)) : 0;
      trailLines.forEach(function (ln, k) {
        var len = p * (10 + k * 6), gap = 30 + k * 4;
        ln.setAttribute("x1", (x - gap - len).toFixed(1));
        ln.setAttribute("x2", (x - gap).toFixed(1));
        ln.setAttribute("y1", (GROUND + y - 14 - k * 9).toFixed(1));
        ln.setAttribute("y2", (GROUND + y - 14 - k * 9).toFixed(1));
        ln.setAttribute("opacity", Math.min(0.8, p * 0.4).toFixed(2));
      });

      // live speed readout eases up to the mode's typical speed
      var shown = near > 0.5 ? i + 1 : i;
      speedEl.textContent = "~" + MODES[shown].kmh + " km/h";
    }

    if (reduce) {
      // no travel: rest at each station in turn
      var k = 0;
      var show = function () {
        traveler.setAttribute("transform", "translate(" + stations[k] + "," + GROUND + ")");
        vehicles.forEach(function (v, j) { v.g.setAttribute("opacity", j === k ? 1 : 0); });
        setMode(k);
        speedEl.textContent = MODES[k].kmh + " km/h";
        done.setAttribute("x2", stations[k]);
        k = (k + 1) % MODES.length;
      };
      show();
      setInterval(show, 2600);
      return;
    }

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(root);
    }
    var start = null, paused = 0, lastNow = null;
    function loop(now) {
      if (start === null) start = now;
      if (!visible && lastNow !== null) paused += now - lastNow;
      lastNow = now;
      if (visible) frame(now - start - paused);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function injectStyles() {
    if (document.getElementById("in-motion-css")) return;
    var s = document.createElement("style");
    s.id = "in-motion-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // On the Framer export, React hydrates #main after load and may drop
  // foreign nodes, so place the strip after hydration and keep it placed.
  function placeOnFramerPage() {
    var mount = document.getElementById("in-motion");
    if (mount && document.body.contains(mount)) return mount;
    // sit directly under the photo in whichever layout variant is showing
    var visible = function (n) { return n.offsetParent !== null; };
    var photo = Array.prototype.filter.call(document.querySelectorAll("#main .framer-1ve7fpa"), visible)[0];
    var anchor = photo ? (photo.closest(".ssr-variant") || photo) : null;
    if (!anchor) {
      var f = Array.prototype.filter.call(document.querySelectorAll("#main footer"), visible)[0];
      if (!f) return null;
      anchor = f.closest("[class*='-container']") || f;
      mount = document.createElement("section");
      mount.id = "in-motion";
      anchor.parentNode.insertBefore(mount, anchor);
      return mount;
    }
    mount = document.createElement("section");
    mount.id = "in-motion";
    anchor.parentNode.insertBefore(mount, anchor.nextSibling);
    return mount;
  }

  function init() {
    injectStyles();
    var existing = document.getElementById("in-motion");
    if (existing && !document.getElementById("main")) { build(existing); return; }
    var tries = 0;
    (function attempt() {
      var m = placeOnFramerPage();
      if (m) build(m);
      else if (tries++ < 40) return setTimeout(attempt, 150);
      var main = document.getElementById("main");
      if (main && "MutationObserver" in window) {
        new MutationObserver(function () {
          if (!document.getElementById("in-motion")) { var n = placeOnFramerPage(); if (n) build(n); }
        }).observe(main, { childList: true, subtree: true });
      }
    })();
  }

  if (document.readyState === "complete") setTimeout(init, 300);
  else window.addEventListener("load", function () { setTimeout(init, 300); });
})();
