import { ProgressProvider } from "./state/ProgressProvider";
import { AuthProvider, RequireAuth } from "./auth/Auth";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
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
                    <Route path="/" element={<Landing />} />
                    <Route path="/placement" element={<Placement />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/game/:id" element={<LessonKey />} />
                    <Route path="/progress" element={<Profile />} />
                    <Route path="*" element={<Navigate to="/" />} />
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
