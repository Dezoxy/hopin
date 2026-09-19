# Docs

| Document | What it is |
|---|---|
| [executive-summary.md](executive-summary.md) | One-page decision memo: the recommendation, costs and returns, top risks and gates (S121) |
| [retrospective.md](retrospective.md) | What I would do differently, what is still weak, an AI critic's review and what changed, and the next decision (S133) |
| [hopin-pre-plan.md](hopin-pre-plan.md) | The original product idea. Frozen. |
| [hopin-plan.md](hopin-plan.md) | The master plan (build roadmap frozen; Phase 12 portfolio track complete): product scope, stack, roadmap steps S001–S133, open decisions, changelog |
| [architecture/talks/talk-tracks.md](architecture/talks/talk-tracks.md) | How to present the architecture: 3-minute, 15-minute and deep-dive tracks, with [speaker notes](architecture/talks/speaker-notes.md) per view |
| [architecture/README.md](architecture/README.md) | Architecture knowledge base: model and views, ADRs, requirements, security, data, integration, deployment, reliability, observability, risks, roadmap |
| [business/business-case.md](business/business-case.md) | White-label first, Hopin brand second: revenue models, unit economics, break-even, one-month goal |
| [business/three-year-cost-model.md](business/three-year-cost-model.md) | Three-year costs, revenue and results for three scenarios; levers and decision triggers (S120) |
| [business/driver-interview-guide.md](business/driver-interview-guide.md) | Script for the five driver interviews (S117) |
| [architecture/evidence/s123-slice-results.md](architecture/evidence/s123-slice-results.md) | First measurements: thin running slice and load test (S123) |
| [compliance/s002-regulatory-memo.md](compliance/s002-regulatory-memo.md) | Hungarian taxi, tax and data-protection rules for Hopin (2026-09-19, not legal advice) |
| [compliance/ai-act-classification.md](compliance/ai-act-classification.md) | EU AI Act risk class of the four AI use cases, and the boundaries that keep it (2026-09-19, not legal advice) |

Every document under `docs/` must be reachable from this page or from the architecture README. `python3 scripts/check_docs_consistency.py` enforces it.
