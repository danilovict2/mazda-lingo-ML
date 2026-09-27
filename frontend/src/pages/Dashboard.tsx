import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AudioLines, ArrowRight, ArrowUpRight, Check, Clock, Flame, Mic, Sparkles, Target, Zap, Layers } from "lucide-react";
import { games } from "../data";
import { Button } from "../components/Button";
import { Bar } from "../components/Bar";
import { Shell } from "../components/Shell";
import { Radar } from "../components/Radar";
import { GameCard } from "../components/GameCard";
import { useProgress } from "../state/ProgressProvider";

export function Dashboard() {
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
                                Your next stop: What do they mean?.
                            </p>
                            <Button to="/game/what-do-they-mean">
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
                                        ["stress-sort", "rhythm-match", "stress-twins"].includes(x),
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
