import { BookOpen, Flame, Target, Zap } from "lucide-react";
import { skills } from "../data";
import { Bar } from "../components/Bar";
import { Shell } from "../components/Shell";
import { Radar } from "../components/Radar";
import { useProgress } from "../state/ProgressProvider";

export function Profile() {
    const { progress } = useProgress();
    const gains = progress.skillScores.map(
        (score, index) => score - progress.previousSkillScores[index],
    );
    const practiced = progress.skillScores.filter((score) => score > 0);
    const previousPracticed = progress.previousSkillScores.filter((score) => score > 0);
    const overall = practiced.length
        ? Math.round(practiced.reduce((sum, score) => sum + score, 0) / practiced.length)
        : 0;
    const previousOverall = previousPracticed.length
        ? Math.round(previousPracticed.reduce((sum, score) => sum + score, 0) / previousPracticed.length)
        : 0;
    const improvement = overall - previousOverall;
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
                <span className="demo-pill">LIVE PRACTICE DATA</span>
            </div>
            <div className="profile-metrics">
                {[
                    {
                        icon: Zap,
                        value: progress.xp,
                        label: "Total XP earned",
                        note: `${progress.weeklyXp} earned this week`,
                    },
                    {
                        icon: BookOpen,
                        value: progress.lessonCount,
                        label: "Lessons completed",
                        note: "Small steps, real progress",
                    },
                    {
                        icon: Target,
                        value: `${progress.answers ? Math.round((progress.correct / progress.answers) * 100) : 0}%`,
                        label: "Practice accuracy",
                        note: progress.answers
                            ? "From your answers"
                            : "Complete a lesson to begin",
                    },
                    {
                        icon: Flame,
                        value: `${progress.streak} ${progress.streak === 1 ? "day" : "days"}`,
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
                        <span className="improvement">
                            {improvement > 0 ? "+" : ""}{improvement}% after latest practice
                        </span>
                    </div>
                    <Radar large />
                    <div className="chart-legend">
                        <span>
                            <i />
                            Your current profile
                        </span>
                        <span>
                            <i />
                            Before latest practice
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
                                        {progress.skillScores[i]}{" "}
                                        {gains[i] !== 0 && (
                                            <small>{gains[i] > 0 ? "+" : ""}{gains[i]}</small>
                                        )}
                                    </strong>
                                </div>
                                <Bar value={progress.skillScores[i]} />
                            </div>
                        ))}
                    </section>
                </div>
            </div>
        </Shell>
    );
}
