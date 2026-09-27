import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles, Target, X } from "lucide-react";
import { placement } from "../data";
import { api } from "../api/client";
import { Logo } from "../components/Logo";
import { Button } from "../components/Button";
import { Bar } from "../components/Bar";
import { AudioButton } from "../components/AudioButton";
import { Emphasis } from "../components/Emphasis";
import { QuestionView } from "../components/QuestionView";
import { useProgress } from "../state/ProgressProvider";

export function Placement() {
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
            setProgress(r.progress);
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
