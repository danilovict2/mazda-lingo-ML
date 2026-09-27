

export function Bar({ value }: { value: number }) {
    return (
        <div className="progress-track">
            <span style={{ width: `${Math.min(100, value)}%` }} />
        </div>
    );
}
