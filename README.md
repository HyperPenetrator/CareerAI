# CareerCompass AI

CareerCompass AI is a containerized full-stack web application designed to guide users to ranked, AI-generated career paths, featuring detailed match reasons, skills-gap analysis, and actionable roadmaps.

## Architecture

- **Frontend:** React (Vite) app styling with custom Vanilla CSS Bento Grid layout, providing step-by-step wizard forms and consuming AI streams using Server-Sent Events (SSE).
- **Backend:** FastAPI app receiving user inputs, assembling a structured system and user message context, and streaming Anthropic Claude 3.5 Sonnet outputs over a `POST /api/recommend` SSE pipeline.
- **Infrastructure:** Docker and Terraform setup to build, test locally, and run on AWS App Runner.

## Getting Started

### Local Development (Direct)

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Set ANTHROPIC_API_KEY=your_key in your shell or .env
   uvicorn app.main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Local Development (Docker)

1. Copy `.env.example` to `.env` and enter your Anthropic API Key:
   ```bash
   cp .env.example .env
   ```
2. Build and start containers:
   ```bash
   docker-compose up --build
   ```

## Deployment

Refer to the `terraform/` directory for provisioning AWS ECR and App Runner services.
