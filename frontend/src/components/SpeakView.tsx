import { useEffect, useRef, useState } from "react";
import { Check, Headphones, Mic, RotateCcw, Square } from "lucide-react";
import { api, type StressCheck } from "../api/client";
import { type SpeakQuestion } from "../data";
import { toWav } from "../wav";
import { AudioButton } from "./AudioButton";
import { SpokenText } from "./SpokenText";

const MAX_SECONDS = 8;

/**
 * Say It Right: the player records the sentence, stressing the marked words,
 * and the server checks which words actually stood out.
 */
export function SpeakView({
    q,
    onResult,
}: {
    q: SpeakQuestion;
    /** Called after every checked attempt (and on skip, with false). */
    onResult: (passed: boolean) => void;
}) {
    const [state, setState] = useState<"idle" | "recording" | "checking">("idle");
    const [result, setResult] = useState<StressCheck | null>(null);
    const [error, setError] = useState("");
    const [take, setTake] = useState("");
    const [time, setTime] = useState<number | null>(null);
    const recorder = useRef<MediaRecorder | null>(null);
    const stream = useRef<MediaStream | null>(null);
    const timer = useRef(0);
    const sentence = q.text.replaceAll("**", "");
    const targets = q.text.split("**").filter((_, i) => i % 2);

    useEffect(
        () => () => {
            clearTimeout(timer.current);
            stream.current?.getTracks().forEach((t) => t.stop());
        },
        [],
    );
    useEffect(() => () => void (take && URL.revokeObjectURL(take)), [take]);

    async function start() {
        setError("");
        try {
            const s = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.current = s;
            const r = new MediaRecorder(s);
            const chunks: BlobPart[] = [];
            r.ondataavailable = (e) => chunks.push(e.data);
            r.onstop = () => {
                clearTimeout(timer.current);
                s.getTracks().forEach((t) => t.stop());
                const blob = new Blob(chunks, { type: r.mimeType });
                setTake(URL.createObjectURL(blob));
                void check(blob);
            };
            recorder.current = r;
            r.start();
            setState("recording");
            // Stop automatically so a forgotten recording doesn't run on.
            timer.current = window.setTimeout(() => r.state === "recording" && r.stop(), MAX_SECONDS * 1000);
        } catch {
            setError("We couldn't use your microphone. Allow microphone access and try again.");
        }
    }

    async function check(recording: Blob) {
        setState("checking");
        try {
            const res = await api.checkStress(await toWav(recording), sentence, targets);
            setResult(res);
            onResult(res.passed);
        } catch (e) {
            setError(e instanceof Error && e.message !== "API unavailable" ? e.message : "We couldn't check that take. Please try again.");
        } finally {
            setState("idle");
        }
    }

    return (
        <>
            <section className="question-card speak-card">
                <div className="section-heading">
                    <span className="eyebrow">SAY IT WITH THE HIGHLIGHTED WORDS STRESSED</span>
                    <AudioButton text={sentence} clip={q.audio} onTime={setTime} />
                </div>
                <h2 className="question-text">
                    <SpokenText text={q.text} clip={q.audio} time={time} />
                </h2>
                <div className="record-zone">
                    {state === "recording" ? (
                        <button className="record-button recording" onClick={() => recorder.current?.stop()}>
                            <Square size={18} fill="currentColor" /> Stop
                        </button>
                    ) : (
                        <button className="record-button" onClick={start} disabled={state === "checking"}>
                            {result ? <RotateCcw size={18} /> : <Mic size={18} />}
                            {state === "checking" ? "Checking…" : result ? "Try again" : "Tap to record"}
                        </button>
                    )}
                    <small>
                        {state === "recording"
                            ? `Recording… say the sentence, then tap Stop (max ${MAX_SECONDS}s).`
                            : "Listen first if you like, then record yourself."}
                    </small>
                </div>
            </section>

            {error && (
                <p role="alert" className="notice">
                    {error}
                </p>
            )}

            {result && (
                <div role="status" className={`feedback ${result.passed ? "success" : "gentle"}`}>
                    <span className="feedback-icon">
                        {result.passed ? <Check size={20} /> : <Headphones size={20} />}
                    </span>
                    <div>
                        <strong>{result.passed ? "You said it right!" : "Not quite yet."}</strong>
                        <p>{result.feedback}</p>
                        <p className="muted">We heard: “{result.transcript}”</p>
                        {/* How much each word stood out in the player's own take. */}
                        <div className="stress-bars" aria-label="How strongly you stressed each word">
                            {result.words.map((w, i) => (
                                <div key={i} className={`${w.target ? "target" : ""} ${w.heard ? "" : "missed"}`}>
                                    <i style={{ height: `${Math.max(8, w.prominence * 100)}%` }} />
                                    <span>{w.text}</span>
                                </div>
                            ))}
                        </div>
                        {take && <audio controls src={take} aria-label="Your recording" />}
                    </div>
                </div>
            )}

            {!result && (
                <button className="text-button" onClick={() => onResult(false)}>
                    Can't record right now? Skip this one
                </button>
            )}
        </>
    );
}
