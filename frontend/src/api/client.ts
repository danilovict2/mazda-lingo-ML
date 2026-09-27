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
};
const base = (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_URL || "";
async function request<T>(
    path: string,
    options: { method?: "GET" | "POST" | "DELETE"; body?: unknown } = {},
): Promise<T> {
    if (!tokenProvider) throw new Error("Please sign in to continue.");
    const token = await tokenProvider();
    const res = await fetch(`${base}${path}`, {
        method: options.method || "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(res.status === 401 ? "Your session expired. Please sign in again." : "Unable to complete the request. Please try again.");
    return (await res.json()) as T;
}
export const api = {
    analyze: (text: string, difficulty: string) =>
        request<Analysis>("/api/analyze-speech", { method: "POST", body: { text, difficulty } }),
    placement: (correct: number, total: number) =>
        request<{ level: string; progress: Progress }>("/api/placement-test", {
            method: "POST", body: { correct, total },
        }),
    session: (game: string, correct: number, total: number, attemptId: string) =>
        request<{ xp: number; progress: Progress }>("/api/session", {
            method: "POST", body: { game, correct, total, attemptId },
        }),
    saveStudio: (score: number, attemptId: string) =>
        request<{ xp: number; progress: Progress }>("/api/studio-session", {
            method: "POST", body: { score, attemptId },
        }),
    progress: () => request<Progress>("/api/progress"),
    resetProgress: () => request<Progress>("/api/progress", { method: "DELETE" }),
};
