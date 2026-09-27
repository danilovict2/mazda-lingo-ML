import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AudioLines, ArrowRight, ArrowUpRight, Check, Headphones, Mic, Sparkles, RotateCcw, Square } from "lucide-react";
import { api, type Analysis } from "../api/client";
import { Button } from "../components/Button";
import { Bar } from "../components/Bar";
import { Wave } from "../components/Wave";
import { AudioButton } from "../components/AudioButton";
import { Shell } from "../components/Shell";
import { SpokenText } from "../components/SpokenText";
import { toWav } from "../wav";
import { useProgress } from "../state/ProgressProvider";

export function Studio() {
    const { setProgress } = useProgress();
    const [difficulty, setDifficulty] = useState("Medium");
    const [state, setState] = useState<
        "idle" | "recording" | "analyzing" | "result"
    >("idle");
    const [seconds, setSeconds] = useState(0);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [saved, setSaved] = useState(false);
    const [notice, setNotice] = useState("");
    const recorder = useRef<MediaRecorder | null>(null);
    const chunks = useRef<BlobPart[]>([]);
    const [time, setTime] = useState<number | null>(null);
    const stream = useRef<MediaStream | null>(null);
    const [clip, setClip] = useState("");
    const mounted = useRef(true);
    const text =
        difficulty === "Easy"
            ? "photography"
            : difficulty === "Medium"
                ? "I actually thought you were coming tomorrow."
                : "I actually thought you were coming tomorrow. If I had known, I would have made us some coffee. Next time, let’s plan a little earlier.";
    const clipId = `studio-${difficulty.toLowerCase()}`;
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            stream.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);
    useEffect(() => {
        if (state !== "recording") return;
        const interval = window.setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(interval);
    }, [state]);
    useEffect(
        () => () => {
            if (clip) URL.revokeObjectURL(clip);
        },
        [clip],
    );
    async function start(real = false) {
        setSeconds(0);
        setNotice("");
        setClip("");
        recorder.current = null;
        if (real) {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!mounted.current) {
                    s.getTracks().forEach((t) => t.stop());
                    return;
                }
                stream.current = s;
                const r = new MediaRecorder(s);
                chunks.current = [];
                r.ondataavailable = (e) => chunks.current.push(e.data);
                r.onstop = () => {
                    if (mounted.current)
                        setClip(
                            URL.createObjectURL(new Blob(chunks.current, { type: r.mimeType })),
                        );
                    s.getTracks().forEach((t) => t.stop());
                };
                recorder.current = r;
                r.start();
            } catch {
                stream.current?.getTracks().forEach((t) => t.stop());
                setNotice(
                    "Microphone unavailable. Simulated recording is ready — you can still try the full experience.",
                );
            }
        }
        setState("recording");
    }
    /** Stop the microphone and resolve with the finished recording, if any. */
    function stopRecording(): Promise<Blob | null> {
        const r = recorder.current;
        if (!r || r.state !== "recording") {
            const recorded = new Blob(chunks.current, { type: r?.mimeType });
            return Promise.resolve(r && recorded.size ? recorded : null);
        }
        return new Promise((resolve) => {
            r.addEventListener(
                "stop",
                () => resolve(new Blob(chunks.current, { type: r.mimeType })),
                { once: true },
            );
            r.stop();
        });
    }
    async function finish() {
        setState("analyzing");
        setNotice("");
        try {
            const recording = await stopRecording();
            const result = recording
                ? // Real microphone take: transcribed and scored against the reference clip.
                  await api.analyzeRecording(await toWav(recording), clipId)
                : (
                      await Promise.all([
                          api.analyze(text, difficulty),
                          new Promise((resolve) => setTimeout(resolve, 1500)),
                      ])
                  )[0];
            if (mounted.current) {
                setAnalysis(result);
                setState("result");
            }
        } catch (e) {
            if (mounted.current) {
                const reason = e instanceof Error && e.message !== "API unavailable" ? e.message : "";
                setNotice(
                    reason ||
                        "Analysis failed. Check that the API server is running, then try Finish & analyze again.",
                );
                setState(recorder.current ? "idle" : "recording");
            }
        }
    }
    function save() {
        if (!analysis) return;
        setProgress((p) => ({
            ...p,
            xp: p.xp + 120,
            completed: Array.from(new Set([...p.completed, "shape-your-sound"])),
            sessions: [
                {
                    name: "Shape Your Sound",
                    accuracy: analysis.overallScore,
                    date: new Date().toLocaleDateString(),
                },
                ...p.sessions,
            ].slice(0, 8),
        }));
        setSaved(true);
    }
    return (
        <Shell>
            <div className="studio-container">
                <div className="page-heading">
                    <div>
                        <span className="eyebrow">YOUR PERSONAL SPEAKING STUDIO</span>
                        <h1>
                            Shape Your Sound<span className="purple-text">.</span>
                        </h1>
                        <p>Speak it. See it. Improve it.</p>
                    </div>
                    <span className="demo-pill">
                        <i />{" "}
                        {analysis && !analysis.simulated
                            ? "REAL VOICE ANALYSIS"
                            : "SIMULATED AI ANALYSIS"}
                    </span>
                </div>
                <div className="studio-layout">
                    <section className="panel recording-panel">
                        <div className="difficulty-tabs">
                            {["Easy", "Medium", "Hard"].map((d, i) => (
                                <button
                                    disabled={state !== "idle"}
                                    className={difficulty === d ? "active" : ""}
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                >
                                    {d}
                                    <small>{["Words", "Sentences", "Paragraphs"][i]}</small>
                                </button>
                            ))}
                        </div>
                        <div className="section-heading">
                            <span className="eyebrow">MAKE THESE WORDS YOURS</span>
                            <AudioButton text={text} clip={clipId} onTime={setTime} />
                        </div>
                        <h2 className="speaking-text">
                            <SpokenText text={text} clip={clipId} time={time} />
                        </h2>
                        <p className="muted">
                            Let the important words stand out. Leave room to breathe.
                        </p>
                        <div className={`recording-zone ${state}`}>
                            <Wave
                                active={state === "recording" || state === "analyzing"}
                                compact
                            />
                            <button
                                className="mic-button"
                                disabled={state === "analyzing" || state === "result"}
                                onClick={() => (state === "recording" ? finish() : start())}
                                aria-label={
                                    state === "recording"
                                        ? "Finish simulated recording"
                                        : "Start simulated recording"
                                }
                            >
                                {state === "recording" ? (
                                    <Square size={25} fill="currentColor" />
                                ) : state === "analyzing" ? (
                                    <AudioLines size={31} />
                                ) : (
                                    <Mic size={31} />
                                )}
                            </button>
                            <strong>
                                {state === "recording"
                                    ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
                                    : state === "analyzing"
                                        ? "Finding your rhythm…"
                                        : state === "result"
                                            ? "A little insight. A little growth."
                                            : "Ready when you are."}
                            </strong>
                            <p>
                                {state === "recording"
                                    ? "Speak naturally, then finish when you’re ready."
                                    : state === "analyzing"
                                        ? recorder.current
                                            ? "Comparing your voice with the reference."
                                            : "Preparing your simulated speech profile."
                                        : "A safe space to try, repeat, and get better."}
                            </p>
                        </div>
                        {state === "idle" && (
                            <div className="recording-actions">
                                <Button onClick={() => start()}>
                                    Try demo recording <Mic size={17} />
                                </Button>
                                <button className="text-button" onClick={() => start(true)}>
                                    Use my microphone
                                </button>
                            </div>
                        )}
                        {state === "recording" && (
                            <Button onClick={finish}>
                                Finish & analyze <Square size={15} />
                            </Button>
                        )}
                        {state === "result" && (
                            <Button
                                secondary
                                onClick={() => {
                                    setState("idle");
                                    setSaved(false);
                                }}
                            >
                                Try another take <RotateCcw size={16} />
                            </Button>
                        )}
                        {notice && (
                            <p role="status" className="notice">
                                {notice}
                            </p>
                        )}
                        {clip && (
                            <audio aria-label="Your recorded practice" controls src={clip} />
                        )}
                        <small className="privacy-note">
                            Demo recordings get illustrative scores. Microphone takes are
                            sent to ElevenLabs for transcription, then scored against the
                            reference clip.
                        </small>
                    </section>
                    <aside className="panel coaching-panel">
                        {state === "result" && analysis ? (
                            <>
                                <span className="eyebrow">YOUR SPEECH SNAPSHOT</span>
                                <div className="score-ring">
                                    <strong>
                                        {analysis.overallScore}
                                        <small>/ 100</small>
                                    </strong>
                                </div>
                                <h2>There’s confidence in your voice.</h2>
                                <p>
                                    {analysis.transcript
                                        ? `We heard: “${analysis.transcript}”`
                                        : "Here’s where your next little win lives."}
                                </p>
                                {[
                                    { name: "Word stress", score: analysis.wordStress },
                                    { name: "Rhythm", score: analysis.rhythm },
                                    { name: "Clarity", score: analysis.clarity },
                                    { name: "Sentence emphasis", score: analysis.sentenceStress },
                                ].map((s) => (
                                    <div className="score-row" key={s.name}>
                                        <div>
                                            <span>{s.name}</span>
                                            <strong>{s.score}%</strong>
                                        </div>
                                        <Bar value={s.score} />
                                    </div>
                                ))}
                                <div className="coaching-notes">
                                    {analysis.feedback.map((f, i) => (
                                        <p key={f}>
                                            {i === 0 ? <Check size={17} /> : <Sparkles size={17} />}
                                            <span>{f}</span>
                                        </p>
                                    ))}
                                </div>
                                <Button onClick={save} disabled={saved}>
                                    {saved ? (
                                        <>
                                            <Check size={17} /> Saved · +120 XP
                                        </>
                                    ) : (
                                        <>
                                            Save my practice <ArrowRight size={17} />
                                        </>
                                    )}
                                </Button>
                                {saved && (
                                    <Link to="/progress" className="panel-link">
                                        View speech profile <ArrowUpRight size={17} />
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="game-icon purple">
                                    <Sparkles size={27} />
                                </span>
                                <h2>
                                    Meet your voice
                                    <br />
                                    with a little curiosity.
                                </h2>
                                <p>Your feedback will appear here after your practice.</p>
                                <div className="coaching-placeholder">
                                    {[
                                        "Word stress",
                                        "Natural rhythm",
                                        "Clarity",
                                        "Sentence emphasis",
                                    ].map((s) => (
                                        <div key={s}>
                                            <span>{s}</span>
                                            <div />
                                        </div>
                                    ))}
                                </div>
                                <div className="tip-box">
                                    <Headphones size={20} />
                                    <p>
                                        Listen to the example once. Then focus on expression, not
                                        perfection.
                                    </p>
                                </div>
                            </>
                        )}
                    </aside>
                </div>
            </div>
        </Shell>
    );
}
