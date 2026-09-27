import type { Progress } from "../data";

let tokenProvider: (() => Promise<string>) | null = null;

export function setTokenProvider(provider: (() => Promise<string>) | null) {
    tokenProvider = provider;
}

export type Analysis = {
    overallScore: number;
    wordStress: number;
    rhythm: number;
    clarity: number;
    sentenceStress: number;
    feedback: string[];
    /** What speech-to-text heard; only present for real recordings. */
    transcript?: string;
    simulated: boolean;
};

const base = import.meta.env.VITE_API_URL || "";

async function send<T>(path: string, init: RequestInit, timeout = 10000): Promise<T> {
    if (!tokenProvider) throw new Error("Please sign in to continue.");
    const token = await tokenProvider();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${base}${path}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(typeof body?.detail === "string" ? body.detail : "API unavailable");
    }
    return (await res.json()) as T;
}

function request<T>(
    path: string,
    options: { method?: "GET" | "POST" | "DELETE"; body?: unknown } = {},
): Promise<T> {
    return send<T>(path, {
        method: options.method || "GET",
        headers: { "Content-Type": "application/json" },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
}

export const api = {
    analyze: (text: string, difficulty: string) =>
        request<Analysis>("/api/analyze-speech", {
            method: "POST",
            body: { text, difficulty },
        }),
    analyzeRecording: (audio: Blob, clip: string) => {
        const form = new FormData();
        form.append("clip", clip);
        form.append("audio", audio, "recording.wav");
        // Speech-to-text takes a few seconds, longer for the paragraph.
        return send<Analysis>(
            "/api/analyze-recording",
            { method: "POST", body: form },
            45000,
        );
    },
    placement: (correct: number, total: number) =>
        request<{ level: string; progress: Progress }>("/api/placement-test", {
            method: "POST",
            body: { correct, total },
        }),
    session: (game: string, correct: number, total: number, attemptId: string) =>
        request<{ xp: number; progress: Progress }>("/api/session", {
            method: "POST",
            body: { game, correct, total, attemptId },
        }),
    saveStudio: (score: number, attemptId: string) =>
        request<{ xp: number; progress: Progress }>("/api/studio-session", {
            method: "POST",
            body: { score, attemptId },
        }),
    progress: () => request<Progress>("/api/progress"),
    resetProgress: () => request<Progress>("/api/progress", { method: "DELETE" }),
};
