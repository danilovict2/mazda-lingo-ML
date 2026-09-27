import type React from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, ChartNoAxesCombined, ChevronRight, Flame, House, Zap, RotateCcw, Menu } from "lucide-react";
import { initialProgress } from "../data";
import { Logo } from "../components/Logo";
import { useProgress } from "../state/ProgressProvider";

function TopPanel() {
    const { progress } = useProgress();
    return (
        <div className="top-panel">
            <span className="avatar">JD</span>
            <span className="streak">
                <Flame size={16} className="orange" /> 7
            </span>
            <span className="xp">
                <Zap size={16} className="violet" /> {progress.xp}
            </span>
        </div>
    );
}

export function Shell({ children }: { children: React.ReactNode }) {
    const { progress, setProgress } = useProgress();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    return (
        <div className="app-shell">
            <aside className={`sidebar ${open ? "open" : ""}`}>
                <Logo />
                <div className="workspace-label">YOUR PRACTICE SPACE</div>
                <nav>
                    {[
                        { to: "/dashboard", icon: House, label: "Overview" },
                        { to: "/dashboard#path", icon: BookOpen, label: "Learning path" },
                        {
                            to: "/progress",
                            icon: ChartNoAxesCombined,
                            label: "Speech profile",
                        },
                    ].map((item) => (
                        <Link
                            onClick={() => setOpen(false)}
                            key={item.label}
                            to={item.to}
                            className={
                                location.pathname + location.hash === item.to ? "active" : ""
                            }
                        >
                            <item.icon size={20} />
                            {item.label}
                            {item.label === "Learning path" && (
                                <span className="nav-count">7</span>
                            )}
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-bottom">
                    <span className="demo-pill">
                        <i /> DEMO MODE
                    </span>
                    <button
                        className="reset"
                        onClick={() => {
                            if (window.confirm("Reset all demo progress?")) {
                                setProgress(initialProgress);
                                window.location.href = "/";
                            }
                        }}
                    >
                        <RotateCcw size={14} />
                        Reset demo
                    </button>
                    <div className="user">
                        <span className="avatar">JD</span>
                        <div>
                            <strong>Jamie Davis</strong>
                            <small>Your voice, in progress</small>
                        </div>
                        <span className="online-dot" />
                    </div>
                </div>
            </aside>
            <div className="main-shell">
                <TopPanel />
                <header className="topbar">
                    <button
                        className="mobile-menu icon-button"
                        onClick={() => setOpen(!open)}
                        aria-label="Toggle navigation"
                    >
                        <Menu />
                    </button>
                    <span className="breadcrumb">
                        Your workspace <ChevronRight size={14} />{" "}
                        <strong>
                            {location.pathname === "/progress"
                                ? "Speech profile"
                                : location.pathname.startsWith("/game")
                                    ? "Practice studio"
                                    : "Overview"}
                        </strong>
                    </span>
                    <div className="top-stats">
                        <span>
                            <Flame size={18} className="orange" /> 7 <small>day streak</small>
                        </span>
                        <span>
                            <Zap size={18} className="violet" /> {progress.xp}{" "}
                            <small>XP</small>
                        </span>
                        <span className="avatar small">JD</span>
                    </div>
                </header>
                <main>{children}</main>
                <footer>
                    <span>cadence © 2026</span>
                </footer>
            </div>
        </div>
    );
}
