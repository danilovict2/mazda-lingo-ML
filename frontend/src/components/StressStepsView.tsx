import { useState, useRef } from "react";
import { Check } from "lucide-react";
import type { StressStepsQuestion } from "../data";

export function StressStepsView({
    q,
    onComplete,
}: {
    q: StressStepsQuestion;
    onComplete: (correct: boolean) => void;
}) {
    const [placed, setPlaced] = useState<Record<string, number>>({});
    const [feedback, setFeedback] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const draggedWord = useRef<string | null>(null);

    const unplacedWords = q.words.filter((w) => !(w in placed));
    const column1Words = Object.entries(placed)
        .filter(([_, cat]) => cat === 0)
        .map(([word]) => word);
    const column2Words = Object.entries(placed)
        .filter(([_, cat]) => cat === 1)
        .map(([word]) => word);

    function handleDragStart(e: React.DragEvent, word: string) {
        draggedWord.current = word;
        e.dataTransfer!.effectAllowed = "move";
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
    }

    function handleDrop(e: React.DragEvent, category: number) {
        e.preventDefault();
        const word = draggedWord.current;
        if (!word) return;

        setPlaced((prev) => ({
            ...prev,
            [word]: category,
        }));
        draggedWord.current = null;
    }

    function handleRemove(word: string) {
        setPlaced((prev) => {
            const newPlaced = { ...prev };
            delete newPlaced[word];
            return newPlaced;
        });
    }

    function handleSubmit() {
        if (unplacedWords.length > 0) {
            setFeedback("Place all words before submitting!");
            return;
        }

        const isCorrect = Object.entries(placed).every(
            ([word, cat]) => q.correctMap[word] === cat
        );

        setSubmitted(true);
        onComplete(isCorrect);

        if (isCorrect) {
            setFeedback(null);
        } else {
            setFeedback("Check your placements and try again.");
        }
    }

    return (
        <div className="stress-steps-container">
            <div className="stress-instructions">
                <p>Put the words into the correct columns. Look at the examples first.</p>
            </div>

            <div className="stress-examples">
                <div className="examples-section">
                    <h4>{q.category1Label}</h4>
                    {q.examples
                        .filter((e) => e.category === 0)
                        .map((e) => (
                            <span key={e.word} className="example-word">
                                {e.word}
                            </span>
                        ))}
                </div>
                <div className="examples-section">
                    <h4>{q.category2Label}</h4>
                    {q.examples
                        .filter((e) => e.category === 1)
                        .map((e) => (
                            <span key={e.word} className="example-word">
                                {e.word}
                            </span>
                        ))}
                </div>
            </div>

            <div className="stress-words-pool">
                <div className="words-label">Words to place:</div>
                <div className="words-grid">
                    {unplacedWords.map((word) => (
                        <div
                            key={word}
                            draggable
                            onDragStart={(e) => handleDragStart(e, word)}
                            className="draggable-word"
                        >
                            {word}
                        </div>
                    ))}
                </div>
            </div>

            <div className="stress-columns">
                <div
                    className="stress-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 0)}
                >
                    <div className="column-header">{q.category1}</div>
                    <div className="column-label">{q.category1Label}</div>
                    <div className="words-list">
                        {column1Words.map((word) => (
                            <div
                                key={word}
                                className={`placed-word ${submitted && q.correctMap[word] !== 0 ? "incorrect" : submitted && q.correctMap[word] === 0 ? "correct" : ""}`}
                            >
                                <span>{word}</span>
                                <button
                                    onClick={() => handleRemove(word)}
                                    disabled={submitted}
                                    className="remove-btn"
                                >
                                    ×
                                </button>
                                {submitted && q.correctMap[word] === 0 && (
                                    <Check size={16} className="check-icon" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className="stress-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 1)}
                >
                    <div className="column-header">{q.category2}</div>
                    <div className="column-label">{q.category2Label}</div>
                    <div className="words-list">
                        {column2Words.map((word) => (
                            <div
                                key={word}
                                className={`placed-word ${submitted && q.correctMap[word] !== 1 ? "incorrect" : submitted && q.correctMap[word] === 1 ? "correct" : ""}`}
                            >
                                <span>{word}</span>
                                <button
                                    onClick={() => handleRemove(word)}
                                    disabled={submitted}
                                    className="remove-btn"
                                >
                                    ×
                                </button>
                                {submitted && q.correctMap[word] === 1 && (
                                    <Check size={16} className="check-icon" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {feedback && (
                <div
                    role="status"
                    className={`feedback ${submitted ? (Object.entries(placed).every(([word, cat]) => q.correctMap[word] === cat) ? "success" : "gentle") : ""}`}
                >
                    <span>{feedback}</span>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={submitted}
                className="submit-btn"
            >
                {submitted ? "Submitted" : "Check"}
            </button>
        </div>
    );
}
