import clips from "./generated/audio.json";

/** Timing and loudness data for one pre-generated ElevenLabs clip. */
export type ClipMeta = {
    duration: number;
    words: { text: string; start: number; end: number }[];
    syllables?: { text: string; start: number; end: number; stressed: boolean }[];
    envelope: { start: number; end: number; values: number[]; pitch: number[] };
};

export function clipMeta(id?: string): ClipMeta | undefined {
    return id ? (clips as Record<string, ClipMeta>)[id] : undefined;
}

export function clipUrl(id: string) {
    return `${import.meta.env.BASE_URL}audio/${id}.wav`;
}

/** Index of the word being spoken at `time` seconds, or -1 between phrases. */
export function activeWord(meta: ClipMeta | undefined, time: number | null) {
    if (!meta || time === null) return -1;
    let i = -1;
    while (i + 1 < meta.words.length && meta.words[i + 1].start <= time) i++;
    return i >= 0 && time <= meta.words[i].end + 0.3 ? i : -1;
}
