import { AudioLines, ArrowRight, BookOpen, ChartNoAxesCombined, Check, Flame, Sparkles, Target, Trophy, Zap } from "lucide-react";
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
