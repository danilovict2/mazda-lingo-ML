import { AudioLines, ArrowRight, Target, Trophy, Zap } from "lucide-react";
import { Button } from "../components/Button";

export function Completion({
    xp,
    accuracy,
    name,
}: {
    xp: number;
    accuracy: number;
    name: string;
}) {
    return (
        <div className="result-screen">
            <div className="result-orb">
                <Trophy size={49} />
            </div>
            <span className="eyebrow">ANOTHER STEP TOWARD CONFIDENT SPEECH</span>
            <h1>
                That’s a wrap.
                <br />
                <span className="purple-text">You found your rhythm.</span>
            </h1>
            <p>{name} · Lesson complete</p>
            <div className="completion-metrics">
                <div>
                    <Zap />
                    <strong>+{xp}</strong>
                    <span>XP earned</span>
                </div>
                <div>
                    <Target />
                    <strong>{accuracy}%</strong>
                    <span>Accuracy</span>
                </div>
                <div>
                    <AudioLines />
                    <strong>Saved</strong>
                    <span>Profile updated</span>
                </div>
            </div>
            <p>Keep the momentum going.</p>
            <div className="actions">
                <Button to="/dashboard">
                    Continue learning <ArrowRight size={17} />
                </Button>
                <Button to="/progress" secondary>
                    View my progress
                </Button>
            </div>
        </div>
    );
}
