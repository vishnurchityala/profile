---
title: Daily Blog: Multi-Model SQL Agent Architecture
date: 2026-03-25
tags: LangChain, Gemini, SQL, Streamlit
summary: Short note on the architecture I am planning for the multi-model SQL agent.
---

# Multi-Model SQL Agent Architecture

After uploading `sql-gemma3`, the next step I am planning is a small multi-model SQL app.

![Multi-model SQL agent architecture](blogs/img/multi-model-sql-agent.png)

The architecture is simple:

- `gemini-3-flash-preview` reads the uploaded `context.md`
- Gemini converts that markdown into a clean schema summary
- Python validates that summary and keeps it in typed objects
- `vishnurchityala/sql-gemma3` only does SQL generation
- a sanitizer checks that the output is one read-only SQL query
- Streamlit is used as the local UI

## Why split the work

I do not want one model doing everything.

Gemini is better for reading messy markdown and pulling out tables, columns, relationships, and rules. `sql-gemma3` is only used after that step, once the context is already cleaned up.

That means the SQL model gets a smaller and more structured prompt, which should make the output easier to debug and more reliable.

## Request flow

The app flow is:

1. Upload `context.md`
2. Gemini summarizes it into structured schema data
3. Python validates and stores that summary
4. User asks a question
5. `sql-gemma3` generates SQL
6. sanitizer checks the output
7. Streamlit shows only the final SQL

## Main idea

This version is still local-first and simple. No live database execution, no full agent loop, and no automatic repair step.

The goal is just to keep the architecture clean:

- Gemini for context understanding
- SQL-Gemma for query generation
- Python for validation and guardrails

That is the current plan.

_Updated: March 25, 2026_
