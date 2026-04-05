---
name: zzz-llm-backend
description: 'Workflow for designing API routes, creating EJS templates, and building backend logic for LLM processing in the ZZZ-themed project. Use when requested to make server APIs or AI interactions.'
argument-hint: 'API endpoint, LLM feature, or backend task name'
---

# ZZZ LLM Backend API Workflow

This skill standardizes the multi-step process for developing, maintaining, and reviewing backend APIs related to LLM, prompt handling, character generation, and system operations in the SillyTavern-like ZZZ project.

## Goals & Philosophy
- **Reliability:** Zod must be used for parsing and type-checking all external inputs (requests) and outputs (responses).
- **Flexibility:** EJS templates must govern prompt assembly and logic formatting.
- **Maintainability:** Backend APIs must be modular, separating transport (Express/Fastify/Server) from business logic (Prompting/LLMs).

## Development Procedure

Follow these steps sequentially when building or modifying backend APIs or LLM flows:

### Step 1: Contract Design (Zod)
Before writing any route handler or logic:
1. Define the `Zod` schemas for the incoming request (`req.body`, `req.query`, `req.params`).
2. Define the `Zod` schema for the expected response structure.
3. Export these schemas to a shared common data or types folder so the frontend (MVU loop) can consume them.

### Step 2: Prompt Scripting (EJS)
If the feature interacts with LLMs or characters (like generating a message, persona, or scenario):
1. Design an `.ejs` template file for assembling the context window or prompt instructions.
2. The template should accept well-defined variables (matching a Zod schema).
3. Create a logic module that loads the EJS template, interpolates the runtime variables, and produces the final string/array of messages for the LLM.

### Step 3: Business Logic Integration
Create the core controller logic isolated from HTTP/Routing concerns.
1. Write an orchestrator function that:
   - Validates input against Zod schema.
   - Triggers the EJS template assembly.
   - Calls the generic LLM/AI service.
   - Formats the response.
2. Return a standardized success/error JSON response object.

### Step 4: API Routing (Server)
Hook the business logic up to the server.
1. Register the route (e.g., `POST /api/chat`, `GET /api/character/:id`) in the server configuration.
2. Ensure top-level error handling catches and responds properly to Zod validation errors.

## Quality Checklist
- [ ] Are both Request and Response data strictly validated using Zod?
- [ ] Are prompt templates separated from code logic using EJS?
- [ ] Is the Zod schema accessible or at least matchable by the Frontend MVU model logic?
- [ ] Are error handling and status codes consistently applied?
- [ ] Has the routing concern been decoupled from the text generation script logic?