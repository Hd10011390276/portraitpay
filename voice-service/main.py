"""
PortraitPay Voice Embedding Microservice — ECAPA-TDNN Edition
Uses SpeechBrain ECAPA-TDNN for discriminative speaker embeddings.
Handles MP3/WAV/WebM etc via ffmpeg conversion to WAV.

Setup:
    pip install speechbrain torch torchaudio scipy numpy python-multipart ffmpeg-python

Run:
    python -m uvicorn main:app --reload --port 8001

Test:
    python test_local.py
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import tempfile
import os
import subprocess

app = FastAPI(title="PortraitPay Voice Service — ECAPA-TDNN")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_encoder = None

def get_encoder():
    global _encoder
    if _encoder is None:
        from speechbrain.inference.speaker import EncoderClassifier
        _encoder = EncoderClassifier.from_hparams(
            "speechbrain/spkrec-ecapa-voxceleb",
            run_opts={"device": "cpu"},
        )
    return _encoder


def convert_to_wav(input_path: str) -> str:
    """Convert any audio file to WAV 16kHz mono using ffmpeg."""
    tmp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_wav.close()
    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path,
            "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
            tmp_wav.name
        ], check=True, capture_output=True)
        return tmp_wav.name
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=400, detail=f"Audio conversion failed: {e.stderr.decode()}")


@app.post("/embed")
def embed_audio(file: UploadFile = File(...)):
    """
    Generate a 192-dim speaker embedding via ECAPA-TDNN.
    Returns: { "embedding": [float, ...], "duration": float, "dimensions": int }
    """
    suffix = os.path.splitext(file.filename or ".wav")[1] or ".wav"
    in_fd, in_path = tempfile.mkstemp(suffix=suffix)
    try:
        os.write(in_fd, file.file.read())
        os.close(in_fd)
    except Exception:
        os.close(in_fd)
        raise

    try:
        wav_path = convert_to_wav(in_path)

        # Load WAV with scipy (no librosa dependency, avoids k2/speechbrain import conflict)
        from scipy.io import wavfile
        sr, data = wavfile.read(wav_path)
        audio = data.astype(np.float32) / 32768.0
        if len(audio.shape) > 1:
            audio = audio.mean(axis=1)
        duration = len(audio) / float(sr)

        # Run through ECAPA-TDNN
        import torch
        encoder = get_encoder()
        waveform = torch.FloatTensor(audio).unsqueeze(0)
        embedding = encoder.encode_batch(waveform).squeeze().numpy()
        emb_list = embedding.tolist()

        return {
            "embedding": emb_list,
            "duration": round(duration, 2),
            "dimensions": len(emb_list),
        }
    finally:
        os.unlink(in_path)
        if "wav_path" in locals():
            os.unlink(wav_path)


@app.post("/verify")
def verify_voices(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    """
    Compare two audio files and return similarity score.
    Returns: { "similarity": float, "same_person": bool, "threshold": float }
    """
    from scipy.io import wavfile
    import torch

    def process(file: UploadFile) -> np.ndarray:
        suffix = os.path.splitext(file.filename or ".wav")[1] or ".wav"
        in_fd, in_path = tempfile.mkstemp(suffix=suffix)
        try:
            os.write(in_fd, file.file.read())
            os.close(in_fd)
        except Exception:
            os.close(in_fd)
            raise
        try:
            wav_path = convert_to_wav(in_path)
            sr, data = wavfile.read(wav_path)
            audio = data.astype(np.float32) / 32768.0
            if len(audio.shape) > 1:
                audio = audio.mean(axis=1)
            waveform = torch.FloatTensor(audio).unsqueeze(0)
            encoder = get_encoder()
            return encoder.encode_batch(waveform).squeeze().numpy()
        finally:
            os.unlink(in_path)
            if "wav_path" in locals():
                os.unlink(wav_path)

    emb1 = process(file1)
    emb2 = process(file2)

    similarity = float(np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2) + 1e-8))
    threshold = float(os.environ.get("VOICE_THRESHOLD", "0.80"))
    same_person = similarity > threshold

    return {
        "similarity": round(similarity, 4),
        "same_person": same_person,
        "threshold": threshold,
    }


@app.get("/health")
def health():
    return {"status": "ok", "method": "ECAPA-TDNN (192-dim, speechbrain/spkrec-ecapa-voxceleb)"}