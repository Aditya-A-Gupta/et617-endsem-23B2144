// Pendulum Lab: Break the Rule · ET617 End-Sem · Roll no. 23B2144
// P5 Virtual lab · T1 Simple pendulum · L6 Olympiad learner · C4 10-minute sessions

const ROLL = "23B2144";
const SAVE_KEY = "pendulumLab_" + ROLL;
const TOTAL_MIN = 10;
const G = 9.8;
const STEPS = ["diagnostic", "mass", "length", "graph", "amplitude", "extension", "summary"];

// ---------- Physics ----------
// Exact period: T = T0 / AGM(1, cos(theta0/2)), T0 = 2*pi*sqrt(L/g)
function period(L, thDeg) {
  const T0 = 2 * Math.PI * Math.sqrt(L / G);
  const k = Math.sin((thDeg * Math.PI) / 360);
  let a = 1, b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 20; i++) { const an = (a + b) / 2; b = Math.sqrt(a * b); a = an; }
  return T0 / a;
}

// ---------- State ----------
const defaultState = () => ({
  screen: "welcome",
  startedAt: null,
  path: null,                  // "guided" | "challenge"
  misconceptions: [],          // "M1", "M2"
  diagnostic: { choice: null, correct: null },
  lab: { L: 1, m: 1, th: 20, trials: [], lock: null },
  mass: { hyp: null, revised: null, done: false },
  length: { pred: "", judged: null, ran: false, n: null },
  graph: { q1: null, q2: "", q2ok: null },
  amplitude: { text: "", result: null },
  extension: { choice: null, correct: null },
  hints: {},
  streak: 0,
  results: {},                 // outcomes: o1, o2, o3
  log: []
});

let state = defaultState();   // replaced by the merged saved state at the bottom of this file

// Merge a saved state onto the defaults so older/partial saves never crash the app
function mergeState(saved) {
  const d = defaultState();
  if (!saved || typeof saved !== "object") return d;
  for (const k of Object.keys(d)) {
    if (saved[k] === undefined) continue;
    const isObj = d[k] && typeof d[k] === "object" && !Array.isArray(d[k]);
    d[k] = isObj && saved[k] && typeof saved[k] === "object" ? { ...d[k], ...saved[k] } : saved[k];
  }
  if (saved.resumeTo) d.resumeTo = saved.resumeTo;
  if (!Array.isArray(d.lab.trials)) d.lab.trials = [];
  if (!screens[d.screen]) d.screen = "welcome";
  return d;
}
function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* storage unavailable: app still works, just can't resume */ } }
function log(ev, data) { state.log.push({ t: Date.now(), screen: state.screen, ev, data }); }
let showAbout = false;       // About is an overlay view, so it never overwrites the saved screen
function go(screen) { showAbout = false; state.screen = screen; state.lab.lock = null; state.lab.coach = null; log("go", screen); save(); render(); window.scrollTo(0, 0); }
function nextStep() { const i = STEPS.indexOf(state.screen); go(STEPS[i + 1]); }
function bump(ok) { state.streak = ok ? state.streak + 1 : 0; }
function addM(m) { if (!state.misconceptions.includes(m)) state.misconceptions.push(m); }

const $app = document.getElementById("app");
const $progressWrap = document.getElementById("progressWrap");
const $fill = document.getElementById("progressFill");
const $time = document.getElementById("timeLeft");
const $pause = document.getElementById("pauseBtn");
const $ = (id) => document.getElementById(id);
const on = (id, fn) => { const el = $(id); if (el) el.onclick = fn; };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function updateChrome() {
  const i = STEPS.indexOf(state.screen);
  const inFlow = i >= 0 && !showAbout;
  $progressWrap.hidden = !inFlow;
  $pause.hidden = !inFlow;
  if (inFlow) {
    $fill.style.width = (i / (STEPS.length - 1)) * 100 + "%";
    const left = Math.max(1, Math.round(TOTAL_MIN * (1 - i / STEPS.length)));
    $time.textContent = `Step ${i + 1} of ${STEPS.length} · about ${left} min left`;
  }
}

// ---------- Feedback engine (rule-based, runs fully in the browser: no API keys, no network) ----------
async function aiCall(kind, payload, rules) {
  return { ...rules(payload), source: "rules" };
}
const tag = () => `<span class="tag">Rule-based feedback</span>`;

// Rule-based feedback rules
function coachFallback(p) {
  const list = p.changed.length > 2 ? p.changed.slice(0, -1).join(", ") + " and " + p.changed.slice(-1) : p.changed.join(" and ");
  return { text: `You changed ${p.changed.length} things (${list}) between these two trials. Which one caused the new period? Try changing only one.` };
}
function explainFallback(p) {
  const t = p.text.toLowerCase();
  const hasApprox = /small[- ]?(angle|amplitude|θ|theta)/.test(t)
    || /sin\s*\(?\s*(θ|theta)/.test(t)
    || (/approximat/.test(t) && /(angle|θ|theta|sin|amplitude)/.test(t));
  const hasLarge = /(large|big|60|higher|bigger|wider|angle|amplitude|swing)/.test(t);
  if (hasApprox) return { label: "correct", feedback: "Exactly. The formula assumes sin θ ≈ θ, so it is safe only for small angles. At 60° the restoring force is weaker than that approximation, so the period is longer." };
  if (hasLarge) return { label: "partial", feedback: "You noticed the period changes with amplitude. What approximation did we use to get T = 2π√(L/g)? Compare sin θ with θ at 60°." };
  return { label: "other", feedback: "Look at your two trials again. Same length and mass, only the angle changed. What does that tell you about when the formula is valid?" };
}



// ---------- Hints (adaptive: 3 requests -> worked example) ----------
function hintBox(key, hints, worked) {
  const n = state.hints[key] || 0;
  const shown = hints.filter(Boolean).slice(0, n).map(h => `<div class="callout">💡 ${h}</div>`).join("");
  const wk = n >= 3 ? `<div class="feedback try"><strong>Worked example.</strong> ${worked}</div>` : "";
  return `<div class="hintbox">${shown}${wk}<button class="btn small secondary" data-hint="${key}">${n ? "Another hint" : "Hint"}</button></div>`;
}
function bindHints(key) {
  document.querySelectorAll("[data-hint]").forEach(b => {
    b.onclick = () => { const k = b.dataset.hint; state.hints[k] = (state.hints[k] || 0) + 1; log("hint", k); save(); render(); };
  });
}

// ---------- Lab component ----------
function labHTML(step) {
  const L = state.lab;
  const lock = L.lock;
  const dis = (name) => (lock && lock.free !== name ? "disabled" : "");
  return `
    <div class="card lab">
      <canvas id="pend" width="320" height="220" aria-label="Pendulum"></canvas>
      <div class="controls">
        <label>Length L: <strong id="vL">${L.L.toFixed(2)}</strong> m
          <input type="range" id="sL" min="0.25" max="4" step="0.25" value="${L.L}" ${dis("L")}></label>
        <label>Mass m: <strong id="vm">${L.m.toFixed(1)}</strong> kg
          <input type="range" id="sm" min="0.5" max="5" step="0.5" value="${L.m}" ${dis("m")}></label>
        <label>Amplitude θ: <strong id="vth">${L.th}</strong>°
          <input type="range" id="sth" min="5" max="80" step="5" value="${L.th}" ${dis("th")}></label>
      </div>
      <div class="row">
        <button class="btn" id="release">Release &amp; time 10 swings</button>
        ${lock ? `<button class="btn secondary" id="unlock">Unlock all</button>` : ""}
      </div>
      <div id="coach">${L.coach ? `<div class="feedback try"><strong>Not a fair test.</strong> ${esc(L.coach.text)} ${tag(L.coach.source)}
          <div class="row"><button class="btn small" id="lockBtn">Re-run, changing only one variable</button></div></div>` : ""}</div>
      <div id="tableWrap">${tableHTML(step)}</div>
    </div>`;
}

function stepTrials(step) { return state.lab.trials.filter(t => t.step === step); }

function tableHTML(step) {
  const rows = stepTrials(step);
  if (!rows.length) return `<p class="muted">No trials yet. Set the sliders and press Release.</p>`;
  let html = `<table class="data"><tr><th>#</th><th>L (m)</th><th>m (kg)</th><th>θ (°)</th><th>10 swings (s)</th><th>T (s)</th></tr>`;
  rows.forEach((r, i) => {
    const p = rows[i - 1];
    const c = (k) => (p && p[k] !== r[k] ? ' class="changed"' : "");
    html += `<tr><td>${i + 1}</td><td${c("L")}>${r.L}</td><td${c("m")}>${r.m}</td><td${c("th")}>${r.th}</td><td>${r.t10.toFixed(1)}</td><td><strong>${r.T.toFixed(2)}</strong></td></tr>`;
  });
  return html + `</table><p class="muted small">Orange cells changed since the previous trial.</p>`;
}

function drawPend(ang) {
  const cv = $("pend"); if (!cv) return;
  const ctx = cv.getContext("2d");
  const L = state.lab;
  const w = cv.width, h = cv.height;
  ctx.clearRect(0, 0, w, h);
  const px = 28 * L.L + 25;                  // string length in px (fits canvas at 4 m and 80°)
  const ox = w / 2, oy = 14;
  const bx = ox + px * Math.sin(ang), by = oy + px * Math.cos(ang);
  ctx.strokeStyle = "#bbb"; ctx.beginPath(); ctx.moveTo(ox - 40, oy); ctx.lineTo(ox + 40, oy); ctx.stroke();
  // amplitude arc
  ctx.setLineDash([4, 4]); ctx.strokeStyle = "#d9480f";
  ctx.beginPath(); ctx.arc(ox, oy, 40, Math.PI / 2 - (L.th * Math.PI) / 180, Math.PI / 2 + (L.th * Math.PI) / 180); ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = "#1d2330"; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();
  ctx.fillStyle = "#d9480f"; ctx.beginPath(); ctx.arc(bx, by, 6 + 3 * L.m, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = "#5b6372"; ctx.font = "12px sans-serif";
  ctx.fillText(`L = ${L.L.toFixed(2)} m`, 8, h - 8);
}

let anim = null;
let pendingAnim = null;     // keeps the swing animation alive across the re-render after a trial
function runAnim(Ttrue, t0) {
  const L = state.lab;
  cancelAnimationFrame(anim);
  const loop = (now) => {
    const t = (now - t0) / 1000;
    if (t >= 3 || !$("pend")) { pendingAnim = null; drawPend((L.th * Math.PI) / 180); return; }
    drawPend(((L.th * Math.PI) / 180) * Math.cos((2 * Math.PI * t) / Ttrue));
    anim = requestAnimationFrame(loop);
  };
  anim = requestAnimationFrame(loop);
}
function bindLab(step, onTrial) {
  if (!$("pend")) return;
  const L = state.lab;
  const refresh = () => { drawPend((L.th * Math.PI) / 180); };
  refresh();
  if (pendingAnim) runAnim(pendingAnim.Ttrue, pendingAnim.t0);
  on("lockBtn", () => {
    const c = L.coach; if (!c) return;
    L.L = c.prev.L; L.m = c.prev.m; L.th = c.prev.th;
    L.lock = { free: c.free }; L.coach = null; save(); render();
  });
  const bindSlider = (id, key, lbl, fmt) => {
    const s = $(id); if (!s) return;
    s.oninput = () => { L[key] = parseFloat(s.value); $(lbl).textContent = fmt(L[key]); save(); refresh(); };
  };
  bindSlider("sL", "L", "vL", v => v.toFixed(2));
  bindSlider("sm", "m", "vm", v => v.toFixed(1));
  bindSlider("sth", "th", "vth", v => v);
  on("unlock", () => { L.lock = null; save(); render(); });

  $("release").onclick = async () => {
    const Ttrue = period(L.L, L.th);
    const T = Ttrue * (1 + (Math.random() - 0.5) * 0.02);      // timing noise ±1%
    const trial = { step, L: L.L, m: L.m, th: L.th, T, t10: T * 10 };
    const prev = stepTrials(step).slice(-1)[0];
    L.trials.push(trial); log("trial", { L: L.L, m: L.m, th: L.th, T });
    save();
    const t0 = performance.now();
    pendingAnim = { Ttrue, t0 };
    runAnim(Ttrue, t0);
    $("tableWrap").innerHTML = tableHTML(step);
    // confound detection: 2+ variables changed vs previous trial
    L.coach = null;
    if (prev) {
      const changed = [];
      if (prev.L !== trial.L) changed.push("length");
      if (prev.m !== trial.m) changed.push("mass");
      if (prev.th !== trial.th) changed.push("amplitude");
      if (changed.length >= 2) {
        $("coach").innerHTML = `<div class="feedback try">Checking your trials…</div>`;
        const r = await aiCall("coach", { changed, prev, curr: trial }, coachFallback);
        // the variable this step is about stays free; the others are locked
        const free = step === "mass" ? "m" : step === "amplitude" ? "th" : step === "length" ? "L" : "m";
        L.coach = { text: r.text, source: r.source, prev: { L: prev.L, m: prev.m, th: prev.th }, free };
        log("confound", changed);
      }
    }
    save();
    if (onTrial) onTrial(trial);
  };
}

// ---------- Screens ----------
function pageHeading(t, sub) { return `<h2>${t}</h2>${sub ? `<p class="muted">${sub}</p>` : ""}`; }
function nextBtn(label, enabled, id = "nextBtn") { return `<div class="row"><button class="btn" id="${id}" ${enabled ? "" : "disabled"}>${label}</button></div>`; }

const screens = {
  welcome() {
    const resumable = !!state.resumeTo;
    return `
      <h1>Does the heavy one swing faster?</h1>
      <p>Let us find out what really decides a pendulum's swing time. You will predict, test, and revise your ideas in about <strong>10 minutes</strong>.</p>
      <div class="callout"><strong>The rule of the game:</strong> change only <em>one</em> thing at a time.</div>
      <div class="row">
        <button class="btn" id="startBtn">${resumable ? "Start over" : "Start"}</button>
        ${resumable ? `<button class="btn" id="resumeBtn">Resume where I left</button>` : ""}
      </div>`;
  },

  diagnostic() {
    const d = state.diagnostic;
    const opts = [["a", "The 1 kg bob"], ["b", "The 3 kg bob"], ["c", "Both have the same period"], ["d", "It depends on the amplitude only"]];
    let fb = "";
    if (d.correct === true) fb = `<div class="feedback ok"><strong>Right.</strong> Gravity pulls harder on the heavy bob, but it is also harder to accelerate, and the two cancel. You can skip the guided mass test and take the <strong>challenge path</strong>.</div>`;
    else if (d.correct === false && d.choice === "d") fb = `<div class="feedback try"><strong>Amplitude can matter a little, but both bobs start from the same angle here.</strong> So the only difference is the mass. Does it change the period? Let us test it in the lab.</div>`;
    else if (d.correct === false) fb = `<div class="feedback try"><strong>Many people expect that!</strong> Gravity pulls harder on the heavy bob, but it is also harder to accelerate. Do these cancel? Let us test it in the lab.</div>`;
    return `
      ${pageHeading("Step 1 · Predict first")}
      <div class="card">
        <p>A 1 kg bob and a 3 kg bob hang from identical 1 m strings and are released from the same angle. Which one has the <strong>shorter period</strong>?</p>
        <div class="options">${opts.map(([k, t]) => `<button class="option ${d.choice === k ? "selected" : ""}" data-k="${k}" ${d.correct !== null ? "disabled" : ""}>${t}</button>`).join("")}</div>
        ${fb}
      </div>
      <div class="row">
        ${d.correct === true ? `<button class="btn" id="toChallenge">Take the challenge path</button>` : ""}
        ${d.correct === false ? `<button class="btn" id="toMass">Test it in the lab</button>` : ""}
      </div>`;
  },

  mass() {
    const m = state.mass;
    const trials = stepTrials("mass");
    const groups = {};
    trials.forEach(t => { const k = t.L + "|" + t.th; (groups[k] = groups[k] || new Set()).add(t.m); });
    const controlled = Object.values(groups).some(s => s.size >= 3);
    const hypOpts = [["up", "Heavier bob → longer period"], ["down", "Heavier bob → shorter period"], ["none", "Mass makes no difference"]];
    const radios = (key, cur) => hypOpts.map(([k, t]) => `<button class="option ${cur === k ? "selected" : ""}" data-radio="${key}:${k}">${t}</button>`).join("");
    let result = "";
    if (controlled) {
      const g = Object.entries(groups).find(([, s]) => s.size >= 3)[0];
      const [gl, gth] = g.split("|");
      const ts = trials.filter(t => t.L == gl && t.th == gth).map(t => t.T);
      const spread = Math.max(...ts) - Math.min(...ts);
      result = `<div class="feedback ok"><strong>A fair test.</strong> With L = ${gl} m and θ = ${gth}° fixed, three masses gave periods within <strong>${spread.toFixed(2)} s</strong> of each other. That is about the size of your timing error.</div>
        <p><strong>Now update your hypothesis.</strong> What does your table say?</p>
        <div class="options">${radios("mass.revised", m.revised)}</div>`;
      if (m.revised === "none") result += `<div class="feedback ok">Yes. Mass cancels out. Hypothesis revised.</div>`;
      else if (m.revised) result += `<div class="feedback try">Look at the table again. By how much do the periods differ, compared with ~0.2 s of reaction-time error per 10 swings?</div>`;
    } else if (trials.length >= 3) {
      result = `<div class="feedback try"><strong>Not a fair test yet.</strong> To compare masses you need the same length and amplitude each time. Use the lock button, or keep L and θ fixed, and try at least 3 different masses.</div>`;
    }
    return `
      ${pageHeading("Step 2 · Does mass matter?", "Guided experiment for Task 2")}
      <div class="card">
        <p><strong>First, your hypothesis:</strong> what will happen to the period if you use a heavier bob?</p>
        <div class="options">${radios("mass.hyp", m.hyp)}</div>
        <p>Then <strong>change only the mass</strong>: try 3 different masses at the same L and θ.</p>
      </div>
      ${m.hyp ? labHTML("mass") : `<div class="placeholder">Choose a hypothesis to unlock the lab.</div>`}
      ${result}
      ${hintBox("mass", ["Keep length and amplitude the same each time.", "Compare the T column. Is the difference larger than timing error?", "Look at the three T values: they are almost equal."],
        "Set L = 1 m and θ = 20°. Run m = 0.5, 2 and 5 kg. All three periods are ≈ 2.0 s, so mass does not change the period.")}
      ${nextBtn("Continue to Step 3 · Length", m.revised === "none")}`;
  },

  length() {
    const l = state.length;
    // Adaptive: challenge path / streak >= 2 gets the "shorten to a quarter" prediction (needs sqrt reasoning in reverse)
    if (l.n === null) l.n = (state.path === "challenge" || state.streak >= 2) ? 0.25 : 4;
    const n = l.n, target = n;      // new length in metres, starting from 1 m
    const correct = 2.0 * Math.sqrt(n);
    const capped = n + " m";
    let fb = "";
    if (l.judged === "ok") fb = `<div class="feedback ok"><strong>Exactly.</strong> Length ×${n} gives period ×${Math.sqrt(n)} (T ∝ √L).</div>`;
    if (l.judged === "m2") fb = `<div class="feedback try"><strong>That is the "T ∝ L" idea:</strong> length ×${n} would give period ×${n}. Run the lab and compare with your prediction. Does the period really change by that factor? The next step plots T² against L.</div>`;
    if (l.judged === "other") fb = `<div class="feedback try">Not quite. Use the given T = 2.0 s at L = 1 m, and run the lab to see what really happens.</div>`;
    const ranTrial = stepTrials("length").find(t => Math.abs(t.L - target) < 0.01);
    return `
      ${pageHeading("Step 3 · Length", "Task 3: predict, then test")}
      <div class="card">
        <p>At <span class="mono">L = 1 m</span> the period is about <strong>2.0 s</strong>. What will the period be at <span class="mono">L = ${n} m</span> (same mass and amplitude)?</p>
        <label>Your prediction (s): <input type="number" step="0.1" id="pred" value="${esc(l.pred)}" ${l.judged ? "disabled" : ""}></label>
        <div class="row"><button class="btn" id="checkPred" ${l.judged ? "disabled" : ""}>Check my prediction</button></div>
        ${fb}
      </div>
      ${l.judged ? `<div class="card"><p><strong>Now test it:</strong> set L = ${capped} and release.</p></div>` : ""}
      ${l.judged ? labHTML("length") : ""}
      ${ranTrial ? `<div class="feedback ok">Lab result: T = <strong>${ranTrial.T.toFixed(2)} s</strong> at L = ${ranTrial.L} m. Your prediction was ${esc(l.pred)} s.</div>` : ""}
      ${hintBox("length", ["Try doubling the length: does the period double?", "Think of T = 2π√(L/g): what happens to T if L is multiplied by 4?", ""],
        `T ∝ √L. Length ×${n} makes the period ×√${n} = ×${Math.sqrt(n)}, so T ≈ ${correct.toFixed(1)} s.`)}
      ${!l.judged ? `<p class="muted small">To continue: enter a prediction and press "Check my prediction".</p>`
        : !ranTrial ? `<p class="muted small">To continue: set the length slider to exactly <strong>${capped}</strong> and press Release.</p>` : ""}
      ${nextBtn("Continue to the graph", l.judged && ranTrial)}`;
  },

  graph() {
    const g = state.graph;
    const slope = ((4 * Math.PI * Math.PI) / G).toFixed(2);
    let fb1 = "";
    if (g.q1 === "T2") fb1 = `<div class="feedback ok">Yes. T² vs L is a straight line through the origin, so <strong>T² ∝ L</strong>.</div>`;
    else if (g.q1) fb1 = `<div class="feedback try">Is that line straight? A straight line through the origin means proportional. Which axis pair gives that?</div>`;
    let fb2 = "";
    if (g.q2ok === true) fb2 = `<div class="feedback ok">g ≈ 9.8 m/s². You just measured gravity with a string.</div>`;
    else if (g.q2ok === false) fb2 = `<div class="feedback try">Slope = 4π²/g. Rearrange for g and try again.</div>`;
    return `
      ${pageHeading("Graph analysis", "Task 4: read the straight line")}
      <div class="card">
        <div class="graphs"><div><canvas id="g1" width="300" height="200"></canvas><p class="small center">T vs L</p></div>
        <div><canvas id="g2" width="300" height="200"></canvas><p class="small center">T² vs L</p></div></div>
        <p><strong>Which graph shows a direct proportion?</strong></p>
        <div class="options">
          <button class="option ${g.q1 === "T" ? "selected" : ""}" data-radio="graph.q1:T">T vs L</button>
          <button class="option ${g.q1 === "T2" ? "selected" : ""}" data-radio="graph.q1:T2">T² vs L</button>
        </div>
        ${fb1}
      </div>
      ${g.q1 === "T2" ? `
      <div class="card">
        <p>The slope of the straight line is <span class="mono">${slope} s²/m</span>. Since T² = (4π²/g)·L, what is <strong>g</strong>? (m/s²)</p>
        <label><input type="number" step="0.1" id="gin" value="${esc(g.q2)}"></label>
        <div class="row"><button class="btn" id="checkG">Check</button></div>
        ${fb2}
      </div>` : ""}
      ${hintBox("graph", ["Which graph is a straight line through the origin?", "T² = (4π²/g) L, so slope = 4π²/g.", "g = 4π² / slope."],
        `g = 4π² / ${slope} = 39.48 / ${slope} ≈ 9.8 m/s².`)}
      ${nextBtn("Continue to amplitude", g.q1 === "T2" && g.q2ok === true)}`;
  },

  amplitude() {
    const a = state.amplitude;
    const tr = stepTrials("amplitude");
    const small = tr.filter(t => t.th <= 10).slice(-1)[0];
    const large = tr.filter(t => t.th >= 45).slice(-1)[0];
    let cmp = "";
    if (small && large) {
      const pct = ((large.T / small.T - 1) * 100).toFixed(0);
      const fair = small.L === large.L && small.m === large.m;
      cmp = `<div class="callout">At θ = ${small.th}° → T = ${small.T.toFixed(2)} s. At θ = ${large.th}° → T = ${large.T.toFixed(2)} s (about <strong>${pct}% longer</strong>).${fair ? "" : " But L or m also changed between these trials, so redo it changing only θ."}</div>`;
    }
    let fb = "";
    if (a.result) fb = `<div class="feedback ${a.result.label === "correct" ? "ok" : "try"}">${esc(a.result.feedback)} ${tag(a.result.source)}</div>`;
    return `
      ${pageHeading("Step 4 · Amplitude challenge", "Task 5: when does the formula break?")}
      <div class="card">
        <p>Run one trial at a <strong>small angle (≤ 10°)</strong> and one at a <strong>large angle (≥ 45°)</strong>, changing only the amplitude.</p>
      </div>
      ${labHTML("amplitude")}
      ${cmp}
      <div class="card">
        <p><strong>Explain:</strong> why is the period different at large angles, and when is T = 2π√(L/g) safe to use?</p>
        <textarea id="expl" rows="4" placeholder="Write your explanation here…" ${small && large ? "" : "disabled"}>${esc(a.text)}</textarea>
        <div class="row"><button class="btn" id="checkExpl" ${small && large ? "" : "disabled"}>Get feedback</button></div>
        <div id="explFb">${fb}</div>
      </div>
      ${hintBox("amplitude", ["The derivation replaces sin θ with θ. When is that accurate?", "Compare sin(60°) = 0.87 with 60° = 1.05 rad.", ""],
        "The restoring force is mg·sin θ. For small θ, sin θ ≈ θ gives simple harmonic motion. At 60°, sin θ is smaller than θ, so the force is weaker and T is longer (~7%). The formula is safe up to roughly 15°.")}
      ${nextBtn("Continue to the Olympiad challenge", !!a.result)}`;
  },

  extension() {
    const e = state.extension;
    // Decide the variant once, so it cannot flip mid-question when the streak changes
    if (e.hard === undefined) e.hard = state.path === "challenge" || state.streak >= 2;
    const hard = e.hard;
    const q = hard
      ? { text: "A pendulum clock keeps correct time on Earth. It is taken to the Moon, where g is 1/6 as large. To keep the same period there, what must you do to the length?",
          opts: [["a", "Keep the same length"], ["b", "Multiply the length by 1/6"], ["c", "Multiply the length by 1/√6"], ["d", "Multiply the length by 6"]],
          ans: "b", wrongHint: {
            a: "g is smaller on the Moon, so with the same length the period would get longer. What must you do to L/g to keep T the same?",
            c: "T depends on √(L/g). To keep T the same you need L/g constant. g is divided by 6, so L must be divided by 6, not by √6.",
            d: "A longer string makes the period longer, and the Moon's weaker gravity already makes it longer. You need to move L the other way." },
          explain: "T = 2π√(L/g). For the same T, L/g must stay constant, so if g → g/6 then L → L/6." }
      : { text: "A pendulum clock runs 1% slow because its period is 1% too long. By about how much should you shorten the length?",
          opts: [["a", "1%"], ["b", "2%"], ["c", "4%"], ["d", "0.5%"]],
          ans: "b", wrongHint: { a: "That is the 'T ∝ L' idea again. Because T ∝ √L, the length must change twice as much as the period does.", c: "Check the sign and size: ΔL/L ≈ 2·ΔT/T.", d: "That would be too small a change. T ∝ √L means L changes twice as much as T." },
          explain: "T ∝ √L, so ΔT/T ≈ ½·ΔL/L. A 1% reduction in T needs about a 2% reduction in L." };
    let fb = "";
    if (e.correct === true) fb = `<div class="feedback ok"><strong>Correct.</strong> ${q.explain}</div>`;
    else if (e.correct === false) fb = `<div class="feedback try">${q.wrongHint[e.choice] || "Try using T ∝ √L."}</div>`;
    return `
      ${pageHeading("Step 5 · Olympiad challenge", hard ? "Harder variant: you earned it" : "Last task")}
      <div class="card">
        <p>${q.text}</p>
        <div class="options">${q.opts.map(([k, t]) => `<button class="option ${e.choice === k ? "selected" : ""}" data-ext="${k}:${q.ans}" ${e.correct === true ? "disabled" : ""}>${t}</button>`).join("")}</div>
        ${fb}
      </div>
      ${hintBox("extension", ["T ∝ √L (and T ∝ 1/√g).", "Small changes: ΔT/T ≈ ½ ΔL/L.", ""], q.explain)}
      ${nextBtn("See my summary", e.correct === true)}`;
  },

  summary() {
    const r = state.results;
    const m = state.misconceptions;
    const row = (ok, t) => `<li>${ok ? "✅" : "⬜"} ${t}</li>`;
    const mm = (id, txt) => `<li>${m.includes(id) ? "🔧 You met and tested: " : "—  Not triggered: "}${txt}</li>`;
    return `
      <h1>Session summary</h1>
      <div class="card">
        <p>Path: <strong>${state.path === "challenge" ? "Challenge" : "Guided"}</strong> · Trials run: <strong>${state.lab.trials.length}</strong> · Hints used: <strong>${Object.values(state.hints).reduce((a, b) => a + b, 0)}</strong></p>
        <h3>Outcomes</h3>
        <ul class="plain">
          ${row(r.o1, "Predict how the period changes with length (T ∝ √L)")}
          ${row(r.o2, "Explain why mass does not change the period, using your own trials")}
          ${row(r.o3, "Judge when T = 2π√(L/g) is valid (small angles)")}
        </ul>
        <h3>Misconceptions</h3>
        <ul class="plain">
          ${mm("M1", "“a heavier bob changes the period”")}
          ${mm("M2", "“period is proportional to length”")}
        </ul>
      </div>
      <div class="row"><button class="btn" id="restartBtn">Start again</button></div>`;
  },

  about() {
    return `
      <h1>About</h1>
      <div class="card">
        <p><strong>Identity:</strong> ${ROLL}</p>
        <p><strong>Card:</strong> P5 Inquiry-based virtual laboratory · T1 Simple pendulum: length, mass, amplitude vs period · L6 Olympiad learner · C4 10-minute sessions</p>
        <p><strong>Built with:</strong> plain HTML, CSS and JavaScript, hosted on Vercel. Feedback is generated by rules that run in your browser. No external services or API keys are used.</p>
        <p><strong>AI use:</strong> AI tools were used to help plan and write this app. The full log is in the report.</p>
      </div>
      <button class="btn secondary" id="backBtn">Back</button>`;
  }
};

// ---------- Render and events ----------
function render() {
  cancelAnimationFrame(anim);
  const backRow = !showAbout && STEPS.includes(state.screen)
    ? `<div class="backrow"><button class="btn small secondary" id="prevBtn">← Back</button></div>` : "";
  $app.innerHTML = backRow + (showAbout ? screens.about() : screens[state.screen]());
  updateChrome();
  bind();
}

function bind() {
  on("startBtn", () => { state = defaultState(); state.startedAt = Date.now(); go("diagnostic"); });
  on("resumeBtn", () => { const t = state.resumeTo; state.resumeTo = null; go(t); });
  on("restartBtn", () => { state = defaultState(); go("welcome"); });
  on("backBtn", () => { showAbout = false; render(); window.scrollTo(0, 0); });
  on("toChallenge", () => { state.path = "challenge"; state.results.o2 = true; go("length"); });
  on("toMass", () => { state.path = "guided"; go("mass"); });
  on("nextBtn", () => nextStep());
  on("prevBtn", () => {
    const i = STEPS.indexOf(state.screen);
    if (i <= 0) { state.resumeTo = state.screen; state.screen = "welcome"; state.lab.lock = null; state.lab.coach = null; save(); render(); return; }
    let target = STEPS[i - 1];
    if (target === "mass" && state.path === "challenge") target = "diagnostic";   // challenge path skips the mass step
    go(target);
  });

  // diagnostic options
  document.querySelectorAll(".option[data-k]").forEach(b => {
    b.onclick = () => {
      const k = b.dataset.k;
      state.diagnostic.choice = k;
      state.diagnostic.correct = k === "c";
      bump(k === "c");
      if (k === "a" || k === "b") addM("M1");
      log("diagnostic", k); save(); render();
    };
  });

  // generic radios (hypothesis etc.)
  document.querySelectorAll("[data-radio]").forEach(b => {
    b.onclick = () => {
      const [path, val] = b.dataset.radio.split(":");
      const [obj, key] = path.split(".");
      state[obj][key] = val;
      if (path === "mass.hyp" && val !== "none") addM("M1");
      if (path === "mass.revised" && val === "none") state.results.o2 = true;
      if (path === "graph.q1") bump(val === "T2");
      save(); render();
    };
  });

  const s = state.screen;
  if (["mass", "length", "amplitude"].includes(s) && state.screen) {
    const refresh = () => {};
    bindLab(s, () => {
      // Re-render only the parts that depend on trials (keeps slider state)
      if (s === "mass" || s === "length") { const y = window.scrollY; render(); window.scrollTo(0, y); }
      if (s === "amplitude") { const y = window.scrollY; render(); window.scrollTo(0, y); }
    });
  }
  bindHints();

  if (s === "length") {
    const pi = $("pred");
    if (pi) pi.oninput = () => { state.length.pred = pi.value; save(); };   // keep typed text if the page re-renders (e.g. Hint)
    on("checkPred", () => {
      const v = parseFloat($("pred").value);
      if (isNaN(v)) return;
      const l = state.length, n = l.n, correct = 2.0 * Math.sqrt(n), m2 = 2.0 * n;
      l.pred = String(v);
      if (Math.abs(v - correct) / correct <= 0.08) { l.judged = "ok"; state.results.o1 = true; bump(true); }
      else if (Math.abs(v - m2) / m2 <= 0.25) { l.judged = "m2"; addM("M2"); bump(false); }
      else { l.judged = "other"; bump(false); }
      log("predict", { v, n }); save(); render();
    });
  }

  if (s === "graph") {
    drawGraphs();
    const gi = $("gin");
    if (gi) gi.oninput = () => { state.graph.q2 = gi.value; save(); };
    on("checkG", () => {
      const v = parseFloat($("gin").value);
      if (isNaN(v)) return;
      state.graph.q2 = String(v);
      state.graph.q2ok = !isNaN(v) && v >= 9.4 && v <= 10.2;
      bump(state.graph.q2ok); save(); render();
    });
  }

  if (s === "amplitude") {
    const ta = $("expl");
    if (ta) ta.oninput = () => { state.amplitude.text = ta.value; save(); };
    on("checkExpl", async () => {
      const text = $("expl").value.trim();
      if (text.length < 5) { $("explFb").innerHTML = `<div class="feedback try">Write a sentence or two first, then press Get feedback.</div>`; return; }
      state.amplitude.text = text;
      $("explFb").innerHTML = `<div class="feedback try">Reading your explanation…</div>`;
      const r = await aiCall("explain", { text }, explainFallback);
      state.amplitude.result = r;
      if (r.label === "correct") { state.results.o3 = true; bump(true); } else bump(false);
      log("explain", r.label); save(); render();
    });
  }

  if (s === "extension") {
    document.querySelectorAll("[data-ext]").forEach(b => {
      b.onclick = () => {
        const [k, ans] = b.dataset.ext.split(":");
        state.extension.choice = k; state.extension.correct = k === ans;
        if (k === "a" && !state.extension.hard) addM("M2");   // "1% slow -> shorten by 1%" is the T ∝ L idea
        bump(k === ans); save(); render();
      };
    });
  }
}

function drawGraphs() {
  const Ls = [0.25, 0.5, 1, 2, 3, 4];
  const pts = Ls.map(l => [l, period(l, 10)]);
  const plot = (id, f, ymax, label) => {
    const cv = $(id); if (!cv) return;
    const c = cv.getContext("2d"), W = cv.width, H = cv.height, pad = 32;
    c.clearRect(0, 0, W, H);
    c.strokeStyle = "#999"; c.beginPath(); c.moveTo(pad, 10); c.lineTo(pad, H - pad); c.lineTo(W - 10, H - pad); c.stroke();
    c.fillStyle = "#5b6372"; c.font = "11px sans-serif";
    c.fillText("L (m)", W - 40, H - 8); c.fillText(label, 4, 12);
    const X = l => pad + (l / 4.2) * (W - pad - 14);
    const Y = v => H - pad - (v / ymax) * (H - pad - 16);
    c.strokeStyle = "#ddd"; c.beginPath(); pts.forEach(([l, T], i) => { const x = X(l), y = Y(f(T)); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    c.fillStyle = "#d9480f"; pts.forEach(([l, T]) => { c.beginPath(); c.arc(X(l), Y(f(T)), 4, 0, 6.3); c.fill(); });
  };
  plot("g1", T => T, 4.5, "T (s)");
  plot("g2", T => T * T, 17, "T² (s²)");
}

$("aboutLink").onclick = e => {
  e.preventDefault();
  showAbout = true; render(); window.scrollTo(0, 0);
};

$pause.onclick = () => {
  state.resumeTo = state.screen;
  state.screen = "welcome";
  state.lab.lock = null; state.lab.coach = null;
  save(); render();
};

state = mergeState(load());
if (state.startedAt && STEPS.includes(state.screen)) {
  state.resumeTo = state.screen;
  state.screen = "welcome";
  save();
}
render();
