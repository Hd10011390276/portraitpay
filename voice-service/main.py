"""
PortraitPay Voice Embedding Microservice — Fallback Edition
Uses MFCC-based embedding (librosa only) when resemblyzer is unavailable.
FastAPI + librosa for voice embedding generation and verification.

Setup:
    pip install fastapi uvicorn librosa scipy numpy python-multipart

Run:
    python -m uvicorn main:app --reload --port 8001

Test:
    python test_local.py
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import librosa
import tempfile
import os
import subprocess
from typing import List

app = FastAPI(title="PortraitPay Voice Service — MFCC Fallback")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

def load_wav(path: str) -> tuple:
    """Load WAV file, return (PCM array, sample_rate)."""
    result = librosa.load(path, sr=16000, mono=True)
    if isinstance(result, tuple):
        audio, sr = result
    else:
        audio = result
        sr = 16000
    return audio.astype(np.float32), sr

def extract_mfcc_embedding(audio: np.ndarray, sr: int, n_mfcc: int = 40, n_mels: int = 80) -> np.ndarray:
    """
    Extract speaker embedding using MFCC + delta features + mean pooling.
    Produces a 120-dim vector (40 MFCC * 3 = 120 from mean + delta + delta-delta).
    """
    # MFCC
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc, n_mels=n_mels)
    # Delta (velocity)
    delta = librosa.feature.delta(mfcc)
    # Delta-delta (acceleration)
    delta2 = librosa.feature.delta(mfcc, order=2)

    # Stack: 40 * 3 = 120 features
    combined = np.vstack([mfcc, delta, delta2])

    # Mean + std pooling across time
    mean = np.mean(combined, axis=1)
    std = np.std(combined, axis=1)

    # Final embedding: 80-dim (40 mean + 40 std)
    embedding = np.concatenate([mean, std])
    return embedding

@app.post("/embed")
def embed_audio(file: UploadFile = File(...)):
    """
    Generate an embedding vector from an uploaded audio file.
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
        audio, sr = load_wav(wav_path)
        duration = len(audio) / float(sr) if float(sr) > 0 else 0.0

        emb = extract_mfcc_embedding(audio, float(sr))
        emb_list = emb.tolist()

        return {
            "embedding": emb_list,
            "duration": round(duration, 2),
            "dimensions": len(emb_list),
        }
    finally:
        os.unlink(in_path)
        if 'wav_path' in locals():
            os.unlink(wav_path)

@app.post("/verify")
def verify_voices(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
):
    """
    Compare two audio files and return similarity score.
    Returns: { "similarity": float, "same_person": bool, "threshold": float }
    """
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
            audio, sr = load_wav(wav_path)
            return extract_mfcc_embedding(audio, float(sr))
        finally:
            os.unlink(in_path)
            if 'wav_path' in locals():
                os.unlink(wav_path)

    emb1 = process(file1)
    emb2 = process(file2)

    # Cosine similarity
    norm1 = np.linalg.norm(emb1)
    norm2 = np.linalg.norm(emb2)
    similarity = float(np.dot(emb1, emb2) / ((norm1 * norm2) + 1e-8))

    # Threshold tuned for MFCC: same speaker ~0.85+, different speaker ~0.65-0.80
    threshold = 0.80
    same_person = similarity > threshold

    return {
        "similarity": round(similarity, 4),
        "same_person": same_person,
        "threshold": threshold,
    }

@app.get("/health")
def health():
    return {"status": "ok", "method": "MFCC-40 + delta/delta-delta + mean/std pooling"}