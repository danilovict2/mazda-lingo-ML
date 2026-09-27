import { useState, useEffect } from "react";
import { AudioLines, Volume2 } from "lucide-react";

export function AudioButton({ text }: { text: string }) {
    const [playing, setPlaying] = useState(false);
    const [message, setMessage] = useState("");
    useEffect(
        () => () => {
            window.speechSynthesis?.cancel();
        },
        [],
    );
    function play() {
        if (!("speechSynthesis" in window)) {
            setMessage("Audio unavailable. Follow the highlighted stress pattern.");
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replaceAll("**", ""));
        utterance.lang = "en-US";
        utterance.rate = 0.83;
        utterance.onend = () => setPlaying(false);
        utterance.onerror = () => {
            setPlaying(false);
            setMessage("Audio unavailable in this browser.");
        };
        setPlaying(true);
        window.speechSynthesis.speak(utterance);
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
