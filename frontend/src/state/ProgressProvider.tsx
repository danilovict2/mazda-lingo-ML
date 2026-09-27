import {
    createContext,
    useContext,
    useEffect,
    useState,
    type Dispatch,
    type ReactNode,
    type SetStateAction,
} from "react";
import { initialProgress, type Progress } from "../data";

// Helper: Format a Date as "YYYY-MM-DD"
function toDateKey(date: Date = new Date()): string {
    return date.toISOString().split("T")[0];
}

// Helper: Calculate level dynamically from XP
export function getLevelFromXp(xp: number): string {
    if (xp < 150) return "Beginner · Level 1";
    if (xp < 400) return "Elementary · Level 2";
    if (xp < 800) return "Intermediate · Level 3";
    if (xp < 1400) return "Advanced · Level 4";
    return "Master · Level 5";
}

// Helper: Calculate streak based on last active date and today's date
function evaluateStreak(lastDateStr?: string, currentStreak = 0): { streak: number; lastActiveDate?: string } {
    if (!lastDateStr) {
        return { streak: 0, lastActiveDate: undefined };
    }

    const today = new Date();
    const todayKey = toDateKey(today);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday);

    if (lastDateStr === todayKey) {
        // Practiced today: streak is maintained
        return { streak: Math.max(1, currentStreak), lastActiveDate: todayKey };
    } else if (lastDateStr === yesterdayKey) {
        // Practiced yesterday: streak intact, waiting for today's session
        return { streak: Math.max(1, currentStreak), lastActiveDate: lastDateStr };
    } else {
        // Missed more than 1 day: streak resets
        return { streak: 0, lastActiveDate: undefined };
    }
}

// Helper: Update progress with accurate streak and level when new activity happens
export function syncProgressMetadata(prev: Progress, updated: Progress): Progress {
    const todayKey = toDateKey();
    const hasNewSession = updated.sessions.length > prev.sessions.length;

    let streak = prev.streak ?? 0;
    let lastActiveDate = prev.lastActiveDate;

    if (hasNewSession) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = toDateKey(yesterday);

        if (lastActiveDate === yesterdayKey) {
            streak += 1;
        } else if (lastActiveDate !== todayKey) {
            streak = 1;
        }
        lastActiveDate = todayKey;
    }

    const dynamicLevel = getLevelFromXp(updated.xp);

    return {
        ...updated,
        streak,
        lastActiveDate,
        level: dynamicLevel,
    };
}

const ProgressContext = createContext<{
    progress: Progress;
    setProgress: Dispatch<SetStateAction<Progress>>;
}>({ progress: initialProgress, setProgress: () => {} });

export const useProgress = () => useContext(ProgressContext);

export function ProgressProvider({
    children,
    userId,
}: {
    children: ReactNode;
    userId: string;
}) {
    // Versioned key to cleanly bust old mock data without manual localStorage wipes
    const storageKey = `cadence-progress-v2:${userId}`;

    const [progress, setProgressState] = useState<Progress>(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const p = JSON.parse(raw);
                if (
                    typeof p.xp === "number" &&
                    Array.isArray(p.completed) &&
                    Array.isArray(p.sessions)
                ) {
                    const validated = { ...initialProgress, ...p };
                    const { streak, lastActiveDate } = evaluateStreak(
                        validated.lastActiveDate,
                        validated.streak
                    );
                    return {
                        ...validated,
                        streak,
                        lastActiveDate,
                        level: getLevelFromXp(validated.xp),
                    };
                }
            }
        } catch {}

        return {
            ...initialProgress,
            streak: 0,
            lastActiveDate: undefined,
            level: getLevelFromXp(initialProgress.xp || 0),
        };
    });

    // Custom setter that auto-updates streak and level whenever progress changes
    const setProgress: Dispatch<SetStateAction<Progress>> = (action) => {
        setProgressState((prev) => {
            const next = typeof action === "function" ? action(prev) : action;
            return syncProgressMetadata(prev, next);
        });
    };

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(progress));
        } catch {}
    }, [progress, storageKey]);

    return (
        <ProgressContext.Provider value={{ progress, setProgress }}>
            {children}
        </ProgressContext.Provider>
    );
}