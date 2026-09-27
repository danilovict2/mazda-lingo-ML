import { AudioLines, BookOpen, Check, Flame, Target, Zap } from "lucide-react";
import { skills, scores } from "../data";
import { Button } from "../components/Button";
import { Bar } from "../components/Bar";
import { Shell } from "../components/Shell";
import { Radar } from "../components/Radar";
import { useProgress } from "../state/ProgressProvider";

export function Profile() {
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
                </div>
            </div>
        </Shell>
    );
}
