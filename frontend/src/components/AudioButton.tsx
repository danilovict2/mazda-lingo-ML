import { useState, useEffect, useRef } from "react";
import { AudioLines, Volume2 } from "lucide-react";
import { clipUrl } from "../audio";

// Only one clip plays at a time: starting a new one pauses the previous one.
let current: HTMLAudioElement | null = null;

export function AudioButton({
    text,
    clip,
    onTime,
    compact = false,
    label,
}: {
    text: string;
    clip?: string;
    /** Called with the playback position in seconds, or null when stopped. */
    onTime?: (time: number | null) => void;
    /** Small speaker icon (with an optional label) instead of the Listen button. */
    compact?: boolean;
    label?: string;
}) {
    const [playing, setPlaying] = useState(false);
    const [message, setMessage] = useState("");
    const audio = useRef<HTMLAudioElement | null>(null);
    const frame = useRef(0);
    function stop() {
        cancelAnimationFrame(frame.current);
        audio.current?.pause();
        audio.current = null;
        window.speechSynthesis?.cancel();
        setPlaying(false);
        onTime?.(null);
    }
    // Stop playback when the question changes or the component unmounts.
    useEffect(() => stop, [clip, text]);
    function speak() {
        if (!("speechSynthesis" in window)) {
            setPlaying(false);
            setMessage("Audio unavailable. Follow the highlighted stress pattern.");
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text.replaceAll("**", ""));
        utterance.lang = "en-US";
        utterance.rate = 0.83;
        utterance.onend = () => setPlaying(false);
        utterance.onerror = () => {
            setPlaying(false);
            setMessage("Audio unavailable in this browser.");
        };
        window.speechSynthesis.speak(utterance);
    }
    function play() {
        stop();
        setMessage("");
        setPlaying(true);
        if (!clip) return speak();
        // Pre-generated ElevenLabs recording; the browser voice is only a fallback.
        const a = new Audio(clipUrl(clip));
        a.onended = stop;
        a.onpause = () => {
            if (audio.current === a) stop();
        };
        current?.pause();
        current = a;
        audio.current = a;
        const tick = () => {
            onTime?.(a.currentTime);
            frame.current = requestAnimationFrame(tick);
        };
        a.play().then(tick, () => {
            if (audio.current === a) speak();
        });
    }
    if (compact)
        return (
            <button
                type="button"
                className={`word-audio${playing ? " playing" : ""}`}
                onClick={play}
                aria-label={`Hear “${text}”`}
                title={`Hear “${text}”`}
            >
                {playing ? <AudioLines size={14} /> : <Volume2 size={14} />}
                {label && <span>{label}</span>}
            </button>
        );
    return (
        <span className="audio-wrap">
            <button
                className="audio-button"
                onClick={play}
                aria-label="Play reference pronunciation"
            >
                {playing ? <AudioLines size={18} /> : <Volume2 size={18} />}{" "}
                {playing ? "Playing…" : "Listen"}{" "}
            </button>
            {message && <small>{message}</small>}
        </span>
    );
}
