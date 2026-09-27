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
    body: unknown,
): Promise<T> {
    const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error("API unavailable");
    return (await res.json()) as T;
}
export const api = {
    analyze: (text: string, difficulty: string) =>
        request<Analysis>("/api/analyze-speech", { text, difficulty }),
    placement: (correct: number, total: number) =>
        request<{ level: string }>("/api/placement-test", { correct, total }),
    session: (game: string, correct: number, total: number) =>
        request<{ xp: number }>("/api/session", { game, correct, total }),
};
