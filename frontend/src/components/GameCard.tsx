import { Link } from "react-router-dom";
import { ArrowUpRight, Check, Clock, Lock } from "lucide-react";
import { games, questions } from "../data";
import { GameIcon } from "../components/GameIcon";

export function GameCard({
    game: g,
    status,
}: {
    game: (typeof games)[number];
    status: string;
}) {
    const locked = status === "Locked";
    return (
        <Link
            to={locked ? "#path" : `/game/${g.id}`}
            aria-disabled={locked}
            onClick={(e) => {
                if (locked) e.preventDefault();
            }}
            className={`game-card ${locked ? "locked" : ""}`}
        >
            <div className="card-top">
                <span className={`game-icon ${g.color}`}>
                    <GameIcon id={g.id} />
                </span>
                {status === "Completed" ? (
                    <Check size={18} className="green-text" />
                ) : locked ? (
                    <Lock size={15} />
                ) : (
                    <ArrowUpRight size={17} />
                )}
            </div>
            <span className="game-tag">{g.tag}</span>
            <h3>{g.name}</h3>
            <p>{g.subtitle}</p>
            <div className="card-bottom">
                <span>
                    <Clock size={12} />
                    {g.time} min
                </span>
                <span>
                    {locked
                        ? "Complete a lesson"
                        : status === "Completed"
                            ? "Play again"
                            : `+${(questions[g.id]?.length ?? 0) * 30} XP`}
                </span>
            </div>
        </Link>
    );
}
