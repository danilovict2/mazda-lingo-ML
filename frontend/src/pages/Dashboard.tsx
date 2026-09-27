import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    AudioLines,
    ArrowRight,
    ArrowUpRight,
    Clock,
    Flame,
    Mic,
    Target,
    Zap,
    Layers,
    Check,
} from "lucide-react";
import { games } from "../data";
import { Button } from "../components/Button";
import { Bar } from "../components/Bar";
import { Shell } from "../components/Shell";
import { Radar } from "../components/Radar";
import { GameCard } from "../components/GameCard";
import { useProgress } from "../state/ProgressProvider";

export function Dashboard() {
    const { user } = useAuth0();
    const { progress } = useProgress();

    // Auto-scrolls smoothly down to the game path if the URL contains #path
    useEffect(() => {
        if (window.location.hash) {
            document.getElementById("path")?.scrollIntoView({ behavior: "smooth" });
        }
    }, [useLocation().hash]);

    return (
        <Shell>
            {/* Header: User Greeting & Current Mastery Tier */}
            <div className="page-heading">
                <div>
                    <span className="eyebrow">A LITTLE BETTER, EVERY DAY</span>
                    <h1>
                        Find your rhythm, {user?.given_name || user?.name || "learner"} <span className="hello">✦</span>
                    </h1>
                    <p>Your next confident conversation starts here.</p>
                </div>
                <span className="level-badge">
                    <Layers size={15} />
                    {progress.placed ? progress.level : "Intermediate"} · Level 3
                </span>
            </div>

            <div className="dashboard-layout">
                {/* ================= LEFT MAIN WORKSPACE ================= */}
                <div className="dashboard-primary">
                    {/* Quick Metric Stat Badges */}
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

                    {/* ================= THE MINI-GAMES LEARNING PATH ================= */}
                    <section id="path" className="path-section">
                        <div className="section-heading">
                            <div>
                                <h2>Your learning path</h2>
                                <p>One beat at a time. Every step counts.</p>
                            </div>
                            <span className="subtle-label">{games.length} practice games</span>
                        </div>

                        {/* Unit 1: word stress (Stress Sort, Stress Twins) */}
                        <div className="unit-heading">
                            <span className="unit-number">01</span>
                            <div>
                                <strong>Build your foundation</strong>
                                <p>Get comfortable with the beats of English</p>
                            </div>
                            <span className="unit-status">
                                {2 +
                                    progress.completed.filter((x) =>
                                        ["stress-sort", "stress-twins"].includes(x),
                                    ).length}
                                /4 milestones
                            </span>
                        </div>
                        <div className="game-grid game-grid-2x2">
                            {games.slice(0, 2).map((g, i) => (
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

                        {/* Unit 2: sentence stress and rhythm (What do they mean?, Rhythm Match) */}
                        <div className="unit-heading second">
                            <span className="unit-number lavender">02</span>
                            <div>
                                <strong>Make it sound like you</strong>
                                <p>Turn understanding into natural expression</p>
                            </div>
                            <span className="unit-status purple-text">YOUR NEXT CHAPTER</span>
                        </div>
                        <div className="game-grid game-grid-2x2">
                            {games.slice(2).map((g) => (
                                <GameCard
                                    key={g.id}
                                    game={g}
                                    status={
                                        progress.completed.includes(g.id)
                                            ? "Completed"
                                            : "Ready to play"
                                    }
                                />
                            ))}
                        </div>
                    </section>
                </div>

                {/* ================= RIGHT WIDGET COLUMN ================= */}
                <aside className="right-column">
                    {/* Daily XP Target & Days-of-the-Week Tracker */}
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

                    {/* Spider / Radar Preview Card */}
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