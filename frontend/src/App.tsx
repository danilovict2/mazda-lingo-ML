import { ProgressProvider } from "./state/ProgressProvider";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Placement } from "./pages/Placement";
import { Lesson } from "./pages/Lesson";
import { Profile } from "./pages/Profile";

export function App() {
    return (
        <ProgressProvider>
            <BrowserRouter>
                <ScrollTop />
                <Routes>
                    {/* Redirect root URL immediately to Dashboard */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/placement" element={<Placement />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/game/:id" element={<LessonKey />} />
                    <Route path="/progress" element={<Profile />} />
                    {/* Fallback any unknown URL back to Dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
        </ProgressProvider>
    );
}

function LessonKey() {
    const { id } = useParams();
    return <Lesson key={id} />;
}

function ScrollTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}