"""
LingoWave — a gamified English prosody & pronunciation trainer.

A single-file Streamlit app built for a hackathon pitch. It teaches the
"music" of English: syllable stress, sentence rhythm, heteronyms, waveform
reading, contextual subtext, audio cadence, and articulation flow — all
wrapped in a Duolingo-style XP / streak / unlockable-level shell.

Run with:  streamlit run app.py
"""

import io
import base64
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import plotly.graph_objects as go
import streamlit as st

# --------------------------------------------------------------------------- #
#  Page config + global constants
# --------------------------------------------------------------------------- #
st.set_page_config(
    page_title="LingoWave · Speak the Music of English",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Ordered game registry. Each entry: key, emoji, title, subtitle, competency,
# and the XP awarded per correct answer.
GAMES = [
    ("stress_matrix", "🎯", "StressMatrix", "Stress Pattern", "Syllable Stress", 12),
    ("cadence_pulse", "🥁", "CadencePulse", "Copy the Rhythm", "Sentence Rhythm", 12),
    ("shift_shift", "🔀", "ShiftShift", "Heteronym & Semantic Stress", "Heteronym Shift", 14),
    ("wave_reader", "📈", "WaveReader", "Read the Sound", "Waveform Recognition", 14),
    ("subtext_decode", "💬", "SubtextDecode", "Conversation Context Stress", "Contextual Subtext", 16),
    ("tone_sync", "🎵", "ToneSync", "Match the Rhythm", "Audio Cadence", 14),
    ("vocal_mirror", "🪞", "VocalMirror", "Shape the Sound", "Articulation & Flow", 20),
]

COMPETENCIES = [g[4] for g in GAMES]

# Fluency bands mapped from an average competency score (0-100).
FLUENCY_BANDS = [
    (0, "A1", "Breakthrough"),
    (25, "A2", "Waystage"),
    (45, "B1", "Threshold"),
    (60, "B2", "Vantage"),
    (78, "C1", "Advanced"),
    (92, "C2", "Mastery"),
]

LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced"]

# --------------------------------------------------------------------------- #
#  Custom CSS — sleek, colorful, gamified
# --------------------------------------------------------------------------- #
def inject_css():
    st.markdown(
        """
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap');

        html, body, [class*="css"] { font-family: 'Nunito', sans-serif; }

        .stApp {
            background: radial-gradient(1200px 600px at 10% -10%, #1b2a4a 0%, #0e1526 45%, #080b16 100%);
            color: #eef2ff;
        }

        /* Hero banner */
        .lw-hero {
            background: linear-gradient(120deg, #7c3aed 0%, #2563eb 45%, #06b6d4 100%);
            border-radius: 22px;
            padding: 26px 32px;
            margin-bottom: 8px;
            box-shadow: 0 18px 50px rgba(37,99,235,.35);
        }
        .lw-hero h1 { color: white; font-weight: 900; font-size: 2.3rem; margin: 0; letter-spacing: -.5px; }
        .lw-hero p  { color: #e6edff; margin: 6px 0 0 0; font-size: 1.05rem; font-weight: 700; }

        /* Stat pills */
        .lw-pills { display: flex; gap: 12px; flex-wrap: wrap; margin: 14px 0 4px 0; }
        .lw-pill {
            background: rgba(255,255,255,.06);
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 16px; padding: 10px 16px; min-width: 110px;
            backdrop-filter: blur(6px);
        }
        .lw-pill .v { font-size: 1.5rem; font-weight: 900; line-height: 1; }
        .lw-pill .l { font-size: .72rem; text-transform: uppercase; letter-spacing: 1px; opacity: .75; }

        /* Game cards */
        .lw-card {
            background: linear-gradient(160deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
            border: 1px solid rgba(255,255,255,.10);
            border-radius: 18px; padding: 16px 18px; height: 100%;
        }
        .lw-card.locked { opacity: .55; filter: grayscale(.4); }
        .lw-card h3 { margin: 4px 0 2px 0; font-weight: 900; font-size: 1.15rem; }
        .lw-card .sub { opacity: .7; font-size: .82rem; font-weight: 700; }
        .lw-badge {
            display: inline-block; padding: 3px 10px; border-radius: 999px;
            font-size: .7rem; font-weight: 900; text-transform: uppercase; letter-spacing: .5px;
        }
        .b-unlocked { background: rgba(34,197,94,.18); color: #86efac; border: 1px solid rgba(34,197,94,.4); }
        .b-locked   { background: rgba(148,163,184,.15); color: #cbd5e1; border: 1px solid rgba(148,163,184,.3); }
        .b-mastered { background: rgba(250,204,21,.18); color: #fde047; border: 1px solid rgba(250,204,21,.45); }

        /* Syllable chips */
        .syl { display:inline-block; padding:8px 14px; margin:3px; border-radius:12px;
               font-weight:900; font-size:1.1rem; letter-spacing:1px;
               background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.12); }
        .syl.stressed { background:linear-gradient(120deg,#f59e0b,#ef4444); color:white;
                        box-shadow:0 6px 18px rgba(239,68,68,.4); transform:translateY(-2px); }

        /* Beat dots */
        .beat { font-size: 1.6rem; letter-spacing: 6px; }

        /* Buttons */
        .stButton>button {
            border-radius: 14px; font-weight: 800; border: 1px solid rgba(255,255,255,.14);
            background: linear-gradient(120deg,#6d28d9,#2563eb); color: white; transition: .15s;
        }
        .stButton>button:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(37,99,235,.4); }

        section[data-testid="stSidebar"] {
            background: linear-gradient(180deg,#0b1220,#0a0f1c);
            border-right: 1px solid rgba(255,255,255,.06);
        }

        .lw-tip {
            background: rgba(6,182,212,.10); border-left: 4px solid #06b6d4;
            border-radius: 10px; padding: 10px 14px; margin: 6px 0; font-weight: 700;
        }
        .stTabs [data-baseweb="tab-list"] { gap: 6px; }
        .stTabs [data-baseweb="tab"] { border-radius: 12px 12px 0 0; font-weight: 800; }
        </style>
        """,
        unsafe_allow_html=True,
    )


# --------------------------------------------------------------------------- #
#  Session state
# --------------------------------------------------------------------------- #
def init_state():
    ss = st.session_state
    ss.setdefault("placed", False)          # completed placement test?
    ss.setdefault("level", None)            # Beginner / Intermediate / Advanced
    ss.setdefault("xp", 0)
    ss.setdefault("streak", 0)
    ss.setdefault("best_streak", 0)
    ss.setdefault("nav", "Placement Test")
    # competency scores 0-100 (rolling best per game)
    ss.setdefault("scores", {c: 0 for c in COMPETENCIES})
    # unlocked games (by key)
    ss.setdefault("unlocked", set())
    # per-game "played rounds" count for the hub
    ss.setdefault("rounds", {g[0]: 0 for g in GAMES})
    ss.setdefault("placement_answers", {})


def award(competency, correct, xp_per, delta_score=20):
    """Register an answer: bump XP + streak on success, update competency score."""
    ss = st.session_state
    if correct:
        ss.xp += xp_per
        ss.streak += 1
        ss.best_streak = max(ss.best_streak, ss.streak)
        ss.scores[competency] = min(100, ss.scores[competency] + delta_score)
    else:
        ss.streak = 0
        ss.scores[competency] = max(0, ss.scores[competency] - 5)


def unlock_by_level(level):
    """Unlock games according to placement result."""
    ss = st.session_state
    ss.level = level
    if level == "Beginner":
        keys = {g[0] for g in GAMES[:2]}
    elif level == "Intermediate":
        keys = {g[0] for g in GAMES[:4]}
    else:  # Advanced
        keys = {g[0] for g in GAMES[:6]}
    ss.unlocked |= keys


def unlock_all():
    st.session_state.unlocked = {g[0] for g in GAMES}
    if not st.session_state.level:
        st.session_state.level = "Advanced"
    st.session_state.placed = True


def fluency_band():
    avg = float(np.mean(list(st.session_state.scores.values()))) if st.session_state.scores else 0
    band = FLUENCY_BANDS[0]
    for threshold, code, name in FLUENCY_BANDS:
        if avg >= threshold:
            band = (threshold, code, name)
    return band[1], band[2], avg


# --------------------------------------------------------------------------- #
#  Small UI helpers
# --------------------------------------------------------------------------- #
def hero(title, subtitle):
    st.markdown(
        f"<div class='lw-hero'><h1>{title}</h1><p>{subtitle}</p></div>",
        unsafe_allow_html=True,
    )


def stat_pills():
    code, name, avg = fluency_band()
    unlocked = len(st.session_state.unlocked)
    st.markdown(
        f"""
        <div class='lw-pills'>
          <div class='lw-pill'><div class='v'>🔥 {st.session_state.streak}</div><div class='l'>Streak</div></div>
          <div class='lw-pill'><div class='v'>⭐ {st.session_state.xp}</div><div class='l'>Total XP</div></div>
          <div class='lw-pill'><div class='v'>🎓 {code}</div><div class='l'>Fluency · {name}</div></div>
          <div class='lw-pill'><div class='v'>🗺️ {unlocked}/{len(GAMES)}</div><div class='l'>Unlocked</div></div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def syllable_row(syllables, stressed_idx):
    """Render syllable chips, highlighting the stressed one(s)."""
    if isinstance(stressed_idx, int):
        stressed_idx = {stressed_idx}
    else:
        stressed_idx = set(stressed_idx)
    html = ""
    for i, s in enumerate(syllables):
        cls = "syl stressed" if i in stressed_idx else "syl"
        html += f"<span class='{cls}'>{s}</span>"
    st.markdown(html, unsafe_allow_html=True)


def beat_pattern(pattern):
    """pattern is a list of 1/0 -> ● / ○."""
    dots = " ".join("●" if b else "○" for b in pattern)
    st.markdown(f"<div class='beat'>{dots}</div>", unsafe_allow_html=True)


def feedback(correct, explanation):
    if correct:
        st.success("✅ Correct! " + explanation)
        st.balloons()
    else:
        st.error("❌ Not quite. " + explanation)


# --------------------------------------------------------------------------- #
#  Synthetic audio (browser-safe beeps encoded as WAV data URIs)
# --------------------------------------------------------------------------- #
def rhythm_wav_bytes(pattern, base_freq=330, beat=0.28, sr=16000):
    """
    Build a short mono WAV in memory from a stress pattern.
    Strong beats (1) are louder + slightly higher pitched than weak beats (0).
    Returns raw WAV bytes so it can feed st.audio directly — no asset files.
    """
    import wave, struct

    samples = []
    for b in pattern:
        n = int(sr * beat)
        t = np.linspace(0, beat, n, endpoint=False)
        freq = base_freq * (1.5 if b else 1.0)
        amp = 0.55 if b else 0.22
        env = np.minimum(1.0, np.minimum(t * 40, (beat - t) * 40))  # soft attack/decay
        wave_arr = amp * env * np.sin(2 * np.pi * freq * t)
        samples.append(wave_arr)
        samples.append(np.zeros(int(sr * 0.05)))  # small gap
    signal = np.concatenate(samples)
    signal = np.int16(signal / (np.max(np.abs(signal)) + 1e-9) * 32000)

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(b"".join(struct.pack("<h", s) for s in signal))
    return buf.getvalue()


# --------------------------------------------------------------------------- #
#  Sidebar
# --------------------------------------------------------------------------- #
def sidebar():
    ss = st.session_state
    with st.sidebar:
        st.markdown("## 🌊 LingoWave")
        st.caption("Speak the *music* of English.")

        code, name, avg = fluency_band()
        st.progress(min(1.0, avg / 100), text=f"Fluency {code} · {int(avg)}% mastery")
        st.markdown(
            f"**🔥 Streak:** {ss.streak}  |  **⭐ XP:** {ss.xp}\n\n"
            f"**🏆 Best streak:** {ss.best_streak}  |  **🎓 Level:** {ss.level or '—'}"
        )
        st.divider()

        st.markdown("### 🗺️ Game Map")
        nav_options = ["Placement Test", "Game Hub"]
        for key, emoji, title, sub, comp, xp in GAMES:
            locked = key not in ss.unlocked
            mark = "🔒" if locked else ("🏅" if ss.scores[comp] >= 80 else "▶️")
            nav_options.append(f"{emoji} {title}")
        nav_options.append("🕸️ Mastery Web")

        # radio nav keeps things simple + stateful
        choice = st.radio(
            "Navigate",
            nav_options,
            index=nav_options.index(ss.nav) if ss.nav in nav_options else 0,
            label_visibility="collapsed",
        )
        ss.nav = choice

        st.divider()
        if st.button("⚡ Skip to Demo Mode (Unlock All)", use_container_width=True):
            unlock_all()
            ss.nav = "Game Hub"
            st.rerun()

        if st.button("🔄 Reset Progress", use_container_width=True):
            for k in ["placed", "level", "xp", "streak", "best_streak", "scores",
                      "unlocked", "rounds", "placement_answers", "nav"]:
                ss.pop(k, None)
            init_state()
            st.rerun()

        st.caption("Made with Streamlit · plotly · numpy · matplotlib")


# --------------------------------------------------------------------------- #
#  Placement Test
# --------------------------------------------------------------------------- #
PLACEMENT_QUESTIONS = [
    {
        "q": "Where is the primary stress in **“banana”**?",
        "syl": ["ba", "NA", "na"],
        "options": ["ba-NA-na (2nd)", "BA-na-na (1st)", "ba-na-NA (3rd)", "Equal stress"],
        "answer": 0,
        "weight": 1,
    },
    {
        "q": "Which sentence stresses the **contrast** correctly for *“I said the RED car, not the blue one”*?",
        "options": [
            "I SAID the red car…",
            "I said the RED car…",
            "I said the red CAR…",
            "I said THE red car…",
        ],
        "answer": 1,
        "weight": 2,
    },
    {
        "q": "As a **verb**, how is *“record”* stressed? (*“Please ___ the meeting.”*)",
        "options": ["RE-cord (1st)", "re-CORD (2nd)", "Both are fine", "Neither"],
        "answer": 1,
        "weight": 3,
    },
]


def page_placement():
    hero("🎓 Placement Test", "Three quick questions to find your starting level.")
    ss = st.session_state

    if ss.placed:
        st.success(f"You're placed at **{ss.level}**. Head to the Game Hub, or retake below.")
    st.write("Answer all three, then submit to unlock your personalized track.")

    with st.form("placement"):
        answers = {}
        for i, item in enumerate(PLACEMENT_QUESTIONS):
            st.markdown(f"#### Q{i+1}. {item['q']}")
            if "syl" in item:
                syllable_row(item["syl"], 1)
            answers[i] = st.radio(
                f"select_{i}", item["options"], key=f"pl_{i}",
                label_visibility="collapsed",
            )
            st.write("")
        submitted = st.form_submit_button("🚀 Submit & Unlock My Track", use_container_width=True)

    if submitted:
        weighted = 0
        max_w = sum(q["weight"] for q in PLACEMENT_QUESTIONS)
        for i, item in enumerate(PLACEMENT_QUESTIONS):
            if item["options"].index(answers[i]) == item["answer"]:
                weighted += item["weight"]
        pct = weighted / max_w
        if pct <= 0.34:
            level = "Beginner"
        elif pct <= 0.75:
            level = "Intermediate"
        else:
            level = "Advanced"

        ss.placed = True
        unlock_by_level(level)
        # seed a little starting mastery so the radar isn't empty
        for c in COMPETENCIES:
            ss.scores[c] = max(ss.scores[c], int(pct * 30))
        st.balloons()
        st.success(
            f"🎉 Score {weighted}/{max_w} → **{level}**! "
            f"Unlocked {len(ss.unlocked)} games. Open the **Game Hub** in the sidebar."
        )


# --------------------------------------------------------------------------- #
#  Game Hub
# --------------------------------------------------------------------------- #
def page_hub():
    hero("🗺️ Game Hub", "Your journey through the seven layers of English prosody.")
    stat_pills()
    ss = st.session_state

    if not ss.placed and not ss.unlocked:
        st.info("👋 Take the **Placement Test** first, or hit **Skip to Demo Mode** in the sidebar.")

    cols = st.columns(3)
    for i, (key, emoji, title, sub, comp, xp) in enumerate(GAMES):
        with cols[i % 3]:
            locked = key not in ss.unlocked
            score = ss.scores[comp]
            if locked:
                badge = "<span class='lw-badge b-locked'>🔒 Locked</span>"
            elif score >= 80:
                badge = "<span class='lw-badge b-mastered'>🏅 Mastered</span>"
            else:
                badge = "<span class='lw-badge b-unlocked'>Unlocked</span>"
            st.markdown(
                f"""
                <div class='lw-card {'locked' if locked else ''}'>
                  <div style='font-size:2rem'>{emoji}</div>
                  <h3>{title}</h3>
                  <div class='sub'>{sub}</div>
                  {badge}
                  <div style='margin-top:8px;opacity:.8;font-size:.8rem'>
                    Competency: {comp} · +{xp} XP · Rounds: {ss.rounds[key]}
                  </div>
                </div>
                """,
                unsafe_allow_html=True,
            )
            st.progress(min(1.0, score / 100))
            if locked:
                st.button("🔒 Locked", key=f"hub_{key}", disabled=True, use_container_width=True)
            else:
                if st.button(f"▶️ Play {title}", key=f"hub_{key}", use_container_width=True):
                    ss.nav = f"{emoji} {title}"
                    st.rerun()
            st.write("")


# --------------------------------------------------------------------------- #
#  Generic multiple-choice round helper
# --------------------------------------------------------------------------- #
def mc_round(state_key, question_html, options, answer_idx, explanation,
             competency, xp, render_extra=None):
    """A reusable single-question round with answer + next flow."""
    ss = st.session_state
    ss.setdefault(state_key + "_answered", False)
    ss.setdefault(state_key + "_correct", False)

    st.markdown(question_html, unsafe_allow_html=True)
    if render_extra:
        render_extra()

    answered = ss[state_key + "_answered"]
    choice = st.radio("Choose:", options, key=state_key + "_choice",
                      disabled=answered, label_visibility="collapsed")

    c1, c2 = st.columns([1, 1])
    with c1:
        if st.button("✅ Submit", key=state_key + "_submit", disabled=answered,
                     use_container_width=True):
            correct = options.index(choice) == answer_idx
            ss[state_key + "_answered"] = True
            ss[state_key + "_correct"] = correct
            award(competency, correct, xp)
            st.rerun()
    with c2:
        if answered and st.button("➡️ Next Round", key=state_key + "_next",
                                  use_container_width=True):
            ss[state_key + "_answered"] = False
            ss[state_key + "_correct"] = False
            ss.rounds_bump = True
            st.rerun()

    if answered:
        feedback(ss[state_key + "_correct"], explanation)


def bump_round(key):
    if st.session_state.get("rounds_bump"):
        st.session_state.rounds[key] += 1
        st.session_state.rounds_bump = False


# --------------------------------------------------------------------------- #
#  GAME 1 — StressMatrix
# --------------------------------------------------------------------------- #
STRESS_ITEMS = [
    {"word": "PHOTOGRAPH", "syl": ["PHO", "to", "graph"], "stress": 0,
     "opts": ["● ○ ○  (1st)", "○ ● ○  (2nd)", "○ ○ ●  (3rd)", "● ● ○"], "ans": 0},
    {"word": "photography", "syl": ["pho", "TOG", "ra", "phy"], "stress": 1,
     "opts": ["● ○ ○ ○", "○ ● ○ ○  (2nd)", "○ ○ ● ○", "○ ○ ○ ●"], "ans": 1},
    {"word": "understand", "syl": ["un", "der", "STAND"], "stress": 2,
     "opts": ["● ○ ○", "○ ● ○", "○ ○ ●  (3rd)", "Equal"], "ans": 2},
    {"word": "computer", "syl": ["com", "PU", "ter"], "stress": 1,
     "opts": ["● ○ ○", "○ ● ○  (2nd)", "○ ○ ●", "● ● ●"], "ans": 1},
]


def game_stress_matrix():
    key = "stress_matrix"
    hero("🎯 StressMatrix", "Find the primary stressed syllable.")
    stat_pills()
    bump_round(key)

    idx = st.session_state.rounds[key] % len(STRESS_ITEMS)
    item = STRESS_ITEMS[idx]
    st.markdown(f"### Which syllable carries primary stress in **{item['word']}**?")
    syllable_row(item["syl"], item["stress"])
    st.write("")

    mc_round(
        f"sm_{idx}",
        "Pick the stress pattern:",
        item["opts"], item["ans"],
        f"**{item['word']}** → " + " / ".join(
            (s.upper() if i == item["stress"] else s.lower())
            for i, s in enumerate(item["syl"])
        ),
        "Syllable Stress", 12,
    )


# --------------------------------------------------------------------------- #
#  GAME 2 — CadencePulse
# --------------------------------------------------------------------------- #
CADENCE_ITEMS = [
    {"sentence": "I bought a red car yesterday",
     "words": ["I", "bought", "a", "red", "car", "yesterday"],
     "content": [1, 4, 5]},  # bought/red/car... primary: red, car, yesterday
    {"sentence": "She quickly ran to the station",
     "words": ["She", "quickly", "ran", "to", "the", "station"],
     "content": [1, 2, 5]},
    {"sentence": "We should finish the project tonight",
     "words": ["We", "should", "finish", "the", "project", "tonight"],
     "content": [2, 4, 5]},
]


def game_cadence_pulse():
    key = "cadence_pulse"
    hero("🥁 CadencePulse", "Tap the words that carry the beat.")
    stat_pills()
    bump_round(key)
    ss = st.session_state

    idx = ss.rounds[key] % len(CADENCE_ITEMS)
    item = CADENCE_ITEMS[idx]
    st.markdown(f"### Which **content words** carry the primary pitch accent?")
    st.markdown(f"> *{item['sentence']}*")
    st.caption("Content words (nouns, main verbs, adjectives, adverbs) get stressed. "
               "Function words (a, the, to) stay light. Pick the 3 beats.")

    state = f"cp_{idx}"
    ss.setdefault(state + "_answered", False)
    picks = []
    cols = st.columns(len(item["words"]))
    for i, w in enumerate(item["words"]):
        with cols[i]:
            picked = st.checkbox(w, key=f"{state}_w{i}", disabled=ss[state + "_answered"])
            if picked:
                picks.append(i)

    beat_pattern([1 if i in item["content"] else 0 for i in range(len(item["words"]))])

    c1, c2 = st.columns(2)
    with c1:
        if st.button("✅ Submit Beats", key=state + "_submit",
                     disabled=ss[state + "_answered"], use_container_width=True):
            correct = set(picks) == set(item["content"])
            ss[state + "_answered"] = True
            ss[state + "_correct"] = correct
            award("Sentence Rhythm", correct, 12)
            st.rerun()
    with c2:
        if ss[state + "_answered"] and st.button("➡️ Next", key=state + "_next",
                                                 use_container_width=True):
            ss[state + "_answered"] = False
            ss.rounds_bump = True
            st.rerun()

    if ss[state + "_answered"]:
        stressed = ", ".join(item["words"][i] for i in item["content"])
        feedback(ss.get(state + "_correct", False), f"The beats fall on: **{stressed}**.")


# --------------------------------------------------------------------------- #
#  GAME 3 — ShiftShift
# --------------------------------------------------------------------------- #
SHIFT_ITEMS = [
    {"triples": [
        ("RE-cord / re-CORD", "noun ↔ verb — shifts meaning"),
        ("CON-duct / con-DUCT", "noun ↔ verb — shifts meaning"),
        ("PRE-sent / pre-SENT", "noun/gift ↔ verb/give — shifts meaning"),
     ],
     "decoy": ("HAP-py / hap-PY", "adjective — does NOT change meaning with stress"),
     "prompt": "Three of these change part-of-speech/meaning when stress moves. Which one does **NOT**?"},
    {"triples": [
        ("OB-ject / ob-JECT", "noun ↔ verb"),
        ("PER-mit / per-MIT", "noun ↔ verb"),
        ("CON-tract / con-TRACT", "noun ↔ verb"),
     ],
     "decoy": ("TA-ble / ta-BLE", "noun — meaning unchanged by stress"),
     "prompt": "Pick the **odd one out** — the word whose meaning does NOT shift with stress."},
]


def game_shift_shift():
    key = "shift_shift"
    hero("🔀 ShiftShift", "Spot the heteronym that doesn't shift.")
    stat_pills()
    bump_round(key)

    idx = st.session_state.rounds[key] % len(SHIFT_ITEMS)
    item = SHIFT_ITEMS[idx]

    # Build 4 options: 3 real shifters + 1 decoy, deterministically ordered by round.
    options = [t[0] for t in item["triples"]] + [item["decoy"][0]]
    decoy_pos = (idx + 2) % 4
    # rotate decoy into decoy_pos
    reals = [t[0] for t in item["triples"]]
    opts = []
    r = 0
    for pos in range(4):
        if pos == decoy_pos:
            opts.append(item["decoy"][0])
        else:
            opts.append(reals[r]); r += 1
    ans = decoy_pos

    st.markdown(f"### {item['prompt']}")
    for t in item["triples"]:
        st.markdown(f"- **{t[0]}** — {t[1]}")
    st.markdown(f"- **{item['decoy'][0]}** — {item['decoy'][1]}")

    mc_round(
        f"ss_{idx}", "Which word does NOT shift meaning with stress?",
        opts, ans,
        f"**{item['decoy'][0]}** is the decoy — {item['decoy'][1]}.",
        "Heteronym Shift", 14,
    )


# --------------------------------------------------------------------------- #
#  GAME 4 — WaveReader
# --------------------------------------------------------------------------- #
def synth_waveform(n_syllables, peak_idx, seed):
    """Generate a synthetic amplitude envelope + pitch track over syllables."""
    rng = np.random.default_rng(seed)
    sr = 400
    t = np.linspace(0, n_syllables, n_syllables * sr)
    signal = np.zeros_like(t)
    centers = np.arange(n_syllables) + 0.5
    amps = rng.uniform(0.35, 0.6, n_syllables)
    amps[peak_idx] = 1.0  # stressed syllable is the tallest
    for c, a in zip(centers, amps):
        env = a * np.exp(-((t - c) ** 2) / (2 * 0.12 ** 2))
        carrier = np.sin(2 * np.pi * (12 + 6 * a) * t)
        signal += env * carrier
    pitch = np.zeros_like(t)
    for c, a in zip(centers, amps):
        pitch += a * np.exp(-((t - c) ** 2) / (2 * 0.18 ** 2))
    return t, signal, pitch, amps


def game_wave_reader():
    key = "wave_reader"
    hero("📈 WaveReader", "Read the sound — find the loudest syllable.")
    stat_pills()
    bump_round(key)
    ss = st.session_state

    tier = st.radio("Difficulty", ["Easy (2 syllables)", "Hard (4+ syllables)"],
                    horizontal=True, key="wr_tier")
    n = 2 if tier.startswith("Easy") else 5

    rnd = ss.rounds[key]
    seed = rnd * 7 + n
    peak = (rnd * 3 + 1) % n
    t, sig, pitch, amps = synth_waveform(n, peak, seed)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 4), sharex=True)
    fig.patch.set_alpha(0)
    for ax in (ax1, ax2):
        ax.set_facecolor("#0e1526")
        ax.tick_params(colors="#93a4c9")
        for s in ax.spines.values():
            s.set_color("#33415c")

    ax1.plot(t, sig, color="#22d3ee", lw=1)
    ax1.fill_between(t, sig, color="#22d3ee", alpha=0.15)
    ax1.set_ylabel("Amplitude", color="#93a4c9")
    ax1.set_title("Intensity waveform", color="#e6edff", fontweight="bold")

    ax2.plot(t, pitch, color="#f472b6", lw=2)
    ax2.set_ylabel("Pitch (F0)", color="#93a4c9")
    ax2.set_xlabel("Syllable position", color="#93a4c9")
    for i in range(n):
        ax2.axvline(i, color="#33415c", ls=":", lw=0.7)
        ax2.text(i + 0.5, -0.05, f"σ{i+1}", ha="center", color="#93a4c9", fontsize=9)
    fig.tight_layout()
    st.pyplot(fig, use_container_width=True)
    plt.close(fig)

    opts = [f"Syllable σ{i+1}" for i in range(n)]
    mc_round(
        f"wr_{rnd % 6}_{n}",
        "Which syllable shows the **highest amplitude / pitch peak**?",
        opts, peak,
        f"The tallest peak is at **σ{peak+1}** — that's the stressed syllable.",
        "Waveform Recognition", 14,
    )


# --------------------------------------------------------------------------- #
#  GAME 5 — SubtextDecode
# --------------------------------------------------------------------------- #
SUBTEXT_ITEMS = [
    {"sentence": "Why am **I** the only one copying my cousin?",
     "opts": ["Why me and not someone else?",
              "Nobody else is doing this.",
              "Anyone else would be fine, but specifically him?",
              "Is copying even the right word?"],
     "ans": 0},
    {"sentence": "Why am I the **ONLY** one copying my cousin?",
     "opts": ["Why me specifically?",
              "Nobody else is doing this — just me.",
              "Why my cousin and not someone else?",
              "Should I be copying at all?"],
     "ans": 1},
    {"sentence": "Why am I copying **MY COUSIN**?",
     "opts": ["Why me and not others?",
              "Am I the only one?",
              "Anyone else would be fine, but specifically him?",
              "Why not just be original?"],
     "ans": 2},
]


def game_subtext_decode():
    key = "subtext_decode"
    hero("💬 SubtextDecode", "Same words, different stress, new meaning.")
    stat_pills()
    bump_round(key)

    idx = st.session_state.rounds[key] % len(SUBTEXT_ITEMS)
    item = SUBTEXT_ITEMS[idx]
    st.markdown("### What does the stressed word imply?")
    st.markdown(f"> *{item['sentence']}*", unsafe_allow_html=True)

    mc_round(
        f"sd_{idx}", "Pick the implied meaning:",
        item["opts"], item["ans"],
        "Stress steers the *contrast* the speaker intends.",
        "Contextual Subtext", 16,
    )


# --------------------------------------------------------------------------- #
#  GAME 6 — ToneSync
# --------------------------------------------------------------------------- #
TONE_ITEMS = [
    {"phrase": "a CUP of TEA", "pattern": [0, 1, 0, 1],
     "labels": ["da-DA-da-DA", "DA-da-DA-da", "da-da-DA-DA", "DA-DA-da-da"], "ans": 0},
    {"phrase": "TELL me MORE", "pattern": [1, 0, 1],
     "labels": ["da-DA-da", "DA-da-DA", "da-da-DA", "DA-DA-da"], "ans": 1},
    {"phrase": "I will GO", "pattern": [0, 0, 1],
     "labels": ["DA-da-da", "da-DA-da", "da-da-DA", "DA-da-DA"], "ans": 2},
]


def game_tone_sync():
    key = "tone_sync"
    hero("🎵 ToneSync", "Match the spoken rhythm to its meter.")
    stat_pills()
    bump_round(key)

    idx = st.session_state.rounds[key] % len(TONE_ITEMS)
    item = TONE_ITEMS[idx]
    st.markdown(f"### Reference phrase: **“{item['phrase']}”**")
    beat_pattern(item["pattern"])
    st.caption("▶️ Play the synthetic rhythm cue, then pick the matching meter.")
    st.audio(rhythm_wav_bytes(item["pattern"]), format="audio/wav")

    mc_round(
        f"ts_{idx}", "Which meter matches the rhythm?",
        item["labels"], item["ans"],
        f"“{item['phrase']}” follows **{item['labels'][item['ans']]}**.",
        "Audio Cadence", 14,
    )


# --------------------------------------------------------------------------- #
#  GAME 7 — VocalMirror
# --------------------------------------------------------------------------- #
VOCAL_TASKS = {
    "Easy (single word)": "photography",
    "Medium (sentence)": "I bought a red car yesterday.",
    "Hard (paragraph)": ("The committee will present the record tomorrow, "
                          "and we should conduct the review before we object."),
}


def game_vocal_mirror():
    key = "vocal_mirror"
    hero("🪞 VocalMirror", "Shape the sound — record & get feedback.")
    stat_pills()
    bump_round(key)
    ss = st.session_state

    tier = st.radio("Difficulty", list(VOCAL_TASKS.keys()), horizontal=True, key="vm_tier")
    target = VOCAL_TASKS[tier]
    st.markdown(f"### 🎙️ Say this aloud:")
    st.markdown(f"> **{target}**")

    st.caption("Record with your mic (or upload a clip). We'll simulate a prosody analysis.")
    tab_rec, tab_up = st.tabs(["🎤 Record", "📁 Upload"])
    got_audio = False
    with tab_rec:
        try:
            audio = st.audio_input("Record your attempt")
            got_audio = audio is not None
        except Exception:
            st.info("Your Streamlit build lacks `st.audio_input` — use the Upload tab.")
    with tab_up:
        up = st.file_uploader("Upload a .wav/.mp3", type=["wav", "mp3", "m4a"])
        got_audio = got_audio or (up is not None)

    st.write("")
    if st.button("🔬 Analyze My Prosody", use_container_width=True):
        # Deterministic-but-varied simulated scores keyed to attempt count + tier.
        seed = ss.rounds[key] * 13 + len(target)
        rng = np.random.default_rng(seed)
        base = 62 + (0 if tier.startswith("Hard") else 12 if tier.startswith("Medium") else 20)
        pitch = int(np.clip(base + rng.integers(-8, 15), 40, 99))
        stress = int(np.clip(base + rng.integers(-10, 18), 40, 99))
        rhythm = int(np.clip(base + rng.integers(-12, 16), 40, 99))
        overall = int(np.mean([pitch, stress, rhythm]))

        c1, c2, c3 = st.columns(3)
        c1.metric("Pitch Stability", f"{pitch}%")
        c2.metric("Stress Accuracy", f"{stress}%")
        c3.metric("Rhythm Flow", f"{rhythm}%")
        st.progress(overall / 100, text=f"Overall articulation: {overall}%")

        tips = []
        if stress < 75:
            tips.append("Lengthen the vowel in stressed syllables — make them ~1.5× longer.")
        if pitch < 75:
            tips.append("Add a clear pitch rise on the stressed syllable, then let it fall.")
        if rhythm < 75:
            tips.append("Compress function words (a, the, to) so content words land on the beat.")
        if not tips:
            tips.append("Excellent control — try the next difficulty tier!")
        tips.append("Record again and aim to beat your last overall score.")

        st.markdown("#### 🎯 Actionable tips")
        for t in tips:
            st.markdown(f"<div class='lw-tip'>💡 {t}</div>", unsafe_allow_html=True)

        award("Articulation & Flow", overall >= 65, 20, delta_score=overall // 4)
        ss.rounds_bump = True
        if overall >= 65:
            st.success(f"🎉 +20 XP! Articulation score {overall}% recorded on your Mastery Web.")
        else:
            st.warning("Keep practicing — score logged. Try again for XP!")
        if not got_audio:
            st.caption("ℹ️ Demo used a simulated sample (no audio detected). "
                       "Record or upload for a live attempt.")


# --------------------------------------------------------------------------- #
#  Mastery Web (radar) + finish screen
# --------------------------------------------------------------------------- #
def page_mastery():
    hero("🕸️ Mastery Web", "Your prosody profile across all seven competencies.")
    stat_pills()
    ss = st.session_state

    values = [ss.scores[c] for c in COMPETENCIES]
    # close the loop for the radar
    theta = COMPETENCIES + [COMPETENCIES[0]]
    r = values + [values[0]]

    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=r, theta=theta, fill="toself",
        name="You",
        line=dict(color="#22d3ee", width=3),
        fillcolor="rgba(34,211,238,0.25)",
    ))
    fig.add_trace(go.Scatterpolar(
        r=[80] * len(theta), theta=theta,
        name="Mastery target",
        line=dict(color="#fde047", width=1, dash="dot"),
    ))
    fig.update_layout(
        polar=dict(
            bgcolor="rgba(0,0,0,0)",
            radialaxis=dict(range=[0, 100], showline=False,
                            gridcolor="#33415c", tickfont=dict(color="#93a4c9")),
            angularaxis=dict(tickfont=dict(color="#e6edff", size=12),
                             gridcolor="#33415c"),
        ),
        showlegend=True,
        legend=dict(font=dict(color="#e6edff")),
        paper_bgcolor="rgba(0,0,0,0)",
        margin=dict(l=40, r=40, t=30, b=30),
        height=460,
    )

    left, right = st.columns([3, 2])
    with left:
        st.plotly_chart(fig, use_container_width=True)

    with right:
        code, name, avg = fluency_band()
        st.markdown("### 📊 Summary")
        st.metric("Fluency Index", f"{code} · {name}", f"{int(avg)}% avg mastery")
        st.metric("Total XP", ss.xp)
        st.metric("Best Streak", f"🔥 {ss.best_streak}")

        # personalized recommendation from lowest competency
        lowest_comp = min(COMPETENCIES, key=lambda c: ss.scores[c])
        game_for_comp = {g[4]: (g[2], g[1]) for g in GAMES}
        gname, gemoji = game_for_comp[lowest_comp]
        st.markdown("### 🎯 Recommended focus")
        st.markdown(
            f"<div class='lw-tip'>{gemoji} Your lowest area is <b>{lowest_comp}</b> "
            f"({ss.scores[lowest_comp]}%). Focus on <b>{gname}</b> to level it up.</div>",
            unsafe_allow_html=True,
        )
        strongest = max(COMPETENCIES, key=lambda c: ss.scores[c])
        st.markdown(
            f"<div class='lw-tip'>🏅 Strongest: <b>{strongest}</b> "
            f"({ss.scores[strongest]}%). Nice work!</div>",
            unsafe_allow_html=True,
        )

    st.divider()
    st.markdown("### 🧩 Competency breakdown")
    cols = st.columns(len(COMPETENCIES))
    for i, c in enumerate(COMPETENCIES):
        with cols[i]:
            st.markdown(f"**{c}**")
            st.progress(ss.scores[c] / 100, text=f"{ss.scores[c]}%")


# --------------------------------------------------------------------------- #
#  Router
# --------------------------------------------------------------------------- #
GAME_PAGES = {
    "stress_matrix": game_stress_matrix,
    "cadence_pulse": game_cadence_pulse,
    "shift_shift": game_shift_shift,
    "wave_reader": game_wave_reader,
    "subtext_decode": game_subtext_decode,
    "tone_sync": game_tone_sync,
    "vocal_mirror": game_vocal_mirror,
}


def render_game_by_nav(nav):
    for key, emoji, title, sub, comp, xp in GAMES:
        if nav == f"{emoji} {title}":
            if key not in st.session_state.unlocked:
                hero(f"{emoji} {title}", "🔒 Locked")
                st.warning("This game is locked. Complete earlier levels or use "
                           "**Skip to Demo Mode** in the sidebar.")
                return True
            GAME_PAGES[key]()
            return True
    return False


def main():
    inject_css()
    init_state()
    sidebar()

    nav = st.session_state.nav
    if nav == "Placement Test":
        page_placement()
    elif nav == "Game Hub":
        page_hub()
    elif nav == "🕸️ Mastery Web":
        page_mastery()
    else:
        if not render_game_by_nav(nav):
            page_hub()


if __name__ == "__main__":
    main()
