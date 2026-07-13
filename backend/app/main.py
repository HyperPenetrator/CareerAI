import os
import json
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from app.services.gemini import GeminiService

from app.services.linkedin import build_linkedin_jobs_url

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CareerCompass AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

gemini_service = GeminiService()

@app.get("/api/linkedin-url")
async def linkedin_url(title: str, location: str = "Remote"):
    url = build_linkedin_jobs_url(title, location)
    return {"url": url}

@app.post("/api/recommend")
async def recommend(request: Request):
    questionnaire = await request.json()
    logger.info(f"Received questionnaire request via POST: {questionnaire}")

    async def event_generator():
        try:
            async for chunk in gemini_service.get_career_recommendations_stream(questionnaire):
                yield f"data: {json.dumps({'text': chunk})}\n\n"
        except Exception as e:
            logger.error(f"Error in generation: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# Mount static files to serve the frontend React application on the root / route
static_dir = "/app/static"
if not os.path.exists(static_dir):
    # Fallback to local frontend build directory if it exists (for local dev without container)
    local_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
    if os.path.exists(local_dist):
        static_dir = local_dist
    else:
        # Create a dummy static folder so FastAPI does not crash
        static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../static"))
        os.makedirs(static_dir, exist_ok=True)

logger.info(f"Mounting StaticFiles from: {static_dir}")
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
