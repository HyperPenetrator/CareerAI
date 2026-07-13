import asyncio
import json
import logging
from typing import AsyncGenerator

from google import genai
from google.genai import types
from app.config import settings

logger = logging.getLogger(__name__)

# Model priority list — fallback if primary is overloaded (503)
MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"]
MAX_RETRIES = 3
RETRY_DELAY  = 2.0   # seconds between retries (doubles each attempt)


class GeminiService:
    def __init__(self):
        self.api_key = settings.gemini_api_key

    async def get_career_recommendations_stream(self, questionnaire: dict) -> AsyncGenerator[str, None]:
        skills     = ", ".join(questionnaire.get("skills", []))
        interests  = ", ".join(questionnaire.get("interests", []))
        education  = questionnaire.get("education", "Not specified")
        experience = questionnaire.get("experience", "Not specified")
        risk       = questionnaire.get("riskTolerance", "Moderate")

        # workStyle can be a list (new 6-step form) or a plain string (legacy)
        raw_ws     = questionnaire.get("workStyle", [])
        work_style = ", ".join(raw_ws) if isinstance(raw_ws, list) else str(raw_ws)

        # Geolocation metadata
        loc_data = questionnaire.get("location", {})
        loc_name = loc_data.get("name") or "National Average"
        lat = loc_data.get("latitude")
        lon = loc_data.get("longitude")
        loc_details = f"{loc_name} (Coordinates: {lat}, {lon})" if lat and lon else loc_name

        # ── Mock mode (no API key configured) ──────────────────────────────
        if not self.api_key:
            mock_json = {
                "recommendations": [
                    {
                        "title": f"Full-Stack Software Engineer ({work_style or 'Remote'} Preferred)",
                        "matchScore": 94,
                        "rationale": (
                            f"Your background with {skills or 'technical skills'} and passion for "
                            f"{interests or 'technology'} maps directly onto product engineering. "
                            f"The {work_style or 'flexible'} work-style and {risk} risk tolerance confirm "
                            "a strong fit with established tech companies."
                        ),
                        "skillsGap": ["Cloud Deployment (AWS / GCP)", "CI/CD pipeline setup", "System design fundamentals"],
                        "firstStep": "Build and deploy one full-stack project end-to-end and publish it on GitHub with a clear README.",
                        "targetPositions": ["Junior Web Developer", "Frontend Architect", "Backend Systems Engineer"],
                        "topPayingCompanies": ["Google", "Stripe", "Atlassian"],
                        "salaryRange": f"£48,000 - £75,000 (Localized for {loc_name})"
                    },
                    {
                        "title": "AI/ML Solutions Engineer",
                        "matchScore": 88,
                        "rationale": (
                            f"Your skills in {skills or 'programming'} combined with interest in "
                            f"{interests or 'technology'} make building LLM-powered applications a natural progression. "
                            f"Your {experience} of experience means you can transition into applied AI without starting from scratch."
                        ),
                        "skillsGap": ["Python ML ecosystem (PyTorch / HuggingFace)", "Prompt engineering & RAG patterns", "Vector database basics"],
                        "firstStep": "Complete the fast.ai Practical Deep Learning course and integrate a small Gemini-powered feature into an existing project.",
                        "targetPositions": ["Applied AI Engineer", "MLOps Engineer", "Generative AI Architect"],
                        "topPayingCompanies": ["OpenAI", "Anthropic", "Meta"],
                        "salaryRange": f"£65,000 - £95,000 (Localized for {loc_name})"
                    },
                    {
                        "title": "Technical Product Manager",
                        "matchScore": 79,
                        "rationale": (
                            f"Your blend of {skills or 'analytical skills'} and interest in "
                            f"{interests or 'business'} lets you bridge engineering and product strategy. "
                            f"A {risk} risk profile suits the stable, high-leverage PM career track well."
                        ),
                        "skillsGap": ["User story mapping", "OKR / roadmap frameworks", "Stakeholder communication"],
                        "firstStep": "Take the Google PM Certificate and draft a product spec for your current or a hypothetical side project.",
                        "targetPositions": ["Associate Product Manager", "Technical PM", "Director of Product Management"],
                        "topPayingCompanies": ["Microsoft", "Amazon", "Uber"],
                        "salaryRange": f"£55,000 - £85,000 (Localized for {loc_name})"
                    }
                ]
            }
            json_str   = json.dumps(mock_json, indent=2)
            chunk_size = 15
            for i in range(0, len(json_str), chunk_size):
                yield json_str[i:i + chunk_size]
                await asyncio.sleep(0.04)
            return

        # ── Live Gemini mode ────────────────────────────────────────────────
        client = genai.Client(api_key=self.api_key)

        system_prompt = (
            "You are a senior career counselor and occupational psychologist with 20 years of experience.\n"
            "Analyse the user's structured profile and recommend exactly 3 to 5 realistic, specific career paths.\n\n"
            "SCORING RULES — matchScore must be a genuine integer between 60 and 98:\n"
            "  • 90–98 : near-perfect alignment — skills, education, work-style, and interests all match strongly.\n"
            "  • 80–89 : strong fit — most factors align, minor skill gaps present.\n"
            "  • 70–79 : good fit — solid foundation, some upskilling needed.\n"
            "  • 60–69 : reasonable fit — transferable skills apply but a meaningful transition is required.\n"
            "  Never output a score below 60 (only recommend paths where the person could realistically succeed).\n"
            "  Never output a score above 98 (no path is a perfect 100% match).\n"
            "  The top recommendation should score ≥ 85 unless the profile is genuinely weak.\n\n"
            "QUALITY RULES:\n"
            "  • Recommend real, specific job titles — not vague or generic labels.\n"
            "  • Each rationale must explicitly reference the user's specific skills, interests, and work-style.\n"
            "  • skillsGap must list 2–5 concrete, learnable skills the person still needs for this path.\n"
            "  • firstStep must be one actionable sentence the user can begin this week.\n"
            "  • targetPositions must list 2-3 specific roles or titles matching this path.\n"
            "  • topPayingCompanies must list 2-3 top hiring/compensating companies for this path.\n"
            "  • salaryRange must be an estimated annual salary range (e.g. £45,000 - £65,000 or $80,000 - $110,000) localized explicitly for the user's target geographic area/coordinates if provided. If not provided, fallback to the national average. Explicitly mention the location name in the string.\n"
            "  • Respect the risk tolerance: Low → stable established roles; Moderate → growth roles at established companies; High → startup / freelance / entrepreneurial paths.\n\n"
            "OUTPUT FORMAT — return ONLY valid JSON, no markdown fences, no extra prose:\n"
            "{\n"
            "  \"recommendations\": [\n"
            "    {\n"
            "      \"title\": \"string\",\n"
            "      \"matchScore\": integer between 60 and 98,\n"
            "      \"rationale\": \"2–3 sentences referencing the user's specific skills, interests, and work-style\",\n"
            "      \"skillsGap\": [\"string\", \"string\"],\n"
            "      \"firstStep\": \"single actionable sentence\",\n"
            "      \"targetPositions\": [\"string\", \"string\"],\n"
            "      \"topPayingCompanies\": [\"string\", \"string\"],\n"
            "      \"salaryRange\": \"string\"\n"
            "    }\n"
            "  ]\n"
            "}"
        )

        user_message = (
            f"User career profile:\n"
            f"- Education:       {education}\n"
            f"- Experience:      {experience}\n"
            f"- Skills:          {skills}\n"
            f"- Interests:       {interests}\n"
            f"- Work-Style:      {work_style}\n"
            f"- Risk Tolerance:  {risk}\n"
            f"- Location Context:{loc_details}\n\n"
            f"Apply the scoring rubric and quality rules from your instructions to recommend 3–5 best-fit career paths for this person."
        )

        # ── Retry loop across models ────────────────────────────────────────
        last_error = None
        for model in MODELS:
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    logger.info(f"Calling Gemini model={model} attempt={attempt}")
                    response = client.models.generate_content_stream(
                        model=model,
                        contents=user_message,
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt,
                            response_mime_type="application/json",
                            temperature=0.65
                        )
                    )
                    # Stream chunks back to the caller
                    for chunk in response:
                        if chunk.text:
                            yield chunk.text
                    return  # success — exit all retry loops

                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    is_transient = any(code in err_str for code in ["503", "500", "429", "overloaded", "unavailable", "rate"])
                    logger.warning(f"Gemini error (model={model}, attempt={attempt}): {e}")

                    if is_transient and attempt < MAX_RETRIES:
                        delay = RETRY_DELAY * (2 ** (attempt - 1))  # 2s, 4s, 8s
                        logger.info(f"Transient error — retrying in {delay}s…")
                        await asyncio.sleep(delay)
                    else:
                        break  # non-transient or max retries reached — try next model

            logger.warning(f"All retries exhausted for model={model}, trying next model…")

        # All models and retries failed
        logger.error(f"Gemini permanently failed: {last_error}")
        yield json.dumps({
            "error": (
                f"Gemini API is temporarily unavailable (503 / rate limit). "
                f"Please wait a moment and try again. Detail: {last_error}"
            )
        })
