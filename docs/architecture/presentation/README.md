# Presentation ledger

Communication diagrams are accepted views redrawn for one audience, following architect-base's `presentation.md`. The Structurizr model stays the truth. A row here says which view and model commit a redraw was checked against. A row goes stale when its source view changes; re-check it by hand and re-date it, or remove it.

| Artefact | Source view | Model commit | Audience | Checked | Used in |
|---|---|---|---|---|---|
| Mermaid flowchart "Who uses Hopin" | Context | dd0b063 | Everyone on GitHub | 2026-09-19: same elements and arrows; descriptions shortened; laid out top to bottom | [Root README](../../../README.md#the-architecture-in-four-diagrams) |
| Mermaid sequence "Partner isolation" | PartnerIsolation | dd0b063 | CTO, engineer | 2026-09-19: same five steps and participants | [Root README](../../../README.md#the-architecture-in-four-diagrams) |
| Mermaid flowchart "Azure account recovery" | AccountRecovery | dd0b063 | CTO, operator | 2026-09-19: same elements and arrows; the replacement identity is marked amber as the known gap, which the view states in text only | [Root README](../../../README.md#the-architecture-in-four-diagrams) |
| Mermaid sequence "Dispute assistant" | DisputeAssist | dd0b063 | Stakeholder, CTO | 2026-09-19: same seven steps; step 7 is drawn as a reply from AI Assist, where the model has a request from Admin Web | [Root README](../../../README.md#the-architecture-in-four-diagrams) |

Each Mermaid block carries an HTML comment naming its source view and model commit. Mermaid lays the diagrams out itself, so they are checked for content, not geometry. For the checked layout, see the architecture PDF.

Sequence-diagram messages must not contain semicolons: Mermaid treats one as the end of a statement and fails to parse the rest.
