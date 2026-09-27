import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { games, questions, type StressStepsQuestion } from "../data";
import { api } from "../api/client";
import { Button } from "../components/Button";
import { Bar } from "../components/Bar";
import { GameIcon } from "../components/GameIcon";
import { Shell } from "../components/Shell";
import { QuestionView } from "../components/QuestionView";
import { StressStepsView } from "../components/StressStepsView";
import { Completion } from "../components/Completion";
import { useProgress } from "../state/ProgressProvider";

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
    if (!game) return <Navigate to="/dashboard" />;
    const source = questions[game.id];
    if (!source) return <Navigate to="/dashboard" />;
    const list =
        id !== "stress-sort" && difficulty === "Easy"
            ? [source[1], source[0], source[2], source[3]]
            : id !== "stress-sort" && difficulty === "Hard"
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
                            {id !== "stress-sort" && <p>{game.subtitle}</p>}
                        </div>
                        {id !== "stress-sort" && (
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
                        )}
                    </div>
                    <div className="lesson-progress">
                        <Bar value={(index / list.length) * 100} />
                        <span>
                            {index + 1} of {list.length}
                        </span>
                    </div>
                    {id === "stress-sort" ? (
                        <StressStepsView
                            q={q as StressStepsQuestion}
                            onComplete={(isCorrect) => {
                                setSelected(1);
                                if (isCorrect) setCorrect((c) => c + 1);
                            }}
                        />
                    ) : (
                        <QuestionView
                            q={q as any}
                            selected={selected}
                            onSelect={(i) => {
                                setSelected(i);
                                if (i === (q as any).correct) setCorrect((c) => c + 1);
                            }}
                        />
                    )}
                    {apiError && <p role="alert" className="notice">{apiError}</p>}
                    <div className="exercise-actions">
                        <Button disabled={selected === null || busy} onClick={next}>
                            {busy
                                ? "Saving…"
                                : index === list.length - 1
                                    ? "Finish lesson"
                                    : "Next question"}{" "}
                            <ArrowRight size={17} />
                        </Button>
                    </div>
                </div>
            )}
        </Shell>
    );
}
