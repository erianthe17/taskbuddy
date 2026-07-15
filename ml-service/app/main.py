"""TaskBuddy recommendation model service.

Serves the trained Random Forest pipeline (see train_model.py). The /score
contract matches BACKEND_SCHEMA.md §8: 14 raw feature columns per
job–provider pair; all preprocessing happens inside the persisted pipeline.
"""

import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger("uvicorn.error")

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "model" / "rf-a-v1.joblib"))

state: dict = {"pipeline": None, "meta": {}}


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if MODEL_PATH.exists():
        state["pipeline"] = joblib.load(MODEL_PATH)
        meta_path = MODEL_PATH.parent / f"{MODEL_PATH.stem}.meta.json"
        if meta_path.exists():
            state["meta"] = json.loads(meta_path.read_text())
        logger.info(
            "Loaded model %s from %s",
            state["meta"].get("model_version", MODEL_PATH.stem),
            MODEL_PATH,
        )
    else:
        # Fail fast at scoring time, not silently: /score returns 503 and
        # /health reports model_loaded=false until an artifact is provided.
        logger.error("Model artifact not found at %s — run train_model.py", MODEL_PATH)
    yield


app = FastAPI(title="TaskBuddy Recommendation Service", lifespan=lifespan)


def model_version() -> str:
    return state["meta"].get("model_version", MODEL_PATH.stem)


class FeatureRecord(BaseModel):
    """One job–provider pair. Field names must match the training columns exactly
    — the pipeline selects DataFrame columns by name."""

    skills_match: int = Field(ge=0, le=1)
    distance_km: float
    provider_avg_rating: float
    provider_completed_jobs: int
    provider_availability: int = Field(ge=0, le=1)
    job_idle_duration_hrs: float
    provider_response_time_hrs: float
    provider_years_experience: float
    hour_posted: int = Field(ge=0, le=23)
    provider_skill_category: str
    day_of_week: str
    job_urgency: str
    job_description: str
    provider_bio: str


class ScoreRequest(BaseModel):
    records: list[FeatureRecord]


class ScoreResponse(BaseModel):
    model_version: str
    scores: list[float]


@app.get("/health")
def health():
    loaded = state["pipeline"] is not None
    return {
        "status": "ok" if loaded else "degraded",
        "model_loaded": loaded,
        "model_version": model_version() if loaded else None,
        "trained_at": state["meta"].get("trained_at"),
    }


@app.post("/score", response_model=ScoreResponse)
def score(request: ScoreRequest) -> ScoreResponse:
    if state["pipeline"] is None:
        raise HTTPException(
            status_code=503,
            detail="Model artifact not loaded — train and deploy model/rf-a-v1.joblib",
        )
    if not request.records:
        return ScoreResponse(model_version=model_version(), scores=[])

    df = pd.DataFrame([record.model_dump() for record in request.records])
    probabilities = state["pipeline"].predict_proba(df)[:, 1]
    return ScoreResponse(
        model_version=model_version(),
        scores=[round(float(p), 5) for p in probabilities],
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
