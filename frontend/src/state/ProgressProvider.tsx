import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { initialProgress, type Progress } from "../data";
import { api } from "../api/client";

const ProgressContext = createContext<{
    progress: Progress;
    setProgress: Dispatch<SetStateAction<Progress>>;
}>({ progress: initialProgress, setProgress: () => {} });

export const useProgress = () => useContext(ProgressContext);

export function ProgressProvider({ children, userId }: { children: ReactNode; userId: string }) {
    const [progress, setProgress] = useState<Progress>(initialProgress);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        let active = true;
        setLoading(true);
        api.progress()
            .then((saved) => active && setProgress(saved))
            .catch((cause: unknown) => {
                if (!active) return;
                const detail = cause instanceof Error ? cause.message : "API unavailable";
                setError(`Could not load your progress: ${detail}`);
            })
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [userId]);
    if (loading) return <main className="auth-screen" role="status">Loading your progress…</main>;
    if (error) return <main className="auth-screen" role="alert"><h1>Unable to load progress</h1><p>{error}</p></main>;
    return (
        <ProgressContext.Provider value={{ progress, setProgress }}>
            {children}
        </ProgressContext.Provider>
    );
}
