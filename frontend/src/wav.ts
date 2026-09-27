/**
 * Convert a MediaRecorder recording (webm/mp4, depending on the browser) to a
 * 16 kHz mono 16-bit WAV, the format the scoring API reads.
 */
export async function toWav(recording: Blob, rate = 16000): Promise<Blob> {
    const ctx = new AudioContext();
    let decoded: AudioBuffer;
    try {
        decoded = await ctx.decodeAudioData(await recording.arrayBuffer());
    } finally {
        void ctx.close();
    }
    // Rendering into a 1-channel context at the target rate downmixes and resamples.
    const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * rate), rate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const samples = (await offline.startRendering()).getChannelData(0);

    const view = new DataView(new ArrayBuffer(44 + samples.length * 2));
    const text = (at: number, s: string) =>
        [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
    text(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    text(8, "WAVE");
    text(12, "fmt ");
    view.setUint32(16, 16, true); // format chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true); // bytes per second
    view.setUint16(32, 2, true); // bytes per frame
    view.setUint16(34, 16, true); // bits per sample
    text(36, "data");
    view.setUint32(40, samples.length * 2, true);
    samples.forEach((s, i) => {
        const v = Math.max(-1, Math.min(1, s));
        view.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    });
    return new Blob([view], { type: "audio/wav" });
}
