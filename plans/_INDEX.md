# ROVE Chatbot Agent - Development Plan

> **What is this file:** The index of all plan documents for building the ROVE chatbot. These plans follow the Plan and Solve framework and are designed to be executed by an AI-assisted IDE (AntiGravity, Cursor, Claude Code). Each Sub-Plan contains atomic tasks with verifiable success criteria.

---

## Prerequisites

Before starting execution, make sure you have read:

1. `docs/01_Master_Brief.md` — what we are building
2. `docs/02_Risk_and_Constraints.md` — risks and constraints
3. `.antigravity/rules.md` — code rules for the IDE

## Plan Documents

| # | File | Content | Estimated Time |
|---|------|---------|---------------|
| 01 | `01_Master_Plan.md` | 6-sprint roadmap with objectives, verifiable outputs, dependencies and risks | Read: 5 min |
| 02 | `02_Sub_Plan_Sprint_1.md` | Foundation + Chat Shell — Next.js project + chat UI + hardcoded API | ~30 min |
| 03 | `03_Sub_Plan_Sprint_2.md` | KB + LLM Integration — KB loading + single Discovery agent via LLM | ~45 min |
| 04 | `04_Sub_Plan_Sprint_3.md` | Manager Agent + Routing — double LLM call + automatic routing | ~45 min |
| 05 | `05_Sub_Plan_Sprint_4.md` | All Agents + Vertical KBs — Sales, Support, full routing test | ~30 min |
| 06 | `06_Sub_Plan_Sprint_5.md` | Streaming + Polish — streaming responses, UX, welcome message, error handling | ~45 min |
| 07 | `07_Sub_Plan_Sprint_6.md` | Deploy to Vercel — build, deploy, env vars, smoke test | ~30 min |

**Total estimated time:** ~3 hours 45 minutes (15 min buffer on a 4-hour window)

## Execution Order

```
Sprint 1 (Foundation)
    |
Sprint 2 (KB + LLM)
    |
Sprint 3 (Manager + Routing)
    |
Sprint 4 (All Agents)
    |
Sprint 5 (Streaming + Polish)
    |
Sprint 6 (Deploy)
```

Each sprint depends on the completion of the previous one. Do not skip sprints. Do not execute sprints in parallel.

## How to Use These Plans with the IDE

1. Open a new session in the IDE (AntiGravity, Cursor, etc.)
2. Make sure `.antigravity/rules.md` is present in the project root
3. Provide the IDE with the Brief (`docs/01_Master_Brief.md`) as context
4. Copy the Sub-Plan for the current sprint and paste it as the instruction
5. The IDE executes tasks in the indicated order, one at a time
6. Verify each success criterion before moving to the next task
7. When all tasks in the sprint are completed, move to the next Sub-Plan
