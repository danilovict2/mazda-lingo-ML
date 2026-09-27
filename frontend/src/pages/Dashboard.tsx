import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Check, Target, Layers } from "lucide-react";
import { games } from "../data";
import { Bar } from "../components/Bar";
import { Shell } from "../components/Shell";
import { Radar } from "../components/Radar";
import { GameCard } from "../components/GameCard";
import { useProgress } from "../state/ProgressProvider";

export function Dashboard() {
    const { progress } = useProgress();
    const { user } = useAuth0();
    const today = new Date();
    const week = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate() - 6 + index,
        ));
        return {
            key: date.toISOString().slice(0, 10),
            label: date.toLocaleDateString(undefined, { weekday: "narrow", timeZone: "UTC" }),
            today: index === 6,
        };
    });
    const levelNumber = Math.floor(progress.xp / 500) + 1;
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
                    {progress.placed ? progress.level : "Not placed"} · Level {levelNumber}
                </span>
            </div>
            <section id="path" className="path-section">
                <div className="section-heading">
                    <div>
                        <h2>Practice games</h2>
                    </div>
                </div>
                {/* Cards and panels share one grid so the panels line up with the card rows. */}
                <div className="dashboard-grid">
                            {games.map((g, i) => (
                                <GameCard
                                    key={g.id}
                                    game={g}
                                    wide={g.id === "say-it-right"}
                                    status={
                                        progress.completed.includes(g.id)
                                            ? "Completed"
                                            : i === 0
                                                ? "Start here"
                                                : "Ready to play"
                                    }
                                />
                            ))}
                    <section className="panel goal-panel">
                        <div className="section-heading">
                            <h3>Today's goal</h3>
                            <Target size={19} className="muted" />
                        </div>
                        <div className="goal-total">
                            <strong>
                                {Math.min(100, progress.todayXp)}
                            </strong>
                            <span>/ 100 XP</span>
                            <span className="goal-emoji">✦</span>
                        </div>
                        <Bar value={progress.todayXp} />
                        <p>
                            {progress.todayXp >= 100
                                ? "Goal reached. Look at you go!"
                                : "A short lesson. A step forward."}
                        </p>
                        <div className="week">
                            {week.map((day) => {
                                const active = progress.activityDays.includes(day.key);
                                return (
                                    <div key={day.key}>
                                        <span className={active ? "done" : day.today ? "today" : ""}>
                                            {active ? <Check size={12} /> : day.label}
                                        </span>
                                        <small>{day.label}</small>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                    <section className="panel profile-preview">
                        <div className="section-heading">
                            <h3>Your speech, visualized</h3>
                            <span className="live-dot" />
                        </div>
                        <p>
                            {progress.lessonCount
                                ? "Based on your saved practice sessions."
                                : "Complete a lesson to begin your profile."}
                        </p>
                        <Radar />
                        <div className="chart-legend">
                            <span>
                                <i />
                                Now
                            </span>
                            <span>
                                <i />
                                Before latest practice
                            </span>
                        </div>
                        <Link to="/progress" className="panel-link">
                            Explore your speech profile <ArrowUpRight size={16} />
                        </Link>
                    </section>
                </div>
            </section>
        </Shell>
    );
}
