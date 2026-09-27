import { useAuth0 } from "@auth0/auth0-react";
import type React from "react";
import { Link } from "react-router-dom";
import { Flame, Zap } from "lucide-react";
import LogoutButton from "./LogoutButton";
import { useProgress } from "../state/ProgressProvider";

function TopPanel() {
    const { progress } = useProgress();
    const { user } = useAuth0();
    const name = user?.name || user?.email || "Learner";
    return (
        <div className="top-panel">
            <Link to="/dashboard" className="project-name">
                Lingo
            </Link>
            <div className="top-panel-right">
                <span className="streak">
                    <Flame size={16} className="orange" /> 7
                </span>
                <span className="xp">
                    <Zap size={16} className="violet" /> {progress.xp}
                </span>
                <Link to="/progress" className="top-link">
                    Profile
                </Link>
                <LogoutButton />
                <Link to="/progress" className="avatar" title={`${name} · Speech profile`}>
                    {name.slice(0, 2).toUpperCase()}
                </Link>
            </div>
        </div>
    );
}

export function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-shell">
            <div className="main-shell">
                <TopPanel />
                <main>{children}</main>
                <footer>
                    <span>Lingo © 2026</span>
                </footer>
            </div>
        </div>
    );
}
