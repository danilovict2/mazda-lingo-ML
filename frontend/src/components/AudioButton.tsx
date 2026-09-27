import { useState, useEffect, useRef } from "react";
import { AudioLines, Volume2 } from "lucide-react";
import { clipUrl } from "../audio";

export function AudioButton({
    text,
    clip,
    onTime,
}: {
    text: string;
    clip?: string;
    /** Called with the playback position in seconds, or null when stopped. */
    onTime?: (time: number | null) => void;
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
        audio.current = a;
        const tick = () => {
            onTime?.(a.currentTime);
            frame.current = requestAnimationFrame(tick);
        };
        a.play().then(tick, () => {
            if (audio.current === a) speak();
        });
    }
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
