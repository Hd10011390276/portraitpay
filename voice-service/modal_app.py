"""
PortraitPay Voice Embedding Microservice — Modal + ECAPA-TDNN
Deployed on Modal GPU infrastructure (free tier eligible).
"""

import modal

app = modal.App("portraitpay-voice-final")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "speechbrain>=1.0.0",
        "torch>=2.0.0",
        "torchaudio>=2.0.0",
        "scipy>=1.11.0",
        "numpy>=1.24.0",
        "python-multipart",
        "fastapi>=0.100.0",
        "uvicorn>=0.23.0",
        index_url="https://pypi.org/simple",
    )
)

MIN_DURATION = 2
MAX_DURATION = 60


@app.cls(image=image, gpu="T4", timeout=600)
class VoiceService:
    _encoder = None

    @modal.enter()
    def initialize(self):
        from speechbrain.inference.speaker import EncoderClassifier
        self._encoder = EncoderClassifier.from_hparams(
            "speechbrain/spkrec-ecapa-voxceleb",
            run_opts={"device": "cuda"},
        )

    @modal.method()
    def embed(self, audio_data: list[float], sample_rate: int = 16000) -> dict:
        import torch
        import numpy as np

        audio = np.array(audio_data, dtype=np.float32)
        duration = len(audio) / float(sample_rate)

        if duration < MIN_DURATION:
            return {"error": f"Recording too short ({duration:.1f}s). Need {MIN_DURATION}s minimum."}
        if duration > MAX_DURATION:
            return {"error": f"Recording too long ({duration:.1f}s). Max {MAX_DURATION}s."}

        waveform = torch.FloatTensor(audio).unsqueeze(0).cuda()
        embedding = self._encoder.encode_batch(waveform).squeeze().cpu().numpy()

        return {
            "embedding": embedding.tolist(),
            "duration": round(duration, 2),
            "dimensions": len(embedding),
        }

    @modal.method()
    def health(self) -> dict:
        return {"status": "ok", "method": "ECAPA-TDNN (192-dim, speechbrain/spkrec-ecapa-voxceleb)"}


# FastAPI app for web endpoints
from fastapi import FastAPI, File, UploadFile, Form, HTTPException

web_app = FastAPI(title="PortraitPay Voice Service")


@web_app.post("/embed")
async def embed_endpoint(file: UploadFile = File(...)):
    """POST /embed — accepts multipart file upload, returns embedding JSON."""
    import tempfile, os, subprocess, numpy as np
    from scipy.io import wavfile

    try:
        suffix = os.path.splitext(file.filename or ".wav")[1] or ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            wav_path = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
            subprocess.run([
                "ffmpeg", "-y", "-i", tmp_path,
                "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", wav_path
            ], check=True, capture_output=True)

            sr, data = wavfile.read(wav_path)
            audio = data.astype(np.float32) / 32768.0
            if len(audio.shape) > 1:
                audio = audio.mean(axis=1)

            service = VoiceService()
            result = service.embed.remote(audio.tolist(), int(sr))
            return result
        finally:
            os.unlink(tmp_path)
            if "wav_path" in locals():
                os.unlink(wav_path)
    except Exception as e:
        return {"error": str(e)}


@web_app.get("/health")
def health_endpoint():
    return {"status": "ok", "method": "ECAPA-TDNN (192-dim, speechbrain/spkrec-ecapa-voxceleb)"}


@app.function(image=image)
@modal.asgi_app()
def web():
    return web_app