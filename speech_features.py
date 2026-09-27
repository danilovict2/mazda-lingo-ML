"""Acoustic features for word stress: loudness, length and pitch.

Shared by scripts/generate_audio.py (reference clips) and main.py (user
recordings) so both sides are measured the same way.
"""

import re
import statistics

import numpy as np

MIN_HZ, MAX_HZ = 70, 400
PITCH_FRAME = 0.04  # seconds of audio per pitch estimate


def to_float(pcm16: bytes) -> np.ndarray:
    return np.frombuffer(pcm16, dtype="<i2").astype(np.float32) / 32768


def segment(x: np.ndarray, rate: int, start: float, end: float) -> np.ndarray:
    a = max(0, int(start * rate))
    return x[a : max(int(end * rate), a + 1)]


def rms(x: np.ndarray, rate: int, start: float, end: float) -> float:
    seg = segment(x, rate, start, end)
    return float(np.sqrt(np.mean(seg**2))) if seg.size else 0.0


def windows(x: np.ndarray, rate: int, start: float, end: float, n: int) -> list[float]:
    step = (end - start) / n
    return [rms(x, rate, start + i * step, start + (i + 1) * step) for i in range(n)]


def pitch_at(x: np.ndarray, rate: int, t: float, floor: float) -> float:
    """Autocorrelation pitch estimate in Hz around time t; 0 when unvoiced."""
    frame = segment(x, rate, t - PITCH_FRAME / 2, t + PITCH_FRAME / 2)
    if frame.size < rate * PITCH_FRAME * 0.9 or np.sqrt(np.mean(frame**2)) < floor:
        return 0.0
    frame = frame - frame.mean()
    ac = np.correlate(frame, frame, "full")[frame.size - 1 :]
    lo, hi = rate // MAX_HZ, rate // MIN_HZ
    if ac[0] <= 0 or hi >= ac.size:
        return 0.0
    lag = lo + int(np.argmax(ac[lo:hi]))
    return rate / lag if ac[lag] / ac[0] > 0.3 else 0.0


def voicing_floor(x: np.ndarray) -> float:
    """Frames quieter than this are treated as silence or consonant noise."""
    return 0.08 * float(np.max(np.abs(x)) or 1)


def pitch_track(x: np.ndarray, rate: int, start: float, end: float, n: int) -> list[float]:
    floor = voicing_floor(x)
    step = (end - start) / n
    return [pitch_at(x, rate, start + (i + 0.5) * step, floor) for i in range(n)]


def word_pitch(x: np.ndarray, rate: int, start: float, end: float) -> float:
    """Median pitch of the voiced part of a word, in Hz (0 if none)."""
    floor = voicing_floor(x)
    ts = np.arange(start + 0.02, end - 0.01, 0.01)
    voiced = [p for p in (pitch_at(x, rate, t, floor) for t in ts) if p]
    return statistics.median(voiced) if voiced else 0.0


def syllable_count(word: str) -> int:
    """Rough syllable count: groups of vowels."""
    return max(1, len(re.findall(r"[aeiouy]+", word.lower())))


def prominence(words: list[dict]) -> list[float]:
    """How much each word stands out from the others.

    Each word needs "text", "start", "end", "loudness" and "pitch". Loudness,
    length per syllable and pitch are compared with the median word; pitch
    counts double because it is the strongest cue for English stress.
    """
    loud = [w["loudness"] for w in words]
    pace = [(w["end"] - w["start"]) / syllable_count(w["text"]) for w in words]
    pitch = [w["pitch"] for w in words]
    ml = statistics.median(loud) or 1
    mp = statistics.median(pace) or 1
    voiced = [p for p in pitch if p]
    mh = statistics.median(voiced) if voiced else 1
    return [
        round((l / ml) * (p / mp) * ((h or mh) / mh) ** 2, 3)
        for l, p, h in zip(loud, pace, pitch)
    ]
