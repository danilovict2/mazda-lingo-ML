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

export function Shell({ children }: { children: React.ReactNode }) {
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

                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                            <Flame size={18} className="orange" /> 7 <small>day streak</small>
                        </span>

                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                            <Zap size={18} className="violet" /> {progress.xp} <small>XP</small>
                        </span>

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