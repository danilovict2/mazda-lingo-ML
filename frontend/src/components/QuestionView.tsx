import { Check, Headphones } from "lucide-react";
import { type Question } from "../data";

export function QuestionView({
    q,
    selected,
    onSelect,
    success = "You found the beat!",
    retry = "Almost. Let’s listen a little closer.",
    xp,
}: {
    q: Question;
    selected: number | null;
    onSelect: (i: number) => void;
    success?: string;
    retry?: string;
    /** XP this answer earns, shown in the feedback; omit where no XP is awarded. */
    xp?: { correct: number; wrong: number };
}) {
    return (
        <>
            <div className="question-prompt">{q.prompt}</div>
            <div className="answer-grid">
                {q.options.map((option, i) => (
                    <button
                        key={option}
                        disabled={selected !== null}
                        onClick={() => onSelect(i)}
                        className={`answer-option ${selected !== null && i === q.correct ? "correct" : ""} ${selected === i && i !== q.correct ? "incorrect" : ""}`}
                    >
                        <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
                        <span>{option}</span>
                        {selected !== null && i === q.correct && <Check size={19} />}
                    </button>
                ))}
            </div>
            {selected !== null && (
                <div
                    role="status"
                    className={`feedback ${selected === q.correct ? "success" : "gentle"}`}
                >
                    <span className="feedback-icon">
                        {selected === q.correct ? (
                            <Check size={20} />
                        ) : (
                            <Headphones size={20} />
                        )}
                    </span>
                    <div>
                        <strong>
                            {selected === q.correct ? success : retry}
                            {xp && ` +${selected === q.correct ? xp.correct : xp.wrong} XP`}
                        </strong>
                        <p>{q.explanation}</p>
                    </div>
                </div>
            )}
        </>
    );
}
