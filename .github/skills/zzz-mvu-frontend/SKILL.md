---
name: zzz-mvu-frontend
description: 'Workflow for creating or updating frontend features using MVU architecture, Zod, and ZZZ aesthetics. Use this when the user asks to create a new UI page, component, or panel frontend.'
argument-hint: 'UI feature name or description'
---

# ZZZ MVU Frontend Development Workflow

This skill provides a standardized, multi-step process for generating frontend components and pages that fit the "Zenless Zone Zero" styled role-playing chat application.

## Goals & Philosophy
- **Predictability:** Strictly enforce Model-View-Update (MVU).
- **Aesthetics:** Adhere to the retro-futuristic, urban, bold UI ZZZ styling.
- **Modularity:** Separate types (Zod), logic (EJS/Reducers), and presentation (TSX).
- **Immersion:** Embed mobile UI elements in an isolated `iframe` and connect global interactions to the bottom system panel.

## Development Procedure

Whenever requested to build or modify a frontend feature, strictly follow these steps in order:

### Step 1: Data Modeling (Model / Zod)
Define the state and the action schemas before writing any UI code.
1. Identify the minimal state needed for the feature.
2. Write a `Zod` schema for the State model.
3. Write `Zod` schemas for all explicitly allowed Actions (events/intentions).
*(Never mutate state directly in a React functional component. All interactions must be serialized as Actions).*

### Step 2: Logic Handling (Update)
Create the reducer or update loop.
1. Implement an `update(state, action)` function that returns the new state.
2. If there are side effects (like external EJS template fetching or backend API calls), separate them from the pure state transformations.

### Step 3: View Construction (View / TSX)
Build the visual representation safely.
1. Create a `*.tsx` file that receives `state` and a `dispatch` function as props.
2. Bind UI events exclusively to the `dispatch` function.
3. Ensure appropriate CSS variables (matching the ZZZ app theme) are used. Maintain a bold, high-contrast, urban visual style.

### Step 4: Integration (iframe & Bottom Panel)
1. If the component represents the main "phone/device" area (like the Inter-Knot), wrap it in an `iframe` component to encapsulate its styling.
2. Setup the necessary message passing (`window.postMessage` or similar global context) if the iframe needs to communicate with the application's Bottom System Panel.

## Quality Checklist
- [ ] Is all state validated by Zod schemas?
- [ ] Does the UI dispatch actions instead of mutating state locally?
- [ ] Are ZZZ-themed CSS variables/classes used?
- [ ] Is the code split modularly (Types, Update Logic, View)?
- [ ] Is mobile UI safely sandboxed in an iframe (if applicable)?