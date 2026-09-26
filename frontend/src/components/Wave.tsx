

export function Wave({
    active = false,
    stress = 1,
    compact = false,
    groups = 4,
}: {
    active?: boolean;
    stress?: number;
    compact?: boolean;
    groups?: number;
}) {
    return (
        <div
            className={`wave ${active ? "playing" : ""} ${compact ? "compact" : ""}`}
            aria-hidden="true"
        >
            {Array.from({ length: compact ? 37 : 73 }, (_, i) => {
                const n = compact ? 37 : 73;
                const group = Math.floor(i / (n / groups));
                const h =
                    (Math.abs(Math.sin(i * 1.72)) * 0.65 + 0.35) *
                    (group === stress ? 90 : 30) +
                    8;
                return (
                    <i
                        key={i}
                        style={{ height: `${h}%`, animationDelay: `${i * 23}ms` }}
                    />
                );
            })}
        </div>
    );
}
