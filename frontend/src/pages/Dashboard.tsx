import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, Target, Layers } from "lucide-react";
import { games } from "../data";
import { Button } from "../components/Button";
import { Bar } from "../components/Bar";
import { Shell } from "../components/Shell";
import { Radar } from "../components/Radar";
import { GameCard } from "../components/GameCard";
import { useProgress } from "../state/ProgressProvider";

export function Dashboard() {
    const { progress } = useProgress();
    const { user } = useAuth0();
    useEffect(() => {
        if (window.location.hash)
            document.getElementById("path")?.scrollIntoView({ behavior: "smooth" });
    }, [useLocation().hash]);
    return (
        <Shell>
            <div className="page-heading compact">
                <div>
                    <h1>
                        Find your rhythm, {user?.given_name || user?.name || "learner"} <span className="hello">✦</span>
                    </h1>
                </div>
                <span className="level-badge">
                    <Layers size={15} />
                    {progress.placed ? progress.level : "Intermediate"} · Level 3
                </span>
            </div>
            <div className="dashboard-layout">
                <div className="dashboard-primary">
                    <section id="path" className="path-section">
                        <div className="section-heading">
                            <div>
                                <h2>Practice games</h2>
                            </div>
                        </div>
                        <div className="game-grid game-grid-2x2">
                            {games.map((g, i) => (
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
                    </section>
                </div>
                <aside className="right-column">
                    <section className="panel goal-panel">
                        <div className="section-heading">
                            <h3>Today's goal</h3>
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
                </aside>
            </div>
        </Shell>
    );
}
