import { useState, useRef } from "react";
import { Check } from "lucide-react";
import type { StressStepsQuestion } from "../data";
import { StressPattern } from "./StressPattern";

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
    const [showCorrectness, setShowCorrectness] = useState(false);
    const draggedWord = useRef<string | null>(null);

    const unplacedWords = q.words.filter((w) => !(w in placed));
    const column1Words = [q.category1Example, ...Object.entries(placed)
        .filter(([_, cat]) => cat === 0)
        .map(([word]) => word)];
    const column2Words = [q.category2Example, ...Object.entries(placed)
        .filter(([_, cat]) => cat === 1)
        .map(([word]) => word)];

    function handleDragStart(e: React.DragEvent, word: string) {
        draggedWord.current = word;
        e.dataTransfer!.effectAllowed = "move";
        (e.currentTarget as HTMLElement).style.opacity = "0.5";
    }

    function handleDragEnd(e: React.DragEvent) {
        (e.currentTarget as HTMLElement).style.opacity = "1";
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

    function handleSubmit() {
        if (unplacedWords.length > 0) {
            setFeedback("Place all words before submitting!");
            return;
        }

        const isCorrect = Object.entries(placed).every(
            ([word, cat]) => q.correctMap[word] === cat
        );

        setShowCorrectness(true);

        if (isCorrect) {
            setSubmitted(true);
            onComplete(true);
        } else {
            setFeedback("Check your placements. You can move words around and try again.");
        }
    }

    return (
        <div className="stress-steps-container">
            <div className="stress-instructions">
                <h3>Put the words into the correct columns</h3>
                <p>Look at the examples first.</p>
            </div>

            <div className="stress-layout">
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
                    <div className="column-header">
                        <StressPattern pattern={q.category1Pattern} />
                    </div>
                    <div className="column-label">{q.category1Label}</div>
                    <div className="words-list">
                        {column1Words.map((word, idx) => {
                            const isCorrect = q.correctMap[word] === 0;
                            const isExample = idx === 0;
                            return (
                                <div
                                    key={word}
                                    draggable={!isExample && !submitted}
                                    onDragStart={(e) => !isExample && handleDragStart(e, word)}
                                    onDragEnd={handleDragEnd}
                                    className={`placed-word ${isExample ? "example-word" : ""} ${showCorrectness && !isExample && !isCorrect ? "incorrect" : showCorrectness && !isExample && isCorrect ? "correct" : ""}`}
                                >
                                    <span>{word}</span>
                                    {showCorrectness && !isExample && isCorrect && (
                                        <Check size={16} className="check-icon" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div
                    className="stress-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 1)}
                >
                    <div className="column-header">
                        <StressPattern pattern={q.category2Pattern} />
                    </div>
                    <div className="column-label">{q.category2Label}</div>
                    <div className="words-list">
                        {column2Words.map((word, idx) => {
                            const isCorrect = q.correctMap[word] === 1;
                            const isExample = idx === 0;
                            return (
                                <div
                                    key={word}
                                    draggable={!isExample && !submitted}
                                    onDragStart={(e) => !isExample && handleDragStart(e, word)}
                                    onDragEnd={handleDragEnd}
                                    className={`placed-word ${isExample ? "example-word" : ""} ${showCorrectness && !isExample && !isCorrect ? "incorrect" : showCorrectness && !isExample && isCorrect ? "correct" : ""}`}
                                >
                                    <span>{word}</span>
                                    {showCorrectness && !isExample && isCorrect && (
                                        <Check size={16} className="check-icon" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                </div>
            </div>

            {feedback && (
                <div
                    role="status"
                    className={`feedback ${submitted ? "success" : "gentle"}`}
                >
                    <span>{feedback}</span>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={submitted}
                className="submit-btn"
            >
                {submitted ? "Perfect!" : "Check"}
            </button>
        </div>
    );
}
