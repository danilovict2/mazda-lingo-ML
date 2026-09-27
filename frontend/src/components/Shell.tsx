import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "./LogoutButton";
import type React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Flame,
    Zap,
    RotateCcw,
    ChartNoAxesCombined,
    House,
} from "lucide-react";
import { initialProgress } from "../data";
import { Logo } from "../components/Logo";
import { useProgress } from "../state/ProgressProvider";

function TopPanel() {
    const { progress } = useProgress();
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
                <span className="avatar">JD</span>
            </div>
        </div>
    );
}

export function Shell({ children }: { children: React.ReactNode }) {
    const { user } = useAuth0();
    const name = user?.name || user?.email || "Learner";
    const initials = name.slice(0, 2).toUpperCase();
    const { progress, setProgress } = useProgress();
    const location = useLocation();

    return (
        <div className="app-shell" style={{ display: "block", minHeight: "100vh", width: "100%" }}>
            <div className="main-shell" style={{ marginLeft: 0, width: "100%", maxWidth: "1350px", margin: "0 auto", padding: "0 24px" }}>
                <header className="topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid #ebe8f5" }}>
                    
                    {/* Left: Brand Logo & Overview Link */}
                    <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
                        <Logo />
                        <nav style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <Link
                                to="/dashboard"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "8px 14px",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    fontSize: "14px",
                                    textDecoration: "none",
                                    color: location.pathname === "/dashboard" ? "#724ae8" : "#6d6b7d",
                                    backgroundColor: location.pathname === "/dashboard" ? "#f1edfb" : "transparent",
                                }}
                            >
                                <House size={16} /> Overview
                            </Link>
                        </nav>
                    </div>

                    {/* Right: Speech Profile Button, Streak, XP, Reset & Avatar */}
                    <div className="top-stats" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <Link
                            to="/progress"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 14px",
                                borderRadius: "12px",
                                backgroundColor: location.pathname === "/progress" ? "#ece7fa" : "#f7f6fc",
                                border: "1px solid #ebe8f5",
                                color: location.pathname === "/progress" ? "#724ae8" : "#4b465c",
                                textDecoration: "none",
                                fontWeight: 800,
                                fontSize: "13.5px",
                            }}
                        >
                            <ChartNoAxesCombined size={18} color="#8365d6" />
                            <span>Speech profile</span>
                        </Link>
                    ))}
                </nav>
                <div className="sidebar-tip">
                    <div className="mini-orbit">
                        <AudioLines size={26} />
                    </div>
                    <h4>
                        A little practice.
                        <br />A big difference.
                    </h4>
                    <p>Five minutes today, a more confident you tomorrow.</p>
                    <Link to="/game/shape-your-sound">
                        Find your voice <ArrowUpRight size={15} />
                    </Link>
                </div>
                <div className="sidebar-bottom">
                    <LogoutButton />
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
                        <span className="avatar">{initials}</span>
                        <div>
                            <strong>{name}</strong>
                            <small>Your voice, in progress</small>
                        </div>
                        <span className="online-dot" />
                    </div>
                </div>
            </aside>
            <div className="main-shell">
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

                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                            <Flame size={18} className="orange" /> 7 <small>day streak</small>
                        </span>

                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                            <Zap size={18} className="violet" /> {progress.xp} <small>XP</small>
                        </span>
                        <span className="avatar small">{initials}</span>
                    </div>
                </header>
                <main>{children}</main>
                <footer>
                    <span>Lingo © 2026</span>

                        <button
                            title="Reset demo progress"
                            onClick={() => {
                                if (window.confirm("Reset all demo progress?")) {
                                    setProgress(initialProgress);
                                    window.location.href = "/";
                                }
                            }}
                            style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                padding: "6px",
                                borderRadius: "8px",
                                color: "#8a8599",
                            }}
                        >
                            <RotateCcw size={16} />
                        </button>

                        <span className="avatar small">JD</span>
                    </div>
                </header>

                <main style={{ marginTop: "24px" }}>{children}</main>

                <footer style={{ marginTop: "48px", paddingBottom: "24px", textAlign: "center", color: "#8a8599", fontSize: "13px" }}>
                    Made for your voice. Built for your confidence.
                    <span style={{ marginLeft: "12px" }}>cadence © 2026</span>
                </footer>
            </div>
        </div>
    );
}