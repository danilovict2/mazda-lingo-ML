

export function Emphasis({ text }: { text: string }) {
    return (
        <>
            {text
                .split("**")
                .map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part))}
        </>
    );
}
