"""Check whether a speaker stressed the intended word(s) in a sentence.

Used by the "Say It Right" game. The recording's words and timings come from
ElevenLabs speech-to-text. Each word's prominence is its loudness plus its
length per syllable, both compared with the speaker's other words in the same
sentence, so voice pitch and speaking speed don't matter. The attempt passes
when the sentence was said and the target words are at least as prominent as
every other content word.

Calibrated on ElevenLabs clips: pitch made results worse (sentence melody
swamps word-level pitch), so it is not used.
"""

import difflib
import re

import numpy as np

import speech_features as sf

# Share of the sentence's words that must be recognised for an attempt to count.
MIN_RECOGNISED = 0.6
# Words that are normally unstressed; they don't compete unless they are a target.
LIGHT = set(
    "a an the to at of in on and or but i me my you your we us it is am are was were "
    "be could would should can will do".split()
)


class NoSpeech(ValueError):
    pass


def words_of(sentence: str) -> list[str]:
    return re.findall(r"[A-Za-z0-9’']+", sentence)


def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def syllables(word: str) -> int:
    """Rough syllable count: vowel groups, minus a silent final e."""
    w = norm(word)
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee")) and n > 1:
        n -= 1
    if w.endswith("ually"):
        n += 1
    return max(1, n)


def zscores(values: list[float]) -> np.ndarray:
    logs = np.log(np.asarray(values) + 1e-6)
    return (logs - np.median(logs)) / (np.std(logs) + 1e-6)


def check_stress(
    x: np.ndarray, rate: int, heard: list[dict], sentence: str, targets: list[str]
) -> dict:
    expected = words_of(sentence)
    goal = {norm(t) for t in targets}
    if not expected or not goal or not goal <= {norm(w) for w in expected}:
        raise ValueError("Target words must come from the sentence")
    if not heard:
        raise NoSpeech("We couldn't hear any words. Check your microphone and try again.")
    transcript = " ".join(w["text"] for w in heard)

    matcher = difflib.SequenceMatcher(
        a=[norm(w) for w in expected], b=[norm(w["text"]) for w in heard], autojunk=False
    )
    pairs = {i + k: j + k for i, j, n in matcher.get_matching_blocks() for k in range(n)}
    recognised = len(pairs) / len(expected)

    # Measure every recognised word in the speaker's own recording.
    measured = []
    for i, j in sorted(pairs.items()):
        w = heard[j]
        measured.append(
            {
                "index": i,
                "text": expected[i],
                "start": w["start"],
                "end": w["end"],
                "rms": sf.rms(x, rate, w["start"], w["end"]),
            }
        )
    # Prominence = loudness + length per syllable, each relative to this speaker.
    prominence = (
        zscores([m["rms"] for m in measured])
        + zscores([(m["end"] - m["start"]) / syllables(m["text"]) for m in measured])
        if measured
        else np.array([])
    )
    by_index = {m["index"]: float(p) for m, p in zip(measured, prominence)}
    lo, hi = min(by_index.values(), default=0), max(by_index.values(), default=1)
    span = (hi - lo) or 1
    words = [
        {
            "text": w,
            "target": norm(w) in goal,
            "heard": i in by_index,
            # 0..1 for display: the weakest heard word is 0, the strongest is 1.
            "prominence": round((by_index[i] - lo) / span, 3) if i in by_index else 0,
        }
        for i, w in enumerate(expected)
    ]
    content = [i for i in by_index if norm(expected[i]) not in LIGHT or norm(expected[i]) in goal]
    ranked = sorted(content or by_index, key=lambda i: -by_index[i])
    strongest = expected[ranked[0]] if ranked else None
    target_idx = [i for i, w in enumerate(expected) if norm(w) in goal]
    missing = [expected[i] for i in target_idx if i not in by_index]
    target_names = " and ".join(f"“{expected[i]}”" for i in target_idx)

    if recognised < MIN_RECOGNISED:
        passed = False
        feedback = "That didn't sound like the whole sentence. Say it from start to finish."
    elif missing:
        passed = False
        feedback = f"We didn't catch “{missing[0]}”. Say it a little more clearly."
    else:
        # Pass when every target is at least as prominent as every other content word.
        rivals = [by_index[i] for i in by_index if i not in target_idx and norm(expected[i]) not in LIGHT]
        passed = all(by_index[i] >= max(rivals, default=float("-inf")) for i in target_idx)
        if passed:
            feedback = f"{target_names} stood out the most. That's the stress you wanted."
        else:
            weakest = min(target_idx, key=lambda i: by_index[i])
            feedback = (
                f"Your strongest word was “{strongest}”. "
                f"Give “{expected[weakest]}” more energy: say it louder and a little longer."
            )
    return {
        "passed": passed,
        "feedback": feedback,
        "transcript": transcript,
        "recognised": round(recognised * 100),
        "strongest": strongest,
        "words": words,
    }
