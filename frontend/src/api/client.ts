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
    const res = await fetch(`${base}${path}`, {
        method: "POST",
        ...init,
        signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(typeof body?.detail === "string" ? body.detail : "API unavailable");
    }
    return (await res.json()) as T;
}
function request<T>(path: string, body: unknown): Promise<T> {
    return send<T>(path, {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
}

export const api = {
    analyze: (text: string, difficulty: string) =>
        request<Analysis>("/api/analyze-speech", { text, difficulty }),
    analyzeRecording: (audio: Blob, clip: string) => {
        const form = new FormData();
        form.append("clip", clip);
        form.append("audio", audio, "recording.wav");
        // Speech-to-text takes a few seconds, longer for the paragraph.
        return send<Analysis>("/api/analyze-recording", { body: form }, 45000);
    },
    placement: (correct: number, total: number) =>
        request<{ level: string }>("/api/placement-test", { correct, total }),
    session: (game: string, correct: number, total: number) =>
        request<{ xp: number }>("/api/session", { game, correct, total }),
};
