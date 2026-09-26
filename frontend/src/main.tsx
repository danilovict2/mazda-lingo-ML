import React, {
    useState,
    useEffect,
    useRef,
    createContext,
    useContext,
} from "react";
import { createRoot } from "react-dom/client";
import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    useParams,
    useLocation,
    Navigate,
} from "react-router-dom";
import {
    AudioLines,
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    ChartNoAxesCombined,
    Check,
    ChevronRight,
    Clock,
    Flame,
    Headphones,
    House,
    Lock,
    Mic,
    Play,
    Search,
    Sparkles,
    Target,
    Trophy,
    Volume2,
    X,
    Zap,
    RotateCcw,
    Square,
    Menu,
    Layers,
    Footprints,
} from "lucide-react";
import {
    games,
    questions,
    placement,
    skills,
    scores,
    initialProgress,
    type Progress,
    type Question,
} from "./data";
import { api, type Analysis } from "./api/client";
import "./styles.css";
const Context = createContext<{
    progress: Progress;
    setProgress: React.Dispatch<React.SetStateAction<Progress>>;
}>({ progress: initialProgress, setProgress: () => { } });
const useProgress = () => useContext(Context);
function Logo() {
    return (
        <Link to="/" className="logo">
            <span className="logo-mark">
                <AudioLines size={25} />
            </span>
            cadence<span className="logo-dot">.</span>
        </Link>
    );
}
function Button({
    children,
    to,
    onClick,
    secondary = false,
    disabled = false,
}: {
    children: React.ReactNode;
    to?: string;
    onClick?: () => void;
    secondary?: boolean;
    disabled?: boolean;
}) {
    const cls = `button ${secondary ? "secondary" : ""}`;
    return to ? (
        <Link className={cls} to={to}>
            {children}
        </Link>
    ) : (
        <button className={cls} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    );
}
function Bar({ value }: { value: number }) {
    return (
        <div className="progress-track">
            <span style={{ width: `${Math.min(100, value)}%` }} />
        </div>
    );
}
function Wave({
    active = false,
    stress = 1,
    compact = false,
    groups = 4,
}: {
    active?: boolean;
    stress?: number;
    compact?: boolean;
    groups?: number;
}) {
    return (
        <div
            className={`wave ${active ? "playing" : ""} ${compact ? "compact" : ""}`}
            aria-hidden="true"
        >
            {Array.from({ length: compact ? 37 : 73 }, (_, i) => {
                const n = compact ? 37 : 73;
                const group = Math.floor(i / (n / groups));
                const h =
                    (Math.abs(Math.sin(i * 1.72)) * 0.65 + 0.35) *
                    (group === stress ? 90 : 30) +
                    8;
                return (
                    <i
                        key={i}
                        style={{ height: `${h}%`, animationDelay: `${i * 23}ms` }}
                    />
                );
            })}
        </div>
    );
}
function AudioButton({ text }: { text: string }) {
    const [playing, setPlaying] = useState(false);
    const [message, setMessage] = useState("");
    useEffect(
        () => () => {
            window.speechSynthesis?.cancel();
        },
        [],
    );
    function play() {
        if (!("speechSynthesis" in window)) {
            setMessage("Audio unavailable. Follow the highlighted stress pattern.");
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replaceAll("**", ""));
        utterance.lang = "en-US";
        utterance.rate = 0.83;
        utterance.onend = () => setPlaying(false);
        utterance.onerror = () => {
            setPlaying(false);
            setMessage("Audio unavailable in this browser.");
        };
        setPlaying(true);
        window.speechSynthesis.speak(utterance);
    }
    return (
        <span className="audio-wrap">
            <button
                className="audio-button"
                onClick={play}
                aria-label="Play reference pronunciation"
            >
                {playing ? <AudioLines size={18} /> : <Volume2 size={18} />}{" "}
                {playing ? "Playing…" : "Listen"}{" "}
            </button>
            {message && <small>{message}</small>}
        </span>
    );
}
function Emphasis({ text }: { text: string }) {
    return (
        <>
            {text
                .split("**")
                .map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part))}
        </>
    );
}
function GameIcon({ id, size = 27 }: { id: string; size?: number }) {
    const Icon =
        (
            {
                "stress-steps": Footprints,
                "rhythm-echo": Headphones,
                "stress-twins": Layers,
                soundprint: AudioLines,
                "stress-detective": Search,
                "rhythm-match": ChartNoAxesCombined,
                "shape-your-sound": Mic,
            } as Record<string, typeof Mic>
        )[id] || AudioLines;
    return <Icon size={size} />;
}
function Shell({ children }: { children: React.ReactNode }) {
    const { progress, setProgress } = useProgress();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    return (
        <div className="app-shell">
            <aside className={`sidebar ${open ? "open" : ""}`}>
                <Logo />
                <div className="workspace-label">YOUR PRACTICE SPACE</div>
                <nav>
                    {[
                        { to: "/dashboard", icon: House, label: "Overview" },
                        { to: "/dashboard#path", icon: BookOpen, label: "Learning path" },
                        {
                            to: "/progress",
                            icon: ChartNoAxesCombined,
                            label: "Speech profile",
                        },
                    ].map((item) => (
                        <Link
                            onClick={() => setOpen(false)}
                            key={item.label}
                            to={item.to}
                            className={
                                location.pathname + location.hash === item.to ? "active" : ""
                            }
                        >
                            <item.icon size={20} />
                            {item.label}
                            {item.label === "Learning path" && (
                                <span className="nav-count">7</span>
                            )}
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-tip">
                    <div className="mini-orbit">
                        <AudioLines size={26} />
                    </div>
                    <h4>
                        A little practice.
                        <br />A big difference.
                    </h4>
                    <p>Five minutes today, a more confident you tomorrow.</p>
                    <Link to="/game/shape-your-sound">
                        Find your voice <ArrowUpRight size={15} />
                    </Link>
                </div>
                <div className="sidebar-bottom">
                    <span className="demo-pill">
                        <i /> DEMO MODE
                    </span>
                    <button
                        className="reset"
                        onClick={() => {
                            if (window.confirm("Reset all demo progress?")) {
                                setProgress(initialProgress);
                                window.location.href = "/";
                            }
                        }}
                    >
                        <RotateCcw size={14} />
                        Reset demo
                    </button>
                    <div className="user">
                        <span className="avatar">JD</span>
                        <div>
                            <strong>Jamie Davis</strong>
                            <small>Your voice, in progress</small>
                        </div>
                        <span className="online-dot" />
                    </div>
                </div>
            </aside>
            <div className="main-shell">
                <header className="topbar">
                    <button
                        className="mobile-menu icon-button"
                        onClick={() => setOpen(!open)}
                        aria-label="Toggle navigation"
                    >
                        <Menu />
                    </button>
                    <span className="breadcrumb">
                        Your workspace <ChevronRight size={14} />{" "}
                        <strong>
                            {location.pathname === "/progress"
                                ? "Speech profile"
                                : location.pathname.startsWith("/game")
                                    ? "Practice studio"
                                    : "Overview"}
                        </strong>
                    </span>
                    <div className="top-stats">
                        <span>
                            <Flame size={18} className="orange" /> 7 <small>day streak</small>
                        </span>
                        <span>
                            <Zap size={18} className="violet" /> {progress.xp}{" "}
                            <small>XP</small>
                        </span>
                        <span className="avatar small">JD</span>
                    </div>
                </header>
                <main>{children}</main>
                <footer>
                    Made for your voice. Built for your confidence.
                    <span>cadence © 2026</span>
                </footer>
            </div>
        </div>
    );
}
function Radar({ large = false }: { large?: boolean }) {
    const { progress } = useProgress();
    const gain = progress.completed.length * 2;
    const center = 160,
        r = 108;
    const point = (i: number, v: number) => {
        const a = (i * Math.PI * 2) / 7 - Math.PI / 2;
        return `${center + (Math.cos(a) * r * v) / 100},${center + (Math.sin(a) * r * v) / 100}`;
    };
    return (
        <svg
            className={`radar ${large ? "large" : ""}`}
            viewBox="0 0 320 320"
            role="img"
            aria-label={`Speech profile: ${skills.map((s, i) => `${s} ${Math.min(99, scores[i] + gain)}`).join(", ")}`}
        >
            <g>
                {[25, 50, 75, 100].map((v) => (
                    <polygon
                        key={v}
                        points={skills.map((_, i) => point(i, v)).join(" ")}
                        fill="none"
                        stroke="#e7e4ef"
                    />
                ))}
                {skills.map((_, i) => (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={point(i, 100).split(",")[0]}
                        y2={point(i, 100).split(",")[1]}
                        stroke="#e7e4ef"
                    />
                ))}
                <polygon
                    points={scores.map((s, i) => point(i, s - 15)).join(" ")}
                    fill="#cfc9e620"
                    stroke="#c4bddb"
                    strokeDasharray="4 4"
                />
                <polygon
                    points={scores
                        .map((s, i) => point(i, Math.min(99, s + gain)))
                        .join(" ")}
                    fill="#8b73df35"
                    stroke="#8365d6"
                    strokeWidth="2.3"
                />
                {scores.map((s, i) => (
                    <circle
                        key={i}
                        cx={point(i, Math.min(99, s + gain)).split(",")[0]}
                        cy={point(i, Math.min(99, s + gain)).split(",")[1]}
                        r="3.2"
                        fill="#8365d6"
                    />
                ))}
                {skills.map((s, i) => (
                    <text
                        key={s}
                        x={point(i, 125).split(",")[0]}
                        y={point(i, 125).split(",")[1]}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#797589"
                        fontSize="9"
                    >
                        {s}
                    </text>
                ))}
            </g>
        </svg>
    );
}
function Landing() {
    return (
        <div className="landing">
            <header>
                <Logo />
                <nav>
                    <a href="#how">How it works</a>
                    <Link to="/progress">The speech profile</Link>
                    <Link to="/dashboard" className="text-link">
                        Explore demo <ArrowUpRight size={16} />
                    </Link>
                </nav>
            </header>
            <section className="landing-hero">
                <div>
                    <span className="eyebrow">
                        <span className="tiny-dot" /> A NEW WAY TO FIND YOUR VOICE
                    </span>
                    <h1>
                        Good English.
                        <br />
                        <span>Great rhythm.</span>
                    </h1>
                    <p>
                        It’s not just what you say. It’s how you say it.
                        <br />
                        Find the stress, feel the rhythm, and speak English with a little
                        more confidence.
                    </p>
                    <div className="actions">
                        <Button to="/placement">
                            Find my starting level <ArrowRight size={18} />
                        </Button>
                        <Button to="/dashboard" secondary>
                            Explore the demo
                        </Button>
                    </div>
                    <div className="landing-note">
                        <Check size={15} /> 2-minute placement <span>•</span> No account
                        needed <span>•</span> Your pace
                    </div>
                </div>
                <div className="hero-art">
                    <div className="art-top">
                        <span>
                            <i /> YOUR VOICE HAS A RHYTHM
                        </span>
                        <AudioLines size={22} />
                    </div>
                    <div className="art-sentence">
                        Make yourself
                        <br />
                        <em>heard.</em>
                    </div>
                    <Wave active />
                    <div className="art-bottom">
                        <span>Clarity meets confidence.</span>
                        <span className="play-circle">
                            <Play size={17} fill="currentColor" />
                        </span>
                    </div>
                    <div className="floating-note">
                        <span className="check-circle">
                            <Check size={17} />
                        </span>
                        <div>
                            <strong>That’s your rhythm.</strong>
                            <small>One small practice. One step forward.</small>
                        </div>
                    </div>
                </div>
            </section>
            <section id="how" className="landing-features">
                {[
                    {
                        n: "01",
                        title: "Find your starting point",
                        text: "A quick check-in meets you where your English is today.",
                    },
                    {
                        n: "02",
                        title: "Play with your pronunciation",
                        text: "Seven bite-sized games. Real conversation. Instant insight.",
                    },
                    {
                        n: "03",
                        title: "See your voice grow",
                        text: "Your personal speech profile makes every little win visible.",
                    },
                ].map((f) => (
                    <div key={f.n}>
                        <span>{f.n}</span>
                        <h3>{f.title}</h3>
                        <p>{f.text}</p>
                    </div>
                ))}
            </section>
            <div className="landing-footer">
                <AudioLines size={18} /> Small steps. Stronger speech.
            </div>
        </div>
    );
}
function Dashboard() {
    const { progress } = useProgress();
    useEffect(() => {
        if (window.location.hash)
            document.getElementById("path")?.scrollIntoView({ behavior: "smooth" });
    }, [useLocation().hash]);
    return (
        <Shell>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">A LITTLE BETTER, EVERY DAY</span>
                    <h1>
                        Find your rhythm, Jamie <span className="hello">✦</span>
                    </h1>
                    <p>Your next confident conversation starts here.</p>
                </div>
                <span className="level-badge">
                    <Layers size={15} />
                    {progress.placed ? progress.level : "Intermediate"} · Level 3
                </span>
            </div>
            <div className="dashboard-layout">
                <div className="dashboard-primary">
                    <section className="continue-card">
                        <div>
                            <span className="eyebrow">YOUR NEXT SMALL WIN</span>
                            <h2>
                                Same words.
                                <br />
                                <span>A whole new meaning.</span>
                            </h2>
                            <p>
                                Discover what a little emphasis can say.
                                <br />
                                Your next stop: Stress Detective.
                            </p>
                            <Button to="/game/stress-detective">
                                Let’s practice <ArrowRight size={17} />
                            </Button>
                            <div className="hero-meta">
                                <Clock size={13} /> 5 min <span>•</span> +150 XP <span>•</span>{" "}
                                Recommended for you
                            </div>
                        </div>
                        <div className="rhythm-orbit">
                            <div className="orbit ring-one" />
                            <div className="orbit ring-two" />
                            <div className="orbit ring-three" />
                            <div className="orbit-core">
                                <AudioLines size={59} strokeWidth={1.5} />
                            </div>
                            <span className="orbit-spark spark-one">✦</span>
                            <span className="orbit-spark spark-two">✦</span>
                            <span className="orbit-word word-one">say it.</span>
                            <span className="orbit-word word-two">mean it.</span>
                        </div>
                    </section>
                    <div className="metric-row">
                        <div>
                            <span className="metric-icon peach">
                                <Flame size={20} />
                            </span>
                            <div>
                                <strong>
                                    7 <small>days</small>
                                </strong>
                                <p>On a roll. Keep it going!</p>
                            </div>
                        </div>
                        <div>
                            <span className="metric-icon purple">
                                <Zap size={20} />
                            </span>
                            <div>
                                <strong>
                                    {progress.xp} <small>XP</small>
                                </strong>
                                <p>A little effort, adding up.</p>
                            </div>
                        </div>
                        <div>
                            <span className="metric-icon green">
                                <Check size={20} />
                            </span>
                            <div>
                                <strong>
                                    {12 + progress.completed.length} <small>lessons</small>
                                </strong>
                                <p>More confidence, unlocked.</p>
                            </div>
                        </div>
                    </div>
                    <section id="path" className="path-section">
                        <div className="section-heading">
                            <div>
                                <h2>Your learning path</h2>
                                <p>One beat at a time. Every step counts.</p>
                            </div>
                            <span className="subtle-label">7 practice games</span>
                        </div>
                        <div className="unit-heading">
                            <span className="unit-number">01</span>
                            <div>
                                <strong>Build your foundation</strong>
                                <p>Get comfortable with the beats of English</p>
                            </div>
                            <span className="unit-status">
                                {2 +
                                    progress.completed.filter((x) =>
                                        ["stress-steps", "rhythm-echo", "stress-twins"].includes(x),
                                    ).length}
                                /5 milestones
                            </span>
                        </div>
                        <div className="game-grid">
                            {games.slice(0, 3).map((g, i) => (
                                <GameCard
                                    key={g.id}
                                    game={g}
                                    status={
                                        progress.completed.includes(g.id)
                                            ? "Completed"
                                            : i === 0
                                                ? "Start here"
                                                : "Ready to play"
                                    }
                                />
                            ))}
                        </div>
                        <div className="unit-heading second">
                            <span className="unit-number lavender">02</span>
                            <div>
                                <strong>Make it sound like you</strong>
                                <p>Turn understanding into natural expression</p>
                            </div>
                            <span className="unit-status purple-text">YOUR NEXT CHAPTER</span>
                        </div>
                        <div className="game-grid">
                            {games.slice(3, 6).map((g) => (
                                <GameCard
                                    key={g.id}
                                    game={g}
                                    status={
                                        progress.completed.includes(g.id)
                                            ? "Completed"
                                            : g.id === "rhythm-match" &&
                                                !progress.completed.length &&
                                                progress.level !== "Advanced"
                                                ? "Locked"
                                                : "Ready to play"
                                    }
                                />
                            ))}
                        </div>
                        <Link className="studio-strip" to="/game/shape-your-sound">
                            <span className="game-icon purple">
                                <Mic size={23} />
                            </span>
                            <div>
                                <strong>Your voice. Your personal studio.</strong>
                                <p>Try Shape Your Sound and see your speech come to life.</p>
                            </div>
                            <span className="new-badge">TRY THE STUDIO</span>
                            <ArrowUpRight size={20} />
                        </Link>
                    </section>
                </div>
                <aside className="right-column">
                    <section className="panel goal-panel">
                        <div className="section-heading">
                            <h3>Today’s goal</h3>
                            <Target size={19} className="muted" />
                        </div>
                        <div className="goal-total">
                            <strong>
                                {Math.min(100, 40 + progress.completed.length * 30)}
                            </strong>
                            <span>/ 100 XP</span>
                            <span className="goal-emoji">✦</span>
                        </div>
                        <Bar value={40 + progress.completed.length * 30} />
                        <p>
                            {progress.completed.length >= 2
                                ? "Goal reached. Look at you go!"
                                : "A short lesson. A step forward."}
                        </p>
                        <div className="week">
                            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                                <div key={i}>
                                    <span className={i < 5 ? "done" : i === 5 ? "today" : ""}>
                                        {i < 5 ? <Check size={12} /> : d}
                                    </span>
                                    <small>{d}</small>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="panel profile-preview">
                        <div className="section-heading">
                            <h3>Your speech, visualized</h3>
                            <span className="live-dot" />
                        </div>
                        <p>A little stronger in every direction.</p>
                        <Radar />
                        <div className="chart-legend">
                            <span>
                                <i />
                                Now
                            </span>
                            <span>
                                <i />
                                Last week
                            </span>
                        </div>
                        <Link to="/progress" className="panel-link">
                            Explore your speech profile <ArrowUpRight size={16} />
                        </Link>
                    </section>
                    <section className="insight-card">
                        <span className="insight-icon">
                            <Sparkles size={19} />
                        </span>
                        <span className="eyebrow">LOOK AT YOU GROW</span>
                        <h3>
                            Your ear for stress
                            <br />
                            is getting sharper.
                        </h3>
                        <p>
                            Stress recognition is your strongest skill. Let’s turn that
                            listening into speaking.
                        </p>
                        <div>
                            <strong>+12%</strong>
                            <span>recognition this week</span>
                        </div>
                    </section>
                    <div className="quote">
                        “Confidence isn’t a perfect accent.
                        <br />
                        It’s making yourself understood.”<span>THE CADENCE MINDSET</span>
                    </div>
                </aside>
            </div>
        </Shell>
    );
}
function GameCard({
    game: g,
    status,
}: {
    game: (typeof games)[number];
    status: string;
}) {
    const locked = status === "Locked";
    return (
        <Link
            to={locked ? "#path" : `/game/${g.id}`}
            aria-disabled={locked}
            onClick={(e) => {
                if (locked) e.preventDefault();
            }}
            className={`game-card ${locked ? "locked" : ""}`}
        >
            <div className="card-top">
                <span className={`game-icon ${g.color}`}>
                    <GameIcon id={g.id} />
                </span>
                {status === "Completed" ? (
                    <Check size={18} className="green-text" />
                ) : locked ? (
                    <Lock size={15} />
                ) : (
                    <ArrowUpRight size={17} />
                )}
            </div>
            <span className="game-tag">{g.tag}</span>
            <h3>{g.name}</h3>
            <p>{g.subtitle}</p>
            <div className="card-bottom">
                <span>
                    <Clock size={12} />
                    {g.time} min
                </span>
                <span>
                    {locked
                        ? "Complete a lesson"
                        : status === "Completed"
                            ? "Play again"
                            : "+120 XP"}
                </span>
            </div>
        </Link>
    );
}
function QuestionView({
    q,
    selected,
    onSelect,
}: {
    q: Question;
    selected: number | null;
    onSelect: (i: number) => void;
}) {
    return (
        <>
            <div className="question-prompt">{q.prompt}</div>
            <div className="answer-grid">
                {q.options.map((option, i) => (
                    <button
                        key={option}
                        disabled={selected !== null}
                        onClick={() => onSelect(i)}
                        className={`answer-option ${selected !== null && i === q.correct ? "correct" : ""} ${selected === i && i !== q.correct ? "incorrect" : ""}`}
                    >
                        <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
                        <span>{option}</span>
                        {selected !== null && i === q.correct && <Check size={19} />}
                    </button>
                ))}
            </div>
            {selected !== null && (
                <div
                    role="status"
                    className={`feedback ${selected === q.correct ? "success" : "gentle"}`}
                >
                    <span className="feedback-icon">
                        {selected === q.correct ? (
                            <Check size={20} />
                        ) : (
                            <Headphones size={20} />
                        )}
                    </span>
                    <div>
                        <strong>
                            {selected === q.correct
                                ? "You found the beat! +30 XP"
                                : "Almost. Let’s listen a little closer."}
                        </strong>
                        <p>{q.explanation}</p>
                    </div>
                </div>
            )}
        </>
    );
}
function Placement() {
    const { setProgress } = useProgress();
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [correct, setCorrect] = useState(0);
    const [result, setResult] = useState("");
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");
    const q = placement[index];
    async function finish(skip = false) {
        setBusy(true);
        setApiError("");
        try {
            const r = await api.placement(skip ? 3 : correct, 5);
            setProgress((p) => ({ ...p, placed: true, level: r.level }));
            setResult(r.level);
        } catch {
            setApiError("Could not reach the API. Check that the server is running and try again.");
        } finally {
            setBusy(false);
        }
    }
    return (
        <div className="placement-page">
            <header>
                <Logo />
                <Link
                    to="/dashboard"
                    className="icon-button"
                    aria-label="Exit placement"
                >
                    <X />
                </Link>
            </header>
            {result ? (
                <div className="result-screen">
                    <div className="result-orb">
                        <Sparkles size={48} />
                    </div>
                    <span className="eyebrow">A GREAT PLACE TO BEGIN</span>
                    <h1>
                        You’ve got a feel
                        <br />
                        for the rhythm.
                    </h1>
                    <p>Your starting level</p>
                    <span className="big-level">{result}</span>
                    <div className="result-skills">
                        <div>
                            <span className="green-text">YOUR STRENGTHS</span>
                            <p>
                                <Check size={16} /> Word stress
                            </p>
                            <p>
                                <Check size={16} /> Rhythm recognition
                            </p>
                        </div>
                        <div>
                            <span className="purple-text">LET’S WORK ON</span>
                            <p>
                                <Target size={16} /> Sentence emphasis
                            </p>
                            <p>
                                <Target size={16} /> Contrastive stress
                            </p>
                        </div>
                    </div>
                    <Button to="/dashboard">
                        Meet your learning path <ArrowRight size={18} />
                    </Button>
                    <small>Your level is a starting point, not a limit.</small>
                </div>
            ) : (
                <div className="placement-content">
                    <span className="eyebrow">LET’S FIND YOUR STARTING POINT</span>
                    <div className="section-heading">
                        <h2>A quick rhythm check.</h2>
                        <span>{index + 1} / 5</span>
                    </div>
                    <Bar value={(index / 5) * 100} />
                    <div className="placement-question">
                        <AudioButton text={q.text} />
                        <h1>
                            <Emphasis text={q.text} />
                        </h1>
                    </div>
                    <QuestionView
                        q={q}
                        selected={selected}
                        onSelect={(i) => {
                            setSelected(i);
                            if (i === q.correct) setCorrect((c) => c + 1);
                        }}
                    />
                    {apiError && <p role="alert" className="notice">{apiError}</p>}
                    <div className="exercise-actions">
                        <button
                            className="text-button"
                            disabled={busy}
                            onClick={() => finish(true)}
                        >
                            Skip to demo result
                        </button>
                        <Button
                            disabled={selected === null || busy}
                            onClick={() => {
                                if (index === 4) finish();
                                else {
                                    setIndex((i) => i + 1);
                                    setSelected(null);
                                }
                            }}
                        >
                            {busy
                                ? "Finding your level…"
                                : index === 4
                                    ? "See my level"
                                    : "Continue"}
                            <ArrowRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
function Lesson() {
    const { id } = useParams();
    const { progress, setProgress } = useProgress();
    const game = games.find((g) => g.id === id);
    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [correct, setCorrect] = useState(0);
    const [done, setDone] = useState(false);
    const [earned, setEarned] = useState(0);
    const [difficulty, setDifficulty] = useState("Medium");
    const [busy, setBusy] = useState(false);
    const [apiError, setApiError] = useState("");
    if (!game) return <Navigate to="/dashboard" />;
    if (id === "shape-your-sound") return <Studio />;
    const source = questions[game.id];
    const list =
        difficulty === "Easy"
            ? [source[1], source[0], source[2], source[3]]
            : difficulty === "Hard"
                ? [...source].reverse()
                : source;
    const q = list[index];
    async function next() {
        if (index < list.length - 1) {
            setIndex((i) => i + 1);
            setSelected(null);
            return;
        }
        setBusy(true);
        setApiError("");
        try {
            const r = await api.session(game!.id, correct, list.length);
            setEarned(r.xp);
            setProgress((p) => ({
                ...p,
                xp: p.xp + r.xp,
                completed: Array.from(new Set([...p.completed, game!.id])),
                answers: p.answers + list.length,
                correct: p.correct + correct,
                sessions: [
                    {
                        name: game!.name,
                        accuracy: Math.round((correct / list.length) * 100),
                        date: new Date().toLocaleDateString(),
                    },
                    ...p.sessions,
                ].slice(0, 8),
            }));
            setDone(true);
        } catch {
            setApiError("Could not reach the API. Check that the server is running and try again.");
        } finally {
            setBusy(false);
        }
    }
    return (
        <Shell>
            {done ? (
                <Completion
                    xp={earned}
                    accuracy={Math.round((correct / list.length) * 100)}
                    name={game.name}
                />
            ) : (
                <div className="lesson-container">
                    <div className="section-heading">
                        <Link className="text-link" to="/dashboard">
                            <X size={19} /> Back to your path
                        </Link>
                        <span className="demo-pill">
                            PRACTICE · {difficulty.toUpperCase()}
                        </span>
                    </div>
                    <div className="lesson-heading">
                        <span className={`game-icon ${game.color}`}>
                            <GameIcon id={game.id} />
                        </span>
                        <div>
                            <h1>{game.name}</h1>
                            <p>{game.subtitle}</p>
                        </div>
                        <select
                            aria-label="Difficulty"
                            value={difficulty}
                            disabled={index > 0 || selected !== null}
                            onChange={(e) => {
                                setDifficulty(e.target.value);
                                setIndex(0);
                            }}
                        >
                            {["Easy", "Medium", "Hard"].map((d) => (
                                <option key={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div className="lesson-progress">
                        <Bar value={(index / list.length) * 100} />
                        <span>
                            {index + 1} of {list.length}
                        </span>
                    </div>
                    <section
                        className={`question-card ${id === "soundprint" ? "soundprint-card" : ""}`}
                    >
                        <div className="section-heading">
                            <span className="eyebrow">
                                {id === "soundprint"
                                    ? "READ THE SOUND"
                                    : id === "stress-detective"
                                        ? "LISTEN BETWEEN THE LINES"
                                        : "FIND THE STRONG BEAT"}
                            </span>
                            <AudioButton text={q.text} />
                        </div>
                        <h2 className="question-text">
                            <Emphasis text={q.text} />
                        </h2>
                        {id === "soundprint" && (
                            <div
                                className={`soundprint-visual difficulty-${difficulty.toLowerCase()}`}
                            >
                                <div className="wave-label">
                                    <span>SIMULATED SOUNDPRINT</span>
                                    <span>AMPLITUDE / TIME</span>
                                </div>
                                <Wave
                                    active
                                    stress={q.stress}
                                    groups={q.options[q.correct].split("-").length}
                                />
                                <div className="syllable-labels">
                                    {q.options[q.correct].split("-").map((s, i) => (
                                        <span key={i}>{s.toLowerCase()}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {id === "rhythm-match" && (
                            <div className="rhythm-beats">
                                {q.options[q.correct].split(" ").map((word, i) => (
                                    <i
                                        key={i}
                                        style={{
                                            transform: `scale(${word === word.toUpperCase() ? 1 : 0.4})`,
                                            animationDelay: `${i * 0.2}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                    <QuestionView
                        q={q}
                        selected={selected}
                        onSelect={(i) => {
                            setSelected(i);
                            if (i === q.correct) setCorrect((c) => c + 1);
                        }}
                    />
                    {apiError && <p role="alert" className="notice">{apiError}</p>}
                    <div className="exercise-actions">
                        <span className="muted">
                            <Sparkles size={15} /> Every attempt is progress.
                        </span>
                        <Button disabled={selected === null || busy} onClick={next}>
                            {busy
                                ? "Saving…"
                                : index === list.length - 1
                                    ? "Finish lesson"
                                    : "Next question"}{" "}
                            <ArrowRight size={17} />
                        </Button>
                    </div>
                    <p className="lesson-footnote">
                        {progress.completed.includes(game.id)
                            ? "Revisiting a lesson is how good habits become natural."
                            : "No pressure. You’re here to practice, not to be perfect."}
                    </p>
                </div>
            )}
        </Shell>
    );
}
function Completion({
    xp,
    accuracy,
    name,
}: {
    xp: number;
    accuracy: number;
    name: string;
}) {
    return (
        <div className="result-screen">
            <div className="result-orb">
                <Trophy size={49} />
            </div>
            <span className="eyebrow">ANOTHER STEP TOWARD CONFIDENT SPEECH</span>
            <h1>
                That’s a wrap.
                <br />
                <span className="purple-text">You found your rhythm.</span>
            </h1>
            <p>{name} · Lesson complete</p>
            <div className="completion-metrics">
                <div>
                    <Zap />
                    <strong>+{xp}</strong>
                    <span>XP earned</span>
                </div>
                <div>
                    <Target />
                    <strong>{accuracy}%</strong>
                    <span>Accuracy</span>
                </div>
                <div>
                    <AudioLines />
                    <strong>+2</strong>
                    <span>Demo profile growth</span>
                </div>
            </div>
            <p>New practice unlocked. Keep the momentum going.</p>
            <div className="actions">
                <Button to="/dashboard">
                    Continue learning <ArrowRight size={17} />
                </Button>
                <Button to="/progress" secondary>
                    View my progress
                </Button>
            </div>
        </div>
    );
}
function Studio() {
    const { setProgress } = useProgress();
    const [difficulty, setDifficulty] = useState("Medium");
    const [state, setState] = useState<
        "idle" | "recording" | "analyzing" | "result"
    >("idle");
    const [seconds, setSeconds] = useState(0);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [saved, setSaved] = useState(false);
    const [notice, setNotice] = useState("");
    const recorder = useRef<MediaRecorder | null>(null);
    const stream = useRef<MediaStream | null>(null);
    const [clip, setClip] = useState("");
    const mounted = useRef(true);
    const text =
        difficulty === "Easy"
            ? "photography"
            : difficulty === "Medium"
                ? "I actually thought you were coming tomorrow."
                : "I actually thought you were coming tomorrow. If I had known, I would have made us some coffee. Next time, let’s plan a little earlier.";
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            stream.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);
    useEffect(() => {
        if (state !== "recording") return;
        const interval = window.setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(interval);
    }, [state]);
    useEffect(
        () => () => {
            if (clip) URL.revokeObjectURL(clip);
        },
        [clip],
    );
    async function start(real = false) {
        setSeconds(0);
        setNotice("");
        setClip("");
        if (real) {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!mounted.current) {
                    s.getTracks().forEach((t) => t.stop());
                    return;
                }
                stream.current = s;
                const r = new MediaRecorder(s);
                const chunks: BlobPart[] = [];
                r.ondataavailable = (e) => chunks.push(e.data);
                r.onstop = () => {
                    if (mounted.current)
                        setClip(
                            URL.createObjectURL(new Blob(chunks, { type: r.mimeType })),
                        );
                    s.getTracks().forEach((t) => t.stop());
                };
                recorder.current = r;
                r.start();
            } catch {
                stream.current?.getTracks().forEach((t) => t.stop());
                setNotice(
                    "Microphone unavailable. Simulated recording is ready — you can still try the full experience.",
                );
            }
        }
        setState("recording");
    }
    async function finish() {
        recorder.current?.state === "recording" && recorder.current.stop();
        setState("analyzing");
        setNotice("");
        try {
            const [result] = await Promise.all([
                api.analyze(text, difficulty),
                new Promise((resolve) => setTimeout(resolve, 1500)),
            ]);
            if (mounted.current) {
                setAnalysis(result);
                setState("result");
            }
        } catch {
            if (mounted.current) {
                setNotice("Analysis failed. Check that the API server is running, then try Finish & analyze again.");
                setState("recording");
            }
        }
    }
    function save() {
        if (!analysis) return;
        setProgress((p) => ({
            ...p,
            xp: p.xp + 120,
            completed: Array.from(new Set([...p.completed, "shape-your-sound"])),
            sessions: [
                {
                    name: "Shape Your Sound",
                    accuracy: analysis.overallScore,
                    date: new Date().toLocaleDateString(),
                },
                ...p.sessions,
            ].slice(0, 8),
        }));
        setSaved(true);
    }
    return (
        <Shell>
            <div className="studio-container">
                <div className="page-heading">
                    <div>
                        <span className="eyebrow">YOUR PERSONAL SPEAKING STUDIO</span>
                        <h1>
                            Shape Your Sound<span className="purple-text">.</span>
                        </h1>
                        <p>Speak it. See it. Improve it.</p>
                    </div>
                    <span className="demo-pill">
                        <i /> SIMULATED AI ANALYSIS
                    </span>
                </div>
                <div className="studio-layout">
                    <section className="panel recording-panel">
                        <div className="difficulty-tabs">
                            {["Easy", "Medium", "Hard"].map((d, i) => (
                                <button
                                    disabled={state !== "idle"}
                                    className={difficulty === d ? "active" : ""}
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                >
                                    {d}
                                    <small>{["Words", "Sentences", "Paragraphs"][i]}</small>
                                </button>
                            ))}
                        </div>
                        <div className="section-heading">
                            <span className="eyebrow">MAKE THESE WORDS YOURS</span>
                            <AudioButton text={text} />
                        </div>
                        <h2 className="speaking-text">{text}</h2>
                        <p className="muted">
                            Let the important words stand out. Leave room to breathe.
                        </p>
                        <div className={`recording-zone ${state}`}>
                            <Wave
                                active={state === "recording" || state === "analyzing"}
                                compact
                            />
                            <button
                                className="mic-button"
                                disabled={state === "analyzing" || state === "result"}
                                onClick={() => (state === "recording" ? finish() : start())}
                                aria-label={
                                    state === "recording"
                                        ? "Finish simulated recording"
                                        : "Start simulated recording"
                                }
                            >
                                {state === "recording" ? (
                                    <Square size={25} fill="currentColor" />
                                ) : state === "analyzing" ? (
                                    <AudioLines size={31} />
                                ) : (
                                    <Mic size={31} />
                                )}
                            </button>
                            <strong>
                                {state === "recording"
                                    ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                                    : state === "analyzing"
                                        ? "Finding your rhythm…"
                                        : state === "result"
                                            ? "A little insight. A little growth."
                                            : "Ready when you are."}
                            </strong>
                            <p>
                                {state === "recording"
                                    ? "Speak naturally, then finish when you’re ready."
                                    : state === "analyzing"
                                        ? "Preparing your simulated speech profile."
                                        : "A safe space to try, repeat, and get better."}
                            </p>
                        </div>
                        {state === "idle" && (
                            <div className="recording-actions">
                                <Button onClick={() => start()}>
                                    Try demo recording <Mic size={17} />
                                </Button>
                                <button className="text-button" onClick={() => start(true)}>
                                    Use my microphone
                                </button>
                            </div>
                        )}
                        {state === "recording" && (
                            <Button onClick={finish}>
                                Finish & analyze <Square size={15} />
                            </Button>
                        )}
                        {state === "result" && (
                            <Button
                                secondary
                                onClick={() => {
                                    setState("idle");
                                    setSaved(false);
                                }}
                            >
                                Try another take <RotateCcw size={16} />
                            </Button>
                        )}
                        {notice && (
                            <p role="status" className="notice">
                                {notice}
                            </p>
                        )}
                        {clip && (
                            <audio aria-label="Your recorded practice" controls src={clip} />
                        )}
                        <small className="privacy-note">
                            Demo scores are illustrative. Microphone audio stays in your
                            browser.
                        </small>
                    </section>
                    <aside className="panel coaching-panel">
                        {state === "result" && analysis ? (
                            <>
                                <span className="eyebrow">YOUR SPEECH SNAPSHOT</span>
                                <div className="score-ring">
                                    <strong>
                                        {analysis.overallScore}
                                        <small>/ 100</small>
                                    </strong>
                                </div>
                                <h2>There’s confidence in your voice.</h2>
                                <p>Here’s where your next little win lives.</p>
                                {[
                                    { name: "Word stress", score: analysis.wordStress },
                                    { name: "Rhythm", score: analysis.rhythm },
                                    { name: "Clarity", score: analysis.clarity },
                                    { name: "Sentence emphasis", score: analysis.sentenceStress },
                                ].map((s) => (
                                    <div className="score-row" key={s.name}>
                                        <div>
                                            <span>{s.name}</span>
                                            <strong>{s.score}%</strong>
                                        </div>
                                        <Bar value={s.score} />
                                    </div>
                                ))}
                                <div className="coaching-notes">
                                    {analysis.feedback.map((f, i) => (
                                        <p key={f}>
                                            {i === 0 ? <Check size={17} /> : <Sparkles size={17} />}
                                            <span>{f}</span>
                                        </p>
                                    ))}
                                </div>
                                <Button onClick={save} disabled={saved}>
                                    {saved ? (
                                        <>
                                            <Check size={17} /> Saved · +120 XP
                                        </>
                                    ) : (
                                        <>
                                            Save my practice <ArrowRight size={17} />
                                        </>
                                    )}
                                </Button>
                                {saved && (
                                    <Link to="/progress" className="panel-link">
                                        View speech profile <ArrowUpRight size={17} />
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="game-icon purple">
                                    <Sparkles size={27} />
                                </span>
                                <h2>
                                    Meet your voice
                                    <br />
                                    with a little curiosity.
                                </h2>
                                <p>Your feedback will appear here after your practice.</p>
                                <div className="coaching-placeholder">
                                    {[
                                        "Word stress",
                                        "Natural rhythm",
                                        "Clarity",
                                        "Sentence emphasis",
                                    ].map((s) => (
                                        <div key={s}>
                                            <span>{s}</span>
                                            <div />
                                        </div>
                                    ))}
                                </div>
                                <div className="tip-box">
                                    <Headphones size={20} />
                                    <p>
                                        Listen to the example once. Then focus on expression, not
                                        perfection.
                                    </p>
                                </div>
                            </>
                        )}
                    </aside>
                </div>
            </div>
        </Shell>
    );
}
function Profile() {
    const { progress } = useProgress();
    const gain = progress.completed.length * 2;
    return (
        <Shell>
            <div className="page-heading">
                <div>
                    <span className="eyebrow">YOUR PROGRESS, MADE VISIBLE</span>
                    <h1>
                        Your Speech Profile<span className="purple-text">.</span>
                    </h1>
                    <p>A fuller picture of your voice. And how far it’s come.</p>
                </div>
                <span className="demo-pill">DEMO BASELINE + YOUR PRACTICE</span>
            </div>
            <div className="profile-metrics">
                {[
                    {
                        icon: Zap,
                        value: progress.xp,
                        label: "Total XP earned",
                        note: "+120 this week",
                    },
                    {
                        icon: BookOpen,
                        value: 12 + progress.completed.length,
                        label: "Lessons completed",
                        note: "Small steps, real progress",
                    },
                    {
                        icon: Target,
                        value: `${progress.answers ? Math.round((progress.correct / progress.answers) * 100) : 86}%`,
                        label: "Practice accuracy",
                        note: progress.answers
                            ? "From your answers"
                            : "Demo starting profile",
                    },
                    {
                        icon: Flame,
                        value: "7 days",
                        label: "Current streak",
                        note: "Your best kind of habit",
                    },
                ].map((m) => (
                    <div className="panel" key={m.label}>
                        <m.icon size={20} />
                        <strong>{m.value}</strong>
                        <span>{m.label}</span>
                        <small>{m.note}</small>
                    </div>
                ))}
            </div>
            <div className="profile-layout">
                <section className="panel radar-panel">
                    <div className="section-heading">
                        <div>
                            <h2>The shape of your speech</h2>
                            <p>Seven skills. One increasingly confident voice.</p>
                        </div>
                        <span className="improvement">+{8 + gain}% overall</span>
                    </div>
                    <Radar large />
                    <div className="chart-legend">
                        <span>
                            <i />
                            Your current profile
                        </span>
                        <span>
                            <i />
                            Previous profile
                        </span>
                    </div>
                    <div className="radar-summary">
                        <div>
                            <Trophy size={21} />
                            <span>
                                STRONGEST SKILL<strong>Stress recognition</strong>
                            </span>
                            <b>{Math.min(99, 90 + gain)}%</b>
                        </div>
                        <div>
                            <ChartNoAxesCombined size={21} />
                            <span>
                                BIGGEST IMPROVEMENT<strong>Sentence emphasis</strong>
                            </span>
                            <b>+{12 + gain}%</b>
                        </div>
                    </div>
                </section>
                <div>
                    <section className="panel skill-panel">
                        <h3>Your skills, a little closer</h3>
                        {skills.map((s, i) => (
                            <div className="score-row" key={s}>
                                <div>
                                    <span>{s}</span>
                                    <strong>
                                        {Math.min(99, scores[i] + gain)}{" "}
                                        <small>+{gain + 8 + i}</small>
                                    </strong>
                                </div>
                                <Bar value={scores[i] + gain} />
                            </div>
                        ))}
                    </section>
                    <section className="recommendation">
                        <span className="eyebrow">
                            <Sparkles size={16} /> YOUR NEXT SMALL WIN
                        </span>
                        <h2>
                            You hear the difference.
                            <br />
                            Now, make it heard.
                        </h2>
                        <p>
                            Your word-stress recognition is excellent. Spend your next session
                            exploring sentence emphasis in Stress Detective.
                        </p>
                        <Button to="/game/stress-detective">
                            Practice sentence emphasis <ArrowRight size={16} />
                        </Button>
                    </section>
                </div>
            </div>
            <section className="panel history">
                <div className="section-heading">
                    <h2>Your recent rhythm</h2>
                    <span className="subtle-label">One practice at a time</span>
                </div>
                {(progress.sessions.length
                    ? progress.sessions
                    : [
                        { name: "Stress Steps", accuracy: 90, date: "Demo · Yesterday" },
                        { name: "Rhythm Echo", accuracy: 80, date: "Demo · Yesterday" },
                        { name: "Stress Twins", accuracy: 88, date: "Demo · 2 days ago" },
                    ]
                ).map((s, i) => (
                    <div className="history-row" key={i}>
                        <span className="metric-icon purple">
                            <AudioLines size={18} />
                        </span>
                        <div>
                            <strong>{s.name}</strong>
                            <small>{s.date}</small>
                        </div>
                        <span>{s.accuracy}% accuracy</span>
                        <span className="green-text">
                            <Check size={15} /> Complete
                        </span>
                    </div>
                ))}
            </section>
        </Shell>
    );
}
function App() {
    const [progress, setProgress] = useState<Progress>(() => {
        try {
            const raw = localStorage.getItem("cadence-progress");
            if (raw) {
                const p = JSON.parse(raw);
                if (
                    typeof p.xp === "number" &&
                    Array.isArray(p.completed) &&
                    Array.isArray(p.sessions)
                )
                    return { ...initialProgress, ...p };
            }
        } catch { }
        return initialProgress;
    });
    useEffect(() => {
        try {
            localStorage.setItem("cadence-progress", JSON.stringify(progress));
        } catch { }
    }, [progress]);
    return (
        <Context.Provider value={{ progress, setProgress }}>
            <BrowserRouter>
                <ScrollTop />
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/placement" element={<Placement />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/game/:id" element={<LessonKey />} />
                    <Route path="/progress" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        </Context.Provider>
    );
}
function LessonKey() {
    const { id } = useParams();
    return <Lesson key={id} />;
}
function ScrollTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}
createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
