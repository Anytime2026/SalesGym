from app.utils.audio import normalize_recording_for_playback, pcm16le_to_wav


def test_pcm16le_to_wav_has_riff_header() -> None:
    pcm = b"\x00\x01" * 100
    wav = pcm16le_to_wav(pcm)
    assert wav[:4] == b"RIFF"
    assert wav[8:12] == b"WAVE"
    assert len(wav) == 44 + len(pcm)


def test_normalize_recording_wraps_legacy_pcm_as_wav() -> None:
    pcm = b"\x00\x00" * 160
    body, media_type = normalize_recording_for_playback(pcm)
    assert media_type == "audio/wav"
    assert body[:4] == b"RIFF"


def test_normalize_recording_keeps_wav() -> None:
    wav = pcm16le_to_wav(b"\x00\x00" * 8)
    body, media_type = normalize_recording_for_playback(wav)
    assert body == wav
    assert media_type == "audio/wav"
