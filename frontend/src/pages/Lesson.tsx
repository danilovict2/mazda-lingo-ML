import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { games, questions } from "../data";
import { api } from "../api/client";
import { Button } from "../components/Button";
import { Bar } from "../components/Bar";
import { Wave } from "../components/Wave";
import { AudioButton } from "../components/AudioButton";
import { SpokenText } from "../components/SpokenText";
import { Soundprint } from "../components/Soundprint";
import { GameIcon } from "../components/GameIcon";
import { Shell } from "../components/Shell";
import { QuestionView } from "../components/QuestionView";
import { Completion } from "../components/Completion";
import { Studio } from "../pages/Studio";
import { useProgress } from "../state/ProgressProvider";
import { activeWord, clipMeta } from "../audio";

export function Lesson() {
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
    const [time, setTime] = useState<number | null>(null);
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
    const meta = clipMeta(q.audio);
    // Stress Detective hides the stressed word until you answer: you have to hear it.
    const listenFirst = id === "stress-detective";
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
                            <AudioButton text={q.text} clip={q.audio} onTime={setTime} />
                        </div>
                        <h2 className="question-text">
                            <SpokenText
                                text={q.text}
                                clip={q.audio}
                                time={time}
                                reveal={!listenFirst || selected !== null}
                            />
                        </h2>
                        {listenFirst && selected === null && (
                            <p className="listen-hint">
                                Press Listen and notice which word stands out.
                            </p>
                        )}
                        {id === "soundprint" && (
                            <div
                                className={`soundprint-visual difficulty-${difficulty.toLowerCase()}`}
                            >
                                {meta?.syllables ? (
                                    <Soundprint
                                        meta={meta}
                                        time={time}
                                        reveal={selected !== null}
                                        difficulty={difficulty}
                                    />
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                        )}
                        {id === "rhythm-match" && (
                            <div className="rhythm-beats">
                                {q.options[q.correct].split(" ").map((word, i) => (
                                    <i
                                        key={i}
                                        className={i === activeWord(meta, time) ? "beat-active" : ""}
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
