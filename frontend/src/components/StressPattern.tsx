export function StressPattern({ pattern }: { pattern: number[] }) {
    return (
        <div className="stress-pattern">
            {pattern.map((height, i) => (
                <div
                    key={i}
                    className="stress-bar"
                    style={{ height: `${height * 20}px` }}
                />
            ))}
        </div>
    );
}
