/* =========================================================================
   LingoWave — frontend logic
   State + routing + 7 mini-games + Web Audio + Canvas + Chart.js radar
   ========================================================================= */

const App = {
  state: null,          // server state (xp, streak, scores, unlocked, ...)
  meta: null,           // game registry + competencies
  route: { name: "placement", game: null },
  cache: {},            // cached question sets per game
  roundIdx: {},         // local round pointer per game
  chart: null,          // Chart.js radar instance
  media: { stream: null, audioCtx: null, raf: null }, // vocal-mirror live media
};

/* ------------------------------ API layer ------------------------------ */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}
const apiGet = (p) => api(p);
const apiPost = (p, body) => api(p, { method: "POST", body: JSON.stringify(body || {}) });

/* ------------------------------ Web Audio ------------------------------ */
function audioCtx() {
  if (!App._ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    App._ac = new AC();
  }
  if (App._ac.state === "suspended") App._ac.resume();
  return App._ac;
}

// A single tone via OscillatorNode with a soft attack/decay envelope.
function playTone(freq, start, dur, { type = "sine", gain = 0.25 } = {}) {
  const ac = audioCtx();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Play a stress pattern [0/1,...]: strong beats louder + higher pitched.
function playRhythm(pattern, base = 330, beat = 0.32) {
  pattern.forEach((b, i) => {
    playTone(b ? base * 1.5 : base, i * beat, beat * 0.8, {
      type: b ? "triangle" : "sine",
      gain: b ? 0.32 : 0.16,
    });
  });
}

const sfxCorrect = () => { playTone(660, 0, 0.12, { type: "triangle", gain: .25 }); playTone(990, 0.1, 0.16, { type: "triangle", gain: .25 }); };
const sfxWrong = () => { playTone(200, 0, 0.22, { type: "sawtooth", gain: .18 }); };
const sfxClick = () => playTone(520, 0, 0.05, { type: "square", gain: .08 });

/* ------------------------------ Helpers ------------------------------ */
const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};

function toast(msg, kind = "info") {
  const box = $("#toast"), body = $("#toast-body");
  const styles = {
    good: "bg-emerald-500 text-white",
    bad: "bg-rose-500 text-white",
    info: "bg-blue-500 text-white",
  };
  body.className = "px-5 py-3 rounded-2xl font-extrabold shadow-2xl pop " + (styles[kind] || styles.info);
  body.textContent = msg;
  box.classList.remove("hidden");
  clearTimeout(App._toastT);
  App._toastT = setTimeout(() => box.classList.add("hidden"), 2200);
}

function gameByKey(key) { return App.meta.games.find((g) => g.key === key); }
function isUnlocked(key) { return App.state.unlocked.includes(key); }

/* ------------------------------ HUD ------------------------------ */
function renderHUD() {
  const s = App.state;
  $("#hud-streak").textContent = s.streak;
  $("#hud-xp").textContent = s.xp;
  $("#hud-level").textContent = s.fluency.code;
  $("#hud-unlocked").textContent = `${s.unlocked.length}/${App.meta.games.length}`;
  $("#hud-progress").style.width = `${Math.min(100, s.fluency.avg)}%`;
}

/* ------------------------------ Router ------------------------------ */
function go(name, game = null) {
  stopMedia();
  App.route = { name, game };
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  renderHUD();
  const root = $("#app");
  root.innerHTML = "";
  const { name, game } = App.route;
  if (name === "placement") renderPlacement(root);
  else if (name === "hub") renderHub(root);
  else if (name === "mastery") renderMastery(root);
  else if (name === "game") renderGame(root, game);
  else renderHub(root);
}

function hero(root, emoji, title, subtitle) {
  const h = el("div", "hero p-6 sm:p-8 mb-5 animate-pop");
  h.innerHTML = `
    <div class="text-4xl mb-1">${emoji}</div>
    <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-white">${title}</h1>
    <p class="text-blue-50 font-bold mt-1">${subtitle}</p>`;
  root.appendChild(h);
}

function backBar(root) {
  const bar = el("div", "flex gap-2 mb-4");
  const b1 = el("button", "opt !w-auto px-4 py-2", "🗺️ Game Hub");
  b1.onclick = () => go("hub");
  const b2 = el("button", "opt !w-auto px-4 py-2", "🕸️ Mastery Web");
  b2.onclick = () => go("mastery");
  bar.append(b1, b2);
  root.appendChild(bar);
}

/* =====================================================================
   PLACEMENT TEST
   ===================================================================== */
async function renderPlacement(root) {
  hero(root, "🎓", "Placement Test", "Three quick questions to find your starting level.");
  const questions = await apiGet("/api/placement");
  const answers = {};

  const wrap = el("div", "space-y-5");
  questions.forEach((q, qi) => {
    const card = el("div", "card p-5");
    card.appendChild(el("div", "text-lg font-black mb-3", `Q${qi + 1}. ${q.prompt}`));
    if (q.syllables) {
      const sylRow = el("div", "mb-3");
      q.syllables.forEach((s) => sylRow.appendChild(el("span", "syl", s)));
      card.appendChild(sylRow);
    }
    const opts = el("div", "space-y-2");
    q.options.forEach((o, oi) => {
      const b = el("button", "opt", o);
      b.onclick = () => {
        answers[q.id] = oi;
        [...opts.children].forEach((c) => c.classList.remove("selected"));
        b.classList.add("selected");
        sfxClick();
      };
      opts.appendChild(b);
    });
    card.appendChild(opts);
    wrap.appendChild(card);
  });
  root.appendChild(wrap);

  const submit = el("button", "btn-gradient w-full mt-6 py-4 rounded-2xl text-lg font-black",
    "🚀 Submit & Unlock My Track");
  submit.onclick = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast("Answer all three questions first!", "bad");
      return;
    }
    const res = await apiPost("/api/placement", { answers });
    App.state = res.state;
    sfxCorrect();
    toast(`🎉 ${res.score}/${res.total} → ${res.level}! Unlocked ${res.state.unlocked.length} games.`, "good");
    go("hub");
  };
  root.appendChild(submit);
}

/* =====================================================================
   GAME HUB
   ===================================================================== */
function renderHub(root) {
  hero(root, "🗺️", "Game Hub", "Your journey through the seven layers of English prosody.");

  if (!App.state.placed && App.state.unlocked.length === 0) {
    const note = el("div", "tip mb-4",
      "👋 Take the <b>Placement Test</b> first, or hit <b>⚡ Skip to Demo Mode</b> in the navbar.");
    root.appendChild(note);
    const b = el("button", "btn-gradient px-4 py-2 rounded-xl font-bold mb-4", "🎓 Take Placement Test");
    b.onclick = () => go("placement");
    root.appendChild(b);
  }

  const grid = el("div", "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4");
  App.meta.games.forEach((g) => {
    const locked = !isUnlocked(g.key);
    const score = App.state.scores[g.competency] || 0;
    const rounds = App.state.rounds[g.key] || 0;
    const card = el("div", `card p-5 flex flex-col ${locked ? "locked" : ""}`);

    let badge;
    if (locked) badge = `<span class="badge badge-locked">🔒 Locked</span>`;
    else if (score >= 80) badge = `<span class="badge badge-mastered">🏅 Mastered</span>`;
    else badge = `<span class="badge badge-unlocked">Unlocked</span>`;
    const diffCls = { Easy: "badge-easy", Medium: "badge-medium", Hard: "badge-hard" }[g.difficulty];

    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="text-3xl">${g.emoji}</div>
        <div class="flex gap-1">${badge}<span class="badge ${diffCls}">${g.difficulty}</span></div>
      </div>
      <h3 class="text-xl font-black mt-2">${g.title}</h3>
      <div class="text-slate-400 text-sm font-bold">${g.subtitle}</div>
      <div class="text-[11px] text-slate-500 mt-1">${g.competency} · +${g.xp} XP · ${rounds} rounds</div>
      <div class="bar mt-3"><div style="width:${score}%"></div></div>
    `;
    const btn = el("button",
      `mt-4 py-2.5 rounded-xl font-extrabold ${locked ? "bg-white/5 border border-white/10 text-slate-400" : "btn-gradient"}`,
      locked ? "🔒 Locked" : `▶️ Play ${g.title}`);
    btn.disabled = locked;
    if (!locked) btn.onclick = () => go("game", g.key);
    card.appendChild(btn);
    grid.appendChild(card);
  });
  root.appendChild(grid);

  const masteryBtn = el("button", "btn-gradient w-full mt-6 py-3.5 rounded-2xl text-lg font-black",
    "🕸️ View My Mastery Web");
  masteryBtn.onclick = () => go("mastery");
  root.appendChild(masteryBtn);
}

/* =====================================================================
   GAME DISPATCH
   ===================================================================== */
async function renderGame(root, key) {
  const g = gameByKey(key);
  hero(root, g.emoji, g.title, g.subtitle);
  backBar(root);

  if (!isUnlocked(key)) {
    root.appendChild(el("div", "tip", "🔒 This game is locked — complete earlier levels or use Demo Mode."));
    return;
  }

  if (key === "vocal_mirror") return renderVocalMirror(root);

  if (!App.cache[key]) {
    const data = await apiGet(`/api/questions/${key}`);
    App.cache[key] = data.questions;
    App.roundIdx[key] = App.roundIdx[key] || 0;
  }
  const qs = App.cache[key];
  const idx = (App.roundIdx[key] || 0) % qs.length;
  const q = qs[idx];

  const stage = el("div", "card p-6");
  root.appendChild(stage);

  const dispatch = {
    stress_matrix: renderStressMatrix,
    cadence_pulse: renderCadencePulse,
    shift_shift: renderShiftShift,
    wave_reader: renderWaveReader,
    subtext_decode: renderSubtextDecode,
    tone_sync: renderToneSync,
  };
  dispatch[key](stage, key, q);
}

// Shared submit/next flow. Set `options` for a standard multiple-choice grid,
// or pass `chosenGetter` + `onReveal` to drive a custom selection UI (e.g. chips).
function answerFlow(stage, key, q, { options = null, chosenGetter = null, onReveal = null } = {}) {
  let selected = null;
  const buttons = [];
  if (options) {
    const optWrap = el("div", "space-y-2 mt-4");
    options.forEach((text, i) => {
      const b = el("button", "opt", text);
      b.onclick = () => {
        selected = i;
        buttons.forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
        sfxClick();
      };
      buttons.push(b);
      optWrap.appendChild(b);
    });
    stage.appendChild(optWrap);
  }

  const controls = el("div", "flex gap-3 mt-5");
  const submit = el("button", "btn-gradient flex-1 py-3 rounded-xl font-black", "✅ Submit");
  const next = el("button", "opt !w-auto px-5 py-3 hidden", "➡️ Next Round");
  controls.append(submit, next);
  stage.appendChild(controls);
  const fb = el("div", "mt-4");
  stage.appendChild(fb);

  submit.onclick = async () => {
    const choice = chosenGetter ? chosenGetter() : selected;
    if (choice === null || choice === undefined || (Array.isArray(choice) && choice.length === 0)) {
      toast("Make a selection first!", "bad");
      return;
    }
    const res = await apiPost("/api/answer", { game: key, qid: q.id, choice });
    App.state = res.state;
    renderHUD();
    submit.disabled = true;
    next.classList.remove("hidden");
    // default reveal for multiple-choice
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === res.answer) b.classList.add("correct");
    });
    if (!res.correct && typeof res.answer === "number" && buttons[choice]) {
      buttons[choice].classList.add("wrong");
    }
    if (onReveal) onReveal(res, choice);
    if (res.correct) { sfxCorrect(); toast("✅ Correct! +XP", "good"); }
    else { sfxWrong(); toast("❌ Not quite", "bad"); }
    fb.innerHTML = `<div class="tip">${res.correct ? "✅" : "💡"} ${res.explanation}</div>`;
  };
  next.onclick = () => { App.roundIdx[key] = (App.roundIdx[key] || 0) + 1; render(); };
  return { buttons, submit, next, fb };
}

/* ---------- GAME 1: StressMatrix ---------- */
function renderStressMatrix(stage, key, q) {
  stage.appendChild(el("div", "text-xl font-black",
    `Which syllable carries primary stress in “${q.word}”?`));
  const row = el("div", "my-4");
  q.syllables.forEach((s, i) => {
    const pill = el("span", "syl", s);
    pill.onclick = () => {
      [...row.children].forEach((c) => c.classList.remove("stressed"));
      pill.classList.add("stressed");
      playTone(300 + i * 120, 0, 0.18, { type: "triangle" });
    };
    row.appendChild(pill);
  });
  stage.appendChild(row);
  stage.appendChild(el("div", "text-slate-400 text-sm", "Tap syllables to hear them, then pick the stress pattern:"));
  answerFlow(stage, key, q, { options: q.options });
}

/* ---------- GAME 2: CadencePulse ---------- */
function renderCadencePulse(stage, key, q) {
  stage.appendChild(el("div", "text-xl font-black", "Tap the content words that carry the beat."));
  stage.appendChild(el("div", "text-slate-400 text-sm mt-1 mb-4",
    "Content words (nouns, main verbs, adjectives, adverbs) get stressed. Function words (a, the, to) stay light."));

  const picked = new Set();
  const chips = [];
  const row = el("div", "flex flex-wrap");
  q.words.forEach((w, i) => {
    const chip = el("span", "word", w);
    chip.onclick = () => {
      if (chip.dataset.locked) return;
      if (picked.has(i)) { picked.delete(i); chip.classList.remove("picked"); }
      else { picked.add(i); chip.classList.add("picked"); playTone(392, 0, 0.1, { type: "triangle" }); }
    };
    chips.push(chip);
    row.appendChild(chip);
  });
  stage.appendChild(row);

  answerFlow(stage, key, q, {
    chosenGetter: () => [...picked],
    onReveal: (res) => {
      chips.forEach((c) => (c.dataset.locked = "1"));
      // outline the correct beat words in green
      (res.answer || []).forEach((i) => {
        chips[i].style.outline = "2px solid #22c55e";
        chips[i].style.outlineOffset = "2px";
      });
    },
  });
}

/* ---------- GAME 3: ShiftShift ---------- */
function renderShiftShift(stage, key, q) {
  stage.appendChild(el("div", "text-xl font-black", q.prompt));
  const list = el("div", "my-4 space-y-2");
  q.items.forEach((it) => {
    list.appendChild(el("div", "text-slate-300",
      `<b class="text-white">${it.pair}</b> — <span class="text-slate-400">${it.note}</span>`));
  });
  stage.appendChild(list);
  answerFlow(stage, key, q, { options: q.options });
}

/* ---------- GAME 4: WaveReader ---------- */
// tiny seeded PRNG (mulberry32) so the client waveform is deterministic per question
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function renderWaveReader(stage, key, q) {
  stage.appendChild(el("div", "text-xl font-black",
    `Read the sound — which syllable is the loudest? (${q.tier}, ${q.n} syllables)`));
  const canvas = el("canvas", "w-full rounded-xl mt-4 border border-white/10");
  canvas.width = 760; canvas.height = 260;
  canvas.style.background = "#0e1526";
  stage.appendChild(canvas);

  const rnd = mulberry32(q.seed);
  const amps = Array.from({ length: q.n }, () => 0.35 + rnd() * 0.25);
  amps[q.peak] = 1.0;
  drawWave(canvas, amps, q.n);
  // subtle animation: pulse the peak
  let t = 0;
  const anim = () => {
    t += 0.05;
    drawWave(canvas, amps, q.n, t);
    App._waveRaf = requestAnimationFrame(anim);
  };
  cancelAnimationFrame(App._waveRaf);
  anim();

  const playBtn = el("button", "opt !w-auto px-4 py-2 mt-3", "🔊 Hear the syllables");
  playBtn.onclick = () => amps.forEach((a, i) => playTone(260 + a * 260, i * 0.34, 0.28, { type: "sine", gain: 0.05 + a * 0.25 }));
  stage.appendChild(playBtn);

  const options = Array.from({ length: q.n }, (_, i) => `Syllable σ${i + 1}`);
  answerFlow(stage, key, q, { options });
}

function drawWave(canvas, amps, n, phase = 0) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const midAmp = H * 0.42, baseY = H * 0.5;

  // grid + syllable dividers
  ctx.strokeStyle = "rgba(51,65,92,.6)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * W;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  ctx.fillStyle = "#93a4c9";
  ctx.font = "12px Nunito, sans-serif";
  for (let i = 0; i < n; i++) {
    ctx.fillText(`σ${i + 1}`, ((i + 0.5) / n) * W - 8, H - 8);
  }

  // amplitude envelope waveform
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, "#22d3ee"); grad.addColorStop(1, "#7c3aed");
  ctx.strokeStyle = grad; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = 0; px <= W; px++) {
    const pos = (px / W) * n;
    // envelope = sum of gaussians centered at each syllable
    let env = 0;
    for (let i = 0; i < n; i++) {
      const c = i + 0.5;
      env += amps[i] * Math.exp(-((pos - c) ** 2) / (2 * 0.14 ** 2));
    }
    const carrier = Math.sin(pos * 34 + phase * 6);
    const y = baseY - env * carrier * midAmp;
    px === 0 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
  }
  ctx.stroke();

  // pitch peaks (dots)
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) / n) * W;
    const pulse = i === amps.indexOf(Math.max(...amps)) ? (1 + 0.15 * Math.sin(phase * 4)) : 1;
    const r = 4 + amps[i] * 10 * pulse;
    ctx.beginPath();
    ctx.fillStyle = amps[i] >= 0.99 ? "#f472b6" : "#38bdf8";
    ctx.arc(x, baseY - amps[i] * midAmp - 14, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ---------- GAME 5: SubtextDecode ---------- */
function renderSubtextDecode(stage, key, q) {
  stage.appendChild(el("div", "text-xl font-black", "What does the stressed word imply?"));
  stage.appendChild(el("div", "text-2xl font-black my-4 text-cyan-300",
    `“${q.sentence}”`));
  stage.appendChild(el("div", "text-slate-400 text-sm mb-2", "Pick the implied meaning:"));
  answerFlow(stage, key, q, { options: q.options });
}

/* ---------- GAME 6: ToneSync ---------- */
function renderToneSync(stage, key, q) {
  stage.appendChild(el("div", "text-xl font-black", `Reference phrase: “${q.phrase}”`));
  const beats = q.pattern.map((b) => (b ? "●" : "○")).join(" ");
  stage.appendChild(el("div", "beat my-3 text-cyan-300", beats));

  const play = el("button", "btn-gradient px-5 py-3 rounded-xl font-black", "🔊 Play the rhythm");
  play.onclick = () => { playRhythm(q.pattern); play.classList.add("pop"); setTimeout(() => play.classList.remove("pop"), 250); };
  stage.appendChild(play);
  stage.appendChild(el("div", "text-slate-400 text-sm mt-3", "Listen, then pick the matching meter:"));
  answerFlow(stage, key, q, { options: q.options });
}

/* ---------- GAME 7: VocalMirror (capstone) ---------- */
async function renderVocalMirror(root) {
  const data = App.cache["vocal_mirror"] || (App.cache["vocal_mirror"] = (await apiGet("/api/questions/vocal_mirror")).questions);
  const tiers = data;
  let current = tiers[0];

  const stage = el("div", "card p-6");
  root.appendChild(stage);

  // tier selector
  const tierRow = el("div", "flex gap-2 flex-wrap");
  tiers.forEach((t) => {
    const b = el("button", "opt !w-auto px-4 py-2", `${t.tier} · ${t.label}`);
    b.onclick = () => { current = t; [...tierRow.children].forEach((c) => c.classList.remove("selected")); b.classList.add("selected"); target.textContent = `“${current.target}”`; };
    tierRow.appendChild(b);
  });
  tierRow.firstChild.classList.add("selected");
  stage.appendChild(el("div", "text-sm text-slate-400 mb-2", "Choose difficulty:"));
  stage.appendChild(tierRow);

  const target = el("div", "text-2xl font-black my-4 text-cyan-300", `“${current.target}”`);
  stage.appendChild(el("div", "text-slate-400 text-sm mt-4", "🎙️ Say this aloud:"));
  stage.appendChild(target);

  // live media area: mic waveform canvas + webcam preview
  const mediaGrid = el("div", "grid grid-cols-1 md:grid-cols-2 gap-4 my-4");
  const micBox = el("div", "card p-3");
  micBox.appendChild(el("div", "text-xs font-bold text-slate-400 mb-2", "🎤 Live mic waveform"));
  const micCanvas = el("canvas", "w-full rounded-lg");
  micCanvas.width = 380; micCanvas.height = 140; micCanvas.style.background = "#0e1526";
  micBox.appendChild(micCanvas);
  const camBox = el("div", "card p-3");
  camBox.appendChild(el("div", "text-xs font-bold text-slate-400 mb-2", "📷 Webcam preview"));
  const video = el("video", "w-full rounded-lg bg-black");
  video.autoplay = true; video.muted = true; video.playsInline = true; video.style.maxHeight = "140px";
  camBox.appendChild(video);
  mediaGrid.append(micBox, camBox);
  stage.appendChild(mediaGrid);

  const ctrls = el("div", "flex gap-3 flex-wrap");
  const startBtn = el("button", "opt !w-auto px-4 py-2", "▶️ Start camera & mic");
  const stopBtn = el("button", "opt !w-auto px-4 py-2 hidden", "⏹️ Stop");
  const analyzeBtn = el("button", "btn-gradient px-5 py-2.5 rounded-xl font-black", "🔬 Analyze My Prosody");
  ctrls.append(startBtn, stopBtn, analyzeBtn);
  stage.appendChild(ctrls);

  startBtn.onclick = () => startMedia(video, micCanvas, startBtn, stopBtn);
  stopBtn.onclick = () => { stopMedia(); startBtn.classList.remove("hidden"); stopBtn.classList.add("hidden"); };

  const scoreArea = el("div", "mt-6");
  stage.appendChild(scoreArea);

  analyzeBtn.onclick = async () => {
    const res = await apiPost("/api/vocal", { tier: current.tier, qid: current.id });
    App.state = res.state;
    renderHUD();
    res.passed ? sfxCorrect() : sfxWrong();
    toast(res.passed ? `🎉 +XP! Articulation ${res.overall}%` : `Logged ${res.overall}% — keep practicing!`, res.passed ? "good" : "info");
    scoreArea.innerHTML = "";
    const cards = el("div", "grid grid-cols-3 gap-3");
    [["Pitch Stability", res.pitch, "#22d3ee"], ["Stress Accuracy", res.stress, "#f59e0b"], ["Rhythm Flow", res.rhythm, "#a78bfa"]]
      .forEach(([label, val, color]) => {
        const c = el("div", "card p-4 text-center");
        c.innerHTML = `<div class="text-3xl font-black" style="color:${color}">${val}%</div>
                       <div class="text-xs text-slate-400 font-bold mt-1">${label}</div>
                       <div class="bar mt-2"><div style="width:${val}%"></div></div>`;
        cards.appendChild(c);
      });
    scoreArea.appendChild(cards);
    const overall = el("div", "mt-4");
    overall.innerHTML = `<div class="text-sm font-bold text-slate-300 mb-1">Overall articulation: ${res.overall}%</div>
                         <div class="bar"><div style="width:${res.overall}%"></div></div>`;
    scoreArea.appendChild(overall);
    scoreArea.appendChild(el("div", "text-lg font-black mt-5 mb-1", "🎯 Actionable tips"));
    res.tips.forEach((t) => scoreArea.appendChild(el("div", "tip", `💡 ${t}`)));
    if (!App.media.stream) scoreArea.appendChild(el("div", "text-xs text-slate-500 mt-2",
      "ℹ️ Simulated sample (no live audio detected). Start camera & mic for a real attempt."));
  };
}

async function startMedia(video, micCanvas, startBtn, stopBtn) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    App.media.stream = stream;
    video.srcObject = stream;
    startBtn.classList.add("hidden");
    stopBtn.classList.remove("hidden");

    const ac = audioCtx();
    const src = ac.createMediaStreamSource(stream);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    App.media.audioCtx = ac;
    const buf = new Uint8Array(analyser.fftSize);
    const ctx = micCanvas.getContext("2d");

    const draw = () => {
      analyser.getByteTimeDomainData(buf);
      const W = micCanvas.width, H = micCanvas.height;
      ctx.fillStyle = "#0e1526"; ctx.fillRect(0, 0, W, H);
      ctx.lineWidth = 2; ctx.strokeStyle = "#22d3ee";
      ctx.beginPath();
      for (let i = 0; i < buf.length; i++) {
        const x = (i / buf.length) * W;
        const y = (buf[i] / 255) * H;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      App.media.raf = requestAnimationFrame(draw);
    };
    draw();
    toast("🎤 Mic & camera live", "good");
  } catch (e) {
    toast("Camera/mic permission denied — analysis will be simulated.", "bad");
  }
}

function stopMedia() {
  if (App.media.raf) cancelAnimationFrame(App.media.raf);
  if (App._waveRaf) cancelAnimationFrame(App._waveRaf);
  if (App.media.stream) {
    App.media.stream.getTracks().forEach((t) => t.stop());
    App.media.stream = null;
  }
}

/* =====================================================================
   MASTERY WEB (radar)
   ===================================================================== */
function renderMastery(root) {
  hero(root, "🕸️", "Mastery Web", "Your prosody profile across all seven competencies.");
  backBar(root);

  const grid = el("div", "grid grid-cols-1 lg:grid-cols-5 gap-5");
  const chartCard = el("div", "card p-5 lg:col-span-3");
  const canvas = el("canvas");
  chartCard.appendChild(canvas);
  grid.appendChild(chartCard);

  const s = App.state;
  const comps = App.meta.competencies;
  const values = comps.map((c) => s.scores[c] || 0);

  // summary + recommendation
  const side = el("div", "lg:col-span-2 space-y-3");
  side.appendChild(statCard("🎓 Fluency Index", `${s.fluency.code} · ${s.fluency.name}`, `${Math.round(s.fluency.avg)}% avg mastery`));
  side.appendChild(statCard("⭐ Total XP", s.xp, "keep the streak alive"));
  side.appendChild(statCard("🔥 Best Streak", s.best_streak, "consecutive correct answers"));

  let lowIdx = 0, hiIdx = 0;
  values.forEach((v, i) => { if (v < values[lowIdx]) lowIdx = i; if (v > values[hiIdx]) hiIdx = i; });
  const lowComp = comps[lowIdx];
  const lowGame = App.meta.games.find((g) => g.competency === lowComp);
  const rec = el("div", "tip",
    `${lowGame.emoji} Your lowest area is <b>${lowComp}</b> (${values[lowIdx]}%). Focus on <b>${lowGame.title}</b> to level it up.`);
  side.appendChild(rec);
  side.appendChild(el("div", "tip",
    `🏅 Strongest: <b>${comps[hiIdx]}</b> (${values[hiIdx]}%). Great work!`));
  const playLow = el("button", "btn-gradient w-full py-3 rounded-xl font-black", `▶️ Train ${lowGame.title}`);
  playLow.onclick = () => go("game", lowGame.key);
  side.appendChild(playLow);
  grid.appendChild(side);
  root.appendChild(grid);

  // per-competency bars
  const breakdown = el("div", "card p-5 mt-5");
  breakdown.appendChild(el("div", "text-lg font-black mb-3", "🧩 Competency breakdown"));
  const bgrid = el("div", "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4");
  comps.forEach((c, i) => {
    const cell = el("div", "");
    cell.innerHTML = `<div class="text-sm font-bold mb-1">${c} — ${values[i]}%</div>
                      <div class="bar"><div style="width:${values[i]}%"></div></div>`;
    bgrid.appendChild(cell);
  });
  breakdown.appendChild(bgrid);
  root.appendChild(breakdown);

  // Chart.js radar
  if (App.chart) App.chart.destroy();
  App.chart = new Chart(canvas.getContext("2d"), {
    type: "radar",
    data: {
      labels: comps,
      datasets: [
        {
          label: "Current Mastery",
          data: values,
          fill: true,
          backgroundColor: "rgba(34,211,238,0.25)",
          borderColor: "#22d3ee",
          borderWidth: 3,
          pointBackgroundColor: "#22d3ee",
        },
        {
          label: "80% Target Fluency",
          data: comps.map(() => 80),
          fill: false,
          borderColor: "#fde047",
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: "#e6edff", font: { weight: "bold" } } } },
      scales: {
        r: {
          suggestedMin: 0, suggestedMax: 100,
          angleLines: { color: "#33415c" },
          grid: { color: "#33415c" },
          pointLabels: { color: "#e6edff", font: { size: 12, weight: "bold" } },
          ticks: { color: "#93a4c9", backdropColor: "transparent", stepSize: 20 },
        },
      },
    },
  });
}

function statCard(title, big, sub) {
  const c = el("div", "card p-4");
  c.innerHTML = `<div class="text-xs text-slate-400 font-bold uppercase tracking-wide">${title}</div>
                 <div class="text-3xl font-black mt-1">${big}</div>
                 <div class="text-xs text-slate-500">${sub}</div>`;
  return c;
}

/* =====================================================================
   BOOT
   ===================================================================== */
async function boot() {
  App.meta = await apiGet("/api/meta");
  App.state = await apiGet("/api/state");
  renderHUD();

  $("#logo-btn").onclick = () => go(App.state.placed || App.state.unlocked.length ? "hub" : "placement");
  $("#demo-btn").onclick = async () => {
    App.state = await apiPost("/api/demo");
    sfxCorrect();
    toast("⚡ Demo Mode — all games unlocked!", "good");
    go("hub");
  };
  $("#reset-btn").onclick = async () => {
    App.state = await apiPost("/api/reset");
    App.cache = {}; App.roundIdx = {};
    toast("🔄 Progress reset", "info");
    go("placement");
  };

  go(App.state.placed || App.state.unlocked.length ? "hub" : "placement");
}

boot();
