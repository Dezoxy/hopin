# Hopin

*Hop in. Get there.* A ride-hailing app for short city trips in Hungary: a passenger app for iOS, Android and web, a driver app, an admin web, and a backend on AWS.

**Status: planning.** No application code exists yet. The plan, architecture and regulatory research are the current deliverables.

## Start here

- [docs/hopin-plan.md](docs/hopin-plan.md) — the master plan and roadmap.
- [docs/architecture/README.md](docs/architecture/README.md) — architecture, decisions and views.
- [docs/compliance/s002-regulatory-memo.md](docs/compliance/s002-regulatory-memo.md) — what Hungarian law requires.

## Repository layout

```text
.agents/skills/     agent skills (mirror of .claude/skills)
.claude/            Claude Code skills and ECC language rules
.github/workflows/  docs consistency and architecture PDF workflows
docs/               plan, architecture knowledge base, compliance research
scripts/            docs consistency check, architecture PDF tooling
AGENTS.md           agent instructions (identical to CLAUDE.md)
CLAUDE.md           agent instructions
Makefile            architecture model and docs commands (`make` lists them)
```

Application code (`apps/`, `packages/`) and infrastructure (`infra/`) arrive with plan steps S010 and S014.

## Checks

```bash
make docs     # documentation consistency
make check    # Structurizr model validate + inspect (needs Docker)
```

Both run in CI on every pull request. `main` accepts changes only through pull requests.
