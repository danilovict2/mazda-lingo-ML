import { Fragment } from "react";
import { activeWord, clipMeta } from "../audio";

/**
 * Renders question text with **emphasis** markup and highlights each word
 * while the reference clip speaks it. With `reveal` off, the emphasis is
 * hidden so the listener has to hear it.
 */
export function SpokenText({
    text,
    clip,
    time = null,
    reveal = true,
}: {
    text: string;
    clip?: string;
    time?: number | null;
    reveal?: boolean;
}) {
    const active = activeWord(clipMeta(clip), time);
    let word = -1;
    return (
        <>
            {text.split("**").map((part, p) =>
                part.split(/(\s+)/).map((token, t) => {
                    const key = `${p}-${t}`;
                    // Arrows and other symbols aren't spoken, so they get no timing.
                    if (!/[\p{L}\p{N}]/u.test(token)) return <Fragment key={key}>{token}</Fragment>;
                    word++;
                    const className = `spoken-word${word === active ? " active" : ""}`;
                    return p % 2 && reveal ? (
                        <em key={key} className={className}>
                            {token}
                        </em>
                    ) : (
                        <span key={key} className={className}>
                            {token}
                        </span>
                    );
                }),
            )}
        </>
    );
}
