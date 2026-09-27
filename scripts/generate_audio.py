# /// script
# requires-python = ">=3.13"
# dependencies = ["httpx", "numpy"]
# ///
"""Generate reference audio clips with ElevenLabs.

Reads scripts/clips.json and writes:
  frontend/public/audio/<id>.wav        the recording the app plays
  frontend/src/generated/audio.json     word/syllable timings, loudness, pitch
                                        and waveform data used by the games, plus
                                        (for "reference" clips) the word features
                                        the speech-scoring API compares against
Clips whose settings haven't changed since the last run are skipped.

Usage (from the repository root):
    uv run scripts/generate_audio.py                 # generate new or changed clips
    uv run scripts/generate_audio.py word-computer   # regenerate specific clips
    uv run scripts/generate_audio.py --all           # regenerate everything
"""

import base64
import hashlib
import io
import json
import re
import sys
import wave
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import speech_features as sf  # noqa: E402

CLIPS = ROOT / "scripts" / "clips.json"
AUDIO = ROOT / "frontend" / "public" / "audio"
META = ROOT / "frontend" / "src" / "generated" / "audio.json"
RATE = 24000
ENVELOPE_BARS = 72
CONTOUR_POINTS = 12
# {word|syl PH ON / syl PH ON}: a word with an exact, syllable-split pronunciation.
PHONEME_WORD = re.compile(r"\{([^|}]+)\|([^}]+)\}")


def api_key() -> str:
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("ELEVENLABS_API_KEY="):
                return line.split("=", 1)[1].strip().strip("\"'")
    sys.exit("ELEVENLABS_API_KEY not found in .env at the repository root.")


def plain_words(text: str) -> list[str]:
    return [t for t in (re.sub(r"[^\w']", "", w) for w in text.split()) if t]


def parse_text(text: str) -> tuple[str, list[str], list[list[dict] | None]]:
    """Turn clip markup into (text to send, spoken words, syllables per word)."""
    words: list[str] = []
    syllables: list[list[dict] | None] = []
    pos = 0
    for m in PHONEME_WORD.finditer(text):
        for w in plain_words(text[pos : m.start()]):
            words.append(w)
            syllables.append(None)
        sylls = []
        for group in m.group(2).split("/"):
            label, *phones = group.split()
            sylls.append(
                {"text": label, "phones": phones, "stressed": any(p.endswith("1") for p in phones)}
            )
        words.append(m.group(1))
        syllables.append(sylls)
        pos = m.end()
    for w in plain_words(text[pos:]):
        words.append(w)
        syllables.append(None)

    def ssml(m: re.Match) -> str:
        phones = " ".join(p for g in m.group(2).split("/") for p in g.split()[1:])
        return f'<phoneme alphabet="cmu-arpabet" ph="{phones}">{m.group(1)}</phoneme>'

    return PHONEME_WORD.sub(ssml, text), words, syllables


def request_body(config: dict, clip: dict, text: str, seed: int) -> dict:
    return {
        "text": text,
        "model_id": clip.get("model_id", config["model_id"]),
        "seed": seed,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "speed": clip.get("speed", config["speed"]),
        },
    }


def synthesize(key: str, voice_id: str, body: dict) -> tuple[bytes, dict]:
    res = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps",
        params={"output_format": f"pcm_{RATE}"},
        headers={"xi-api-key": key},
        json=body,
        timeout=90,
    )
    if res.status_code != 200:
        raise RuntimeError(f"HTTP {res.status_code}: {res.text}")
    data = res.json()
    return base64.b64decode(data["audio_base64"]), data["normalized_alignment"]


def spoken(ch: str) -> bool:
    return ch.startswith("@") or any(c.isalnum() for c in ch)


def tokens(alignment: dict) -> list[list[tuple[str, float, float]]]:
    """Split the character alignment into whitespace-separated tokens.

    Phoneme words arrive as one entry per phoneme, e.g. "@r", "@eh1", "@k".
    """
    out: list[list[tuple[str, float, float]]] = [[]]
    for ch, s, e in zip(
        alignment["characters"],
        alignment["character_start_times_seconds"],
        alignment["character_end_times_seconds"],
    ):
        if ch.isspace():
            out.append([])
        else:
            out[-1].append((ch, s, e))
    return [t for t in out if any(spoken(c) for c, _, _ in t)]


def normalized(values: list[float]) -> list[float]:
    top = max(values) or 1.0
    return [round(v / top, 3) for v in values]


def analyze(pcm: bytes, alignment: dict, words: list[str], sylls: list) -> dict:
    x = sf.to_float(pcm)
    toks = tokens(alignment)
    if len(toks) != len(words):
        raise RuntimeError(f"alignment has {len(toks)} words, expected {len(words)}")
    out_words = []
    out_sylls = []
    for word, tok, syll in zip(words, toks, sylls):
        letters = [(c, s, e) for c, s, e in tok if spoken(c)]
        start, end = letters[0][1], letters[-1][2]
        out_words.append({"text": word, "start": round(start, 3), "end": round(end, 3)})
        if not syll:
            continue
        phones = [(s, e) for c, s, e in letters if c.startswith("@")]
        expected = sum(len(g["phones"]) for g in syll)
        if len(phones) != expected:
            raise RuntimeError(f"{word}: {len(phones)} phonemes timed, expected {expected}")
        i = 0
        for g in syll:
            span = phones[i : i + len(g["phones"])]
            i += len(g["phones"])
            out_sylls.append(
                {
                    "text": g["text"],
                    "start": round(span[0][0], 3),
                    "end": round(span[-1][1], 3),
                    "stressed": g["stressed"],
                }
            )
    levels = [sf.rms(x, RATE, w["start"], w["end"]) for w in out_words]
    for w, level in zip(out_words, levels):
        w["loudness"] = round(level / (max(levels) or 1), 3)
        w["pitch"] = round(sf.word_pitch(x, RATE, w["start"], w["end"]))
        w["contour"] = normalized(sf.windows(x, RATE, w["start"], w["end"], CONTOUR_POINTS))
    lo = max(0.0, out_words[0]["start"] - 0.05)
    hi = min(len(x) / RATE, out_words[-1]["end"] + 0.08)
    meta = {
        "duration": round(len(x) / RATE, 3),
        "words": out_words,
        "envelope": {
            "start": round(lo, 3),
            "end": round(hi, 3),
            "values": normalized(sf.windows(x, RATE, lo, hi, ENVELOPE_BARS)),
            "pitch": [round(p) for p in sf.pitch_track(x, RATE, lo, hi, ENVELOPE_BARS)],
        },
    }
    if out_sylls:
        meta["syllables"] = out_sylls
    return meta


def wav_bytes(pcm: bytes) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(pcm)
    return buf.getvalue()


def scoring_words(key: str, pcm: bytes) -> list[dict]:
    """Word features measured exactly like the API measures a user's recording.

    Word boundaries come from speech-to-text rather than the TTS alignment, so
    the reference scores (close to) 100 against itself.
    """
    res = httpx.post(
        "https://api.elevenlabs.io/v1/speech-to-text",
        headers={"xi-api-key": key},
        data={"model_id": "scribe_v2", "language_code": "en", "timestamps_granularity": "word"},
        files={"file": ("reference.wav", wav_bytes(pcm), "audio/wav")},
        timeout=90,
    )
    if res.status_code != 200:
        raise RuntimeError(f"speech-to-text HTTP {res.status_code}: {res.text}")
    x = sf.to_float(pcm)
    words = [
        {"text": w["text"], "start": w["start"], "end": w["end"]}
        for w in res.json()["words"]
        if w["type"] == "word"
    ]
    levels = [sf.rms(x, RATE, w["start"], w["end"]) for w in words]
    for w, level in zip(words, levels):
        w["loudness"] = round(level / (max(levels) or 1), 3)
        w["pitch"] = round(sf.word_pitch(x, RATE, w["start"], w["end"]))
        w["contour"] = normalized(sf.windows(x, RATE, w["start"], w["end"], CONTOUR_POINTS))
    return words


def generate(key: str, config: dict, clip: dict) -> tuple[bytes, dict, str]:
    text, words, sylls = parse_text(clip["text"])
    voice_id = clip.get("voice_id", config["voice_id"])
    # "stress" is one word, or a list of words that should be stressed equally.
    targets = clip.get("stress") or []
    targets = [targets] if isinstance(targets, str) else targets
    best: tuple[float, bytes, dict] | None = None
    notes = []
    for take in range(clip.get("takes", 1)):
        body = request_body(config, clip, text, clip.get("seed", config["seed"]) + take)
        pcm, alignment = synthesize(key, voice_id, body)
        meta = analyze(pcm, alignment, words, sylls)
        score = 0.0
        if targets:
            prom = sf.prominence(meta["words"])
            texts = [w["text"].lower() for w in meta["words"]]
            idx = [texts.index(t) for t in targets]
            stressed = [prom[i] for i in idx]
            others = [p for j, p in enumerate(prom) if j not in idx] or [1]
            # How far the weakest stressed word stands above every other word,
            # times how evenly the stressed words match each other (1 = equal).
            balance = min(stressed) / max(stressed)
            score = round(min(stressed) / max(others) * balance, 3)
            notes.append(
                f"take {take + 1}: {score}" + (f" (balance {balance:.2f})" if len(idx) > 1 else "")
            )
        if best is None or score > best[0]:
            best = (score, pcm, meta)
    assert best
    score, pcm, meta = best
    if targets:
        meta["emphasis"] = {"words": targets, "score": score}
    if clip.get("reference"):
        meta["scoring_words"] = scoring_words(key, pcm)
    return pcm, meta, ", ".join(notes)


def signature(config: dict, clip: dict) -> str:
    settings = {k: config[k] for k in ("voice_id", "model_id", "speed", "seed")}
    code = (ROOT / "speech_features.py").read_text()
    return hashlib.sha256(
        json.dumps([settings, clip, RATE, ENVELOPE_BARS, CONTOUR_POINTS, code], sort_keys=True).encode()
    ).hexdigest()


def main() -> None:
    args = sys.argv[1:]
    config = json.loads(CLIPS.read_text())
    AUDIO.mkdir(parents=True, exist_ok=True)
    META.parent.mkdir(parents=True, exist_ok=True)
    meta = json.loads(META.read_text()) if META.exists() else {}
    ids = [c["id"] for c in config["clips"]]
    unknown = [a for a in args if a != "--all" and a not in ids]
    if unknown:
        sys.exit(f"Unknown clip id(s): {', '.join(unknown)}")

    key = api_key()
    made = skipped = failed = 0
    for clip in config["clips"]:
        sig = signature(config, clip)
        path = AUDIO / f"{clip['id']}.wav"
        forced = "--all" in args or clip["id"] in args
        if args and not forced:
            continue
        if not forced and path.exists() and meta.get(clip["id"], {}).get("signature") == sig:
            skipped += 1
            continue
        try:
            pcm, clip_meta, notes = generate(key, config, clip)
        except Exception as e:
            print(f"  failed  {clip['id']}: {e}")
            failed += 1
            continue
        path.write_bytes(wav_bytes(pcm))
        meta[clip["id"]] = {"signature": sig, **clip_meta}
        # Save after every clip so an interrupted run keeps its progress.
        META.write_text(json.dumps(meta, indent=1) + "\n")
        print(f"  created {clip['id']}.wav" + (f"  ({notes})" if notes else ""))
        made += 1

    # Drop entries and files for clips removed from clips.json.
    meta = {k: meta[k] for k in ids if k in meta}
    for f in AUDIO.iterdir():
        if f.stem not in ids or f.suffix != ".wav":
            f.unlink()
    META.write_text(json.dumps(meta, indent=1) + "\n")
    print(f"\n{made} created, {skipped} unchanged, {failed} failed")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
