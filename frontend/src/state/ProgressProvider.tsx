import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { initialProgress, type Progress } from "../data";

const ProgressContext = createContext<{
    progress: Progress;
    setProgress: Dispatch<SetStateAction<Progress>>;
}>({ progress: initialProgress, setProgress: () => {} });

export const useProgress = () => useContext(ProgressContext);

export function ProgressProvider({ children }: { children: ReactNode }) {
    const [progress, setProgress] = useState<Progress>(() => {
        try {
            const raw = localStorage.getItem("cadence-progress");
            if (raw) {
                const p = JSON.parse(raw);
                if (
                    typeof p.xp === "number" &&
                    Array.isArray(p.completed) &&
                    Array.isArray(p.sessions)
                )
                    return { ...initialProgress, ...p };
            }
        } catch { }
        return initialProgress;
    });
    useEffect(() => {
        try {
            localStorage.setItem("cadence-progress", JSON.stringify(progress));
        } catch { }
    }, [progress]);
    return (
        <ProgressContext.Provider value={{ progress, setProgress }}>
            {children}
        </ProgressContext.Provider>
    );
}
