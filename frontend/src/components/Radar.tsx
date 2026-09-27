import { skills } from "../data";
import { useProgress } from "../state/ProgressProvider";

export function Radar({ large = false }: { large?: boolean }) {
    const { progress } = useProgress();
    const scores = progress.skillScores;
    const previous = progress.previousSkillScores;
    const center = 160,
        r = 108;
    const point = (i: number, v: number) => {
        const a = (i * Math.PI * 2) / 7 - Math.PI / 2;
        return `${center + (Math.cos(a) * r * v) / 100},${center + (Math.sin(a) * r * v) / 100}`;
    };
    return (
        <svg
            className={`radar ${large ? "large" : ""}`}
            viewBox="0 0 320 320"
            role="img"
            aria-label={`Speech profile: ${skills.map((s, i) => `${s} ${scores[i]}`).join(", ")}`}
        >
            <g>
                {[25, 50, 75, 100].map((v) => (
                    <polygon
                        key={v}
                        points={skills.map((_, i) => point(i, v)).join(" ")}
                        fill="none"
                        stroke="#e7e4ef"
                    />
                ))}
                {skills.map((_, i) => (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={point(i, 100).split(",")[0]}
                        y2={point(i, 100).split(",")[1]}
                        stroke="#e7e4ef"
                    />
                ))}
                <polygon
                    points={previous.map((s, i) => point(i, s)).join(" ")}
                    fill="#cfc9e620"
                    stroke="#c4bddb"
                    strokeDasharray="4 4"
                />
                <polygon
                    points={scores.map((s, i) => point(i, s)).join(" ")}
                    fill="#8b73df35"
                    stroke="#8365d6"
                    strokeWidth="2.3"
                />
                {scores.map((s, i) => (
                    <circle
                        key={i}
                        cx={point(i, s).split(",")[0]}
                        cy={point(i, s).split(",")[1]}
                        r="3.2"
                        fill="#8365d6"
                    />
                ))}
                {skills.map((s, i) => (
                    <text
                        key={s}
                        x={point(i, 125).split(",")[0]}
                        y={point(i, 125).split(",")[1]}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#797589"
                        fontSize="9"
                    >
                        {s}
                    </text>
                ))}
            </g>
        </svg>
    );
}
