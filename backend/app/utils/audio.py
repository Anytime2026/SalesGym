import struct

PCM_SAMPLE_RATE = 16000
PCM_CHANNELS = 1
PCM_BITS_PER_SAMPLE = 16


def pcm16le_to_wav(
    pcm: bytes,
    sample_rate: int = PCM_SAMPLE_RATE,
    channels: int = PCM_CHANNELS,
    bits_per_sample: int = PCM_BITS_PER_SAMPLE,
) -> bytes:
    byte_rate = sample_rate * channels * bits_per_sample // 8
    block_align = channels * bits_per_sample // 8
    data_size = len(pcm)
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,
        1,
        channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_size,
    )
    return header + pcm


def normalize_recording_for_playback(data: bytes) -> tuple[bytes, str]:
    if not data:
        return b"", "audio/wav"
    if data[:4] == b"RIFF":
        return data, "audio/wav"
    if data[:4] == b"\x1aE\xdf\xa3":
        return data, "audio/webm"
    return pcm16le_to_wav(data), "audio/wav"
