"""Score a user's recording against a pre-generated ElevenLabs reference clip.

The reference comes from frontend/src/generated/audio.json (made by
scripts/generate_audio.py). The recording's words and timings come from
ElevenLabs speech-to-text. Both are measured with speech_features.
"""

import difflib
import math
import re
import statistics

import numpy as np

import speech_features as sf


class NoSpeech(ValueError):
    pass


def _norm(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def _clamp(v: float) -> int:
    return max(0, min(100, round(v)))


def _corr(a: list[float], b: list[float]) -> float:
    if len(a) < 2 or np.std(a) == 0 or np.std(b) == 0:
        return 0.0
    return float(np.corrcoef(a, b)[0, 1])


def _dur(w: dict) -> float:
    return max(0.01, w["end"] - w["start"])


def _strongest_syllable(ref: dict, x: np.ndarray, rate: int, word: dict) -> dict:
    """Which reference syllable the speaker stressed in their own recording.

    The reference syllables are laid over the user's word in proportion. Each
    one's strength adds up loudness x pitch squared over its voiced frames, so
    longer, louder and higher syllables all count as stressed.
    """
    sylls = ref["syllables"]
    ref_start, ref_end = ref["words"][0]["start"], ref["words"][-1]["end"]
    span = _dur(word)
    floor = sf.voicing_floor(x)

    def strength(s: dict) -> float:
        a = word["start"] + (s["start"] - ref_start) / (ref_end - ref_start) * span
        b = word["start"] + (s["end"] - ref_start) / (ref_end - ref_start) * span
        step = 0.01
        return sum(
            sf.rms(x, rate, t - step / 2, t + step / 2) * sf.pitch_at(x, rate, t, floor) ** 2
            for t in np.arange(a, b, step)
        )

    return max(sylls, key=strength)


def score(ref: dict, x: np.ndarray, rate: int, heard: list[dict]) -> dict:
    ref_words = ref.get("scoring_words") or ref["words"]
    user = [{"text": w["text"], "start": w["start"], "end": w["end"]} for w in heard]
    if not user:
        raise NoSpeech("We couldn't hear any words. Check your microphone and try again.")
    levels = [sf.rms(x, rate, w["start"], w["end"]) for w in user]
    for w, level in zip(user, levels):
        w["loudness"] = level / (max(levels) or 1)
        w["pitch"] = sf.word_pitch(x, rate, w["start"], w["end"])
        c = sf.windows(x, rate, w["start"], w["end"], len(ref_words[0]["contour"]))
        w["contour"] = [v / (max(c) or 1) for v in c]

    matcher = difflib.SequenceMatcher(
        a=[_norm(w["text"]) for w in ref_words], b=[_norm(w["text"]) for w in user], autojunk=False
    )
    pairs = [(i + k, j + k) for i, j, n in matcher.get_matching_blocks() for k in range(n)]
    # One shared word ("you", "the") isn't an attempt at this text.
    if len(pairs) < max(1, 0.3 * len(ref_words)):
        raise NoSpeech("That didn't sound like the practice text. Try reading it again.")
    refs = [ref_words[i] for i, _ in pairs]
    mine = [user[j] for _, j in pairs]

    clarity = _clamp(100 * len(pairs) / len(ref_words))

    # Rhythm: does each word take the same share of the phrase as in the reference?
    if len(pairs) >= 2:
        rs, us = sum(map(_dur, refs)), sum(map(_dur, mine))
        shares = [(_dur(r) / rs, _dur(u) / us) for r, u in zip(refs, mine)]
        spread = 0.5 * sum(abs(a - b) for a, b in shares)
        rhythm = _clamp(100 * (1 - 2 * spread))
    else:
        rhythm = _clamp(100 - 60 * abs(math.log(_dur(mine[0]) / _dur(refs[0]))))

    # Word stress: does the loudness rise and fall inside each longer word match?
    longer = [(r, u) for r, u in zip(refs, mine) if sf.syllable_count(r["text"]) >= 2]
    word_stress = _clamp(
        50 + 50 * statistics.mean(_corr(r["contour"], u["contour"]) for r, u in longer or zip(refs, mine))
    )

    # Sentence stress: do the same words stand out as in the reference?
    ref_prom = sf.prominence(refs)
    my_prom = sf.prominence(mine)
    if len(pairs) >= 3:
        logs = lambda ps: [math.log(max(p, 1e-3)) for p in ps]  # noqa: E731
        sentence_stress = _clamp(50 + 50 * _corr(logs(ref_prom), logs(my_prom)))
    else:
        sentence_stress = word_stress

    scores = {
        "wordStress": word_stress,
        "rhythm": rhythm,
        "clarity": clarity,
        "sentenceStress": sentence_stress,
    }
    overall = round(0.3 * word_stress + 0.25 * rhythm + 0.2 * clarity + 0.25 * sentence_stress)
    return {
        "overallScore": overall,
        **scores,
        "feedback": _feedback(ref, ref_words, scores, refs, mine, ref_prom, my_prom, pairs, x, rate),
        "transcript": " ".join(w["text"] for w in heard),
        "simulated": False,
    }


def _feedback(ref, ref_words, scores, refs, mine, ref_prom, my_prom, pairs, x, rate) -> list[str]:
    notes = []
    best = max(scores, key=scores.get)
    notes.append(
        {
            "clarity": f"Great clarity: we understood {len(pairs)} of {len(ref_words)} words.",
            "rhythm": "Your timing closely follows the reference rhythm.",
            "wordStress": "Your stress inside words matches the reference well.",
            "sentenceStress": "You emphasized the same words as the reference. Nice.",
        }[best]
    )

    if ref.get("syllables") and len(mine) == 1:
        target = next(s for s in ref["syllables"] if s["stressed"])
        said = _strongest_syllable(ref, x, rate, mine[0])
        pattern = "-".join(s["text"].upper() if s["stressed"] else s["text"] for s in ref["syllables"])
        if said is target:
            notes.append(f"Your strongest beat landed on “{target['text']}”, exactly right: {pattern}.")
        else:
            notes.append(
                f"Your strongest beat landed on “{said['text']}”. Move it to “{target['text']}”: {pattern}."
            )
    elif len(mine) >= 3:
        k = int(np.argmax(ref_prom))
        rank = sorted(range(len(my_prom)), key=lambda i: -my_prom[i]).index(k)
        word = refs[k]["text"]
        if rank <= 1:
            notes.append(f"You gave “{word}” the main stress, just like the reference.")
        else:
            notes.append(f"Give “{word}” more energy. It carries the main stress in the reference.")

    matched = {i for i, _ in pairs}
    missing = [w["text"] for i, w in enumerate(ref_words) if i not in matched]
    if missing:
        quoted = ", ".join(f"“{w}”" for w in missing[:3])
        notes.append(f"We didn't catch {quoted}. Try saying {'it' if len(missing) == 1 else 'them'} a little more clearly.")
    elif len(mine) >= 2:
        rs, us = sum(map(_dur, refs)), sum(map(_dur, mine))
        ratios = [
            (_dur(u) / us) / (_dur(r) / rs) if _dur(r) >= 0.15 else math.inf
            for r, u in zip(refs, mine)
        ]
        i = int(np.argmin(ratios))
        if ratios[i] < 0.6:
            notes.append(f"You rushed “{refs[i]['text']}”. Give it a little more time.")
    return notes
