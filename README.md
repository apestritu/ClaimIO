# 🏥 ClaimIO

**AI-powered insurance claim processing with multi-agent orchestration**

Built with [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/),
Agent-to-Agent (A2A) communication, and Model Context Protocol (MCP).

![Python](https://img.shields.io/badge/Python-3.12-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![OpenAI](https://img.shields.io/badge/OpenAI-Agents_SDK-green)

## What It Does

ClaimIO processes travel insurance claims end-to-end using a pipeline of
specialized AI agents. Each agent handles a specific step — from document
ingestion and OCR to coverage analysis and payment — with full observability
in a real-time dashboard.

## Quick Start

### Prerequisites
- Docker & Docker Compose **or** Python 3.12+ / Node.js 20+
- OpenAI API key

### Docker Compose (recommended)
```bash
cp backend/.env.example backend/.env   # add your OPENAI_API_KEY
docker compose up --build
```

Open http://localhost:3000, select a case, and watch the agents work.

### Manual

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install .
cp .env.example .env  # add your OPENAI_API_KEY
uvicorn server:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000, select a case, and watch the agents work.

## Architecture

```
Frontend (Next.js) ←── SSE ──→ FastAPI Backend
                                  ├── Orchestrator
                                  ├── 9 Specialized Agents (OpenAI Agents SDK)
                                  ├── A2A Event Bus (in-memory)
                                  └── MCP Document Store (stdio)
```

## Demo Cases

| Case | Scenario | Expected Outcome |
|------|----------|-----------------|
| ShowCase1 | Baggage delay — Paris trip | Approved (~$400-600) |
| ShowCase2 | Trip cancellation — medical | Approved (variable) |

## Built With

- **OpenAI Agents SDK** — Agent, Runner, handoffs, function tools, MCP
- **A2A Protocol** — Simulated agent-to-agent task messaging
- **MCP** — Document store server for claim file access
- **FastAPI** — Async Python backend with SSE streaming
- **Next.js 15** — React 19 frontend with real-time visualization
- **TailwindCSS** — OpenAI-inspired dark theme UI

---

*Built during a hackathon with [OpenAI Codex](https://openai.com/codex).*
