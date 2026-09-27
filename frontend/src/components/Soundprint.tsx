import { type ClipMeta } from "../audio";

const W = 720;
const H = 160;

/**
 * Waveform of a real reference clip: bars are loudness, the line is pitch.
 * The stressed syllable is highlighted once the answer is revealed.
 */
export function Soundprint({
    meta,
    time,
    reveal,
    difficulty,
}: {
    meta: ClipMeta;
    time: number | null;
    reveal: boolean;
    difficulty: string;
}) {
    const { start, end, values, pitch } = meta.envelope;
    const span = end - start;
    const x = (t: number) => ((t - start) / span) * W;
    const bar = W / values.length;
    const syllables = meta.syllables ?? [];
    const stressed = syllables.find((s) => s.stressed);
    const voiced = pitch.filter((p) => p > 0);
    const lo = Math.min(...voiced) - 15;
    const hi = Math.max(...voiced) + 15;
    // Break the pitch line wherever the voice is silent or unvoiced.
    const pitchPath = pitch
        .map((p, i) => {
            if (!p) return "";
            const cmd = i > 0 && pitch[i - 1] ? "L" : "M";
            return `${cmd}${(i + 0.5) * bar},${H - 16 - ((p - lo) / (hi - lo)) * (H - 40)}`;
        })
        .join("");
    const showPitch = difficulty !== "Hard" && voiced.length > 1;
    return (
        <>
            <div className="wave-label">
                <span>REAL SOUNDPRINT · ELEVENLABS AUDIO</span>
                <span>
                    BARS = LOUDNESS{showPitch && " · LINE = PITCH"}
                </span>
            </div>
            <svg
                className="soundprint-svg"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                {reveal && stressed && (
                    <rect
                        className="stress-band"
                        x={x(stressed.start)}
                        width={x(stressed.end) - x(stressed.start)}
                        y={0}
                        height={H}
                        rx={8}
                    />
                )}
                {difficulty === "Easy" &&
                    syllables.slice(1).map((s) => (
                        <line key={s.start} className="syllable-edge" x1={x(s.start)} x2={x(s.start)} y1={8} y2={H - 8} />
                    ))}
                {values.map((v, i) => {
                    const h = Math.max(3, v * (H - 30));
                    const t = start + (i + 0.5) * (span / values.length);
                    const played = time === null || t <= time;
                    return (
                        <rect
                            key={i}
                            className={`bar${played ? "" : " upcoming"}${difficulty === "Hard" ? " faint" : ""}`}
                            x={i * bar + bar * 0.2}
                            width={bar * 0.6}
                            y={(H - h) / 2}
                            height={h}
                            rx={2}
                        />
                    );
                })}
                {showPitch && <path className="pitch-line" d={pitchPath} />}
                {time !== null && time >= start && time <= end && (
                    <line className="playhead" x1={x(time)} x2={x(time)} y1={0} y2={H} />
                )}
            </svg>
            <div className="syllable-labels real">
                {syllables.map((s) => (
                    <span
                        key={s.start}
                        className={reveal && s.stressed ? "stressed" : ""}
                        style={{ left: `${(x((s.start + s.end) / 2) / W) * 100}%` }}
                    >
                        {reveal && s.stressed ? s.text.toUpperCase() : s.text}
                    </span>
                ))}
            </div>
        </>
    );
}
