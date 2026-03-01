# agentarmy-dashboard

AgentArmy dashboard — React + TypeScript + AI workspace with self-evolving governance.

**Features implemented:**

- Interactive dashboard cards with keyboard accessibility
- ZPE-driven fractal visual with interactive sliders
- AI-powered Taskade-style workspace (Rewrite, Summarize, Plan)
- LLM integration with OpenAI backend (multi-model ready)
- Physics-inspired scoring for model consensus (front-end supports multiple model names; server echoes the model field)
- Prompt management with RBAC & audit trail
- Candidate evolution loop with constitutional governance
- UI RBAC enforcement + server-side validation
- Unit tests + GitHub Actions CI (lint → typecheck → test → build)
- Zustand state management with persistence

## Run locally

### Frontend

```bash
cd agentarmy-dashboard
npm install
npm start
```

If port 3000 is busy:

```powershell
$env:PORT=3001; npm start
```

### Backend (with LLM support)

To enable AI workspace actions (Rewrite, Summarize, Plan), run the backend:

```bash
cd server
npm install
```

Set your OpenAI API key in `server/.env`:

```bash
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_MODEL=gpt-4o-mini
```

Then start the server:

```bash
npm start
```

The frontend reads `REACT_APP_BACKEND_URL` from `.env` (defaults to `http://localhost:4000`).

**Note:** Without `OPENAI_API_KEY` in the server, AI actions will return mock responses (for development).

## Architecture

- **Frontend**: React + TypeScript + Zustand store
- **Backend**: Express.js with `/llm`, `/prompts` endpoints
- **LLM**: OpenAI (configurable via env var)
- **State**: Persisted to localStorage; optional backend sync
- **CI**: GitHub Actions (lint, typecheck, test, build)

## CI status

You can add a GitHub Actions badge for the `CI` workflow once you know your repository path. Replace OWNER and REPO in the URL below with your GitHub account and repo name:

```markdown
![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)
```

## Developer notes

The repository is ready to be pushed to your own remote if desired:

```bash
git remote add origin https://github.com/OWNER/REPO.git
git branch -M main
git push -u origin main
```

Replace `OWNER/REPO` with your GitHub path; ensure you have permission.



- `src/App.tsx` contains the dashboard layout and interactive logic.
- `src/FractalCanvas.tsx` implements a simple fractal-like canvas; it accepts `zpe` and `theme` props to drive visuals.
- Styles are in `src/App.css`.

Next steps

- Add persistent state (backend or localStorage) for jobs/events.
- Enhance FractalCanvas with GPU shaders (WebGL) for richer visuals.
- Replace CRA with Vite for faster dev builds.

Enjoy the prototype — tell me which visual or interaction to iterate on next.
## Learn More
