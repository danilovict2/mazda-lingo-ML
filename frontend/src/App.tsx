import { AuthProvider, RequireAuth } from "./auth/Auth";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams, useLocation, Navigate } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Placement } from "./pages/Placement";
import { Lesson } from "./pages/Lesson";
import { Profile } from "./pages/Profile";

export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ScrollTop />
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route element={<RequireAuth />}>
                        <Route path="/placement" element={<Placement />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/game/:id" element={<LessonKey />} />
                        <Route path="/progress" element={<Profile />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
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
