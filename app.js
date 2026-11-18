// Pendulum Lab: Break the Rule · ET617 End-Sem · Roll no. 23B2144
// Initial deployment: screen routing, save/resume (C4), footer, About, diagnostic with M1 branch.

const ROLL = "23B2144";
const SAVE_KEY = "pendulumLab_" + ROLL;
const TOTAL_MIN = 10;

// Ordered steps used for the progress bar. Screens not in this list (welcome, about) show no bar.
const STEPS = ["diagnostic", "mass", "length", "graph", "amplitude", "extension", "summary"];

const defaultState = () => ({
  screen: "welcome",
  diagnostic: { choice: null, correct: null },
  misconceptions: [],   // e.g. ["M1"]
  path: null,           // "guided" or "challenge"
  startedAt: null
});

let state = load() || defaultState();

function load() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; }
}
function save() { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function go(screen) { state.screen = screen; save(); render(); window.scrollTo(0, 0); }

const $app = document.getElementById("app");
const $progressWrap = document.getElementById("progressWrap");
const $fill = document.getElementById("progressFill");
const $time = document.getElementById("timeLeft");
const $pause = document.getElementById("pauseBtn");

function updateChrome() {
  const i = STEPS.indexOf(state.screen);
  const inFlow = i >= 0;
  $progressWrap.hidden = !inFlow;
  $pause.hidden = !inFlow;
  if (inFlow) {
    const pct = (i / (STEPS.length - 1)) * 100;
    $fill.style.width = pct + "%";
    const left = Math.max(1, Math.round(TOTAL_MIN * (1 - i / STEPS.length)));
    $time.textContent = `Step ${i + 1} of ${STEPS.length} · about ${left} min left`;
  }
}

// ---------- Screens ----------
const screens = {
  welcome() {
    const resumable = !!state.resumeTo;
    return `
      <h1>Does the heavy one swing faster?</h1>
      <p>Let us find out what really decides a pendulum's swing time. You will predict, test, and revise your ideas in about <strong>10 minutes</strong>.</p>
      <div class="callout"><strong>The rule of the game:</strong> change only one thing at a time.</div>
      <div class="row">
        <button class="btn" id="startBtn">Start</button>
        ${resumable ? `<button class="btn secondary" id="resumeBtn">Resume where I left</button>` : ""}
      </div>`;
  },

  diagnostic() {
    const d = state.diagnostic;
    const opts = [
      ["a", "The 1 kg bob"],
      ["b", "The 3 kg bob"],
      ["c", "Both have the same period"],
      ["d", "It depends on the amplitude only"]
    ];
    let fb = "";
    if (d.correct === true) {
      fb = `<div class="feedback ok"><strong>Right.</strong> Gravity pulls harder on the heavy bob, but it is also harder to accelerate, and the two effects cancel. You can skip the guided mass test and take the challenge path.</div>`;
    } else if (d.correct === false) {
      fb = `<div class="feedback try"><strong>Many people expect that!</strong> Gravity pulls harder on the heavy bob, but it is also harder to accelerate. Do these cancel? Let us test it in the lab.</div>`;
    }
    return `
      <h2>Step 1 · Predict first</h2>
      <div class="card">
        <p>A 1 kg bob and a 3 kg bob hang from identical 1 m strings and are released from the same angle. Which one has the <strong>shorter period</strong>?</p>
        <div class="options">
          ${opts.map(([k, t]) => `<button class="option ${d.choice === k ? "selected" : ""}" data-k="${k}" ${d.correct !== null ? "disabled" : ""}>${t}</button>`).join("")}
        </div>
        ${fb}
      </div>
      <div class="row">
        ${d.correct === true ? `<button class="btn" id="toChallenge">Take the challenge path</button>` : ""}
        ${d.correct === false ? `<button class="btn" id="toMass">Test it in the lab</button>` : ""}
      </div>`;
  },

  mass() { return placeholder("Step 2 · Mass lab", "Pendulum simulation and mass experiment come in the next build.", "length"); },
  length() { return placeholder("Step 3 · Length lab", "Length experiment and the prediction task come in the next build.", "graph"); },
  graph() { return placeholder("Graph analysis", "T vs L and T² vs L graphs come in the next build.", "amplitude"); },
  amplitude() { return placeholder("Step 4 · Amplitude challenge", "Compare small and large angles in the next build.", "extension"); },
  extension() { return placeholder("Step 5 · Olympiad extension", "The slow-clock problem comes in the next build.", "summary"); },

  summary() {
    const m = state.misconceptions;
    return `
      <h1>Session summary</h1>
      <div class="card">
        <p>Path taken: <strong>${state.path === "challenge" ? "Challenge" : "Guided"}</strong></p>
        <p>Misconceptions met: <strong>${m.length ? m.join(", ") : "none"}</strong></p>
      </div>
      <div class="row">
        <button class="btn" id="restartBtn">Start again</button>
      </div>`;
  },

  about() {
    return `
      <h1>About</h1>
      <div class="card">
        <p><strong>Identity:</strong> ${ROLL}</p>
        <p><strong>Card:</strong> P5 Inquiry-based virtual laboratory · T1 Simple pendulum: length, mass, amplitude vs period · L6 Olympiad learner · C4 10-minute sessions</p>
        <p><strong>Built with:</strong> plain HTML, CSS and JavaScript, hosted on Vercel.</p>
        <p><strong>AI use:</strong> AI tools helped plan and write this app. Full log is in the report.</p>
      </div>
      <button class="btn secondary" id="backBtn">Back</button>`;
  }
};

function placeholder(title, text, next) {
  return `
    <h2>${title}</h2>
    <div class="placeholder">${text}</div>
    <div class="row"><button class="btn" data-next="${next}">Continue</button></div>`;
}

// ---------- Rendering and events ----------
let prevScreen = "welcome";

function render() {
  $app.innerHTML = screens[state.screen]();
  updateChrome();
  bind();
}

function bind() {
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };

  on("startBtn", () => { state = defaultState(); state.startedAt = Date.now(); go("diagnostic"); });
  on("resumeBtn", () => { const t = state.resumeTo; state.resumeTo = null; go(t); });
  on("restartBtn", () => { state = defaultState(); go("welcome"); });
  on("backBtn", () => go(prevScreen));
  on("toChallenge", () => { state.path = "challenge"; go("length"); });
  on("toMass", () => { state.path = "guided"; go("mass"); });

  document.querySelectorAll(".option").forEach(b => {
    b.onclick = () => {
      const k = b.dataset.k;
      state.diagnostic.choice = k;
      state.diagnostic.correct = (k === "c");
      if (k === "a" || k === "b") {
        if (!state.misconceptions.includes("M1")) state.misconceptions.push("M1");
      }
      save(); render();
    };
  });

  document.querySelectorAll("[data-next]").forEach(b => {
    b.onclick = () => go(b.dataset.next);
  });
}

document.getElementById("aboutLink").onclick = e => {
  e.preventDefault();
  if (state.screen !== "about") prevScreen = state.screen;
  go("about");
};

$pause.onclick = () => {
  state.resumeTo = state.screen;
  state.screen = "welcome";
  save(); render();
};

// On reload mid-session, land on the welcome screen with a Resume option.
if (state.startedAt && STEPS.includes(state.screen)) {
  state.resumeTo = state.screen;
  state.screen = "welcome";
  save();
}
render();
