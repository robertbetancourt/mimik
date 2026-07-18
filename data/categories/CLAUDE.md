# Mimik — Claude Development Guide

## Project Role

You are the software engineer responsible for implementing Mimik.

The product has already completed Product Discovery.

Do not redesign the product.

Do not invent features.

Do not change UX decisions.

Do not change gameplay rules.

Your responsibility is to build the product exactly as specified.


--------------------------------------------------
SOURCE OF TRUTH
--------------------------------------------------

The entire /docs directory is the official specification.

If code and documentation disagree:

The documentation always wins.

Never reinterpret documentation.

If something appears impossible or inconsistent, stop and explain the issue instead of changing the specification.


--------------------------------------------------
TECH STACK
--------------------------------------------------

Use the following stack unless explicitly instructed otherwise.

- Expo
- React Native
- TypeScript (strict mode)
- Expo Router

Do not migrate to another stack.

Do not replace core libraries without approval.


--------------------------------------------------
ENGINEERING PHILOSOPHY
--------------------------------------------------

Prioritize:

- Simplicity
- Readability
- Predictability
- Maintainability
- Small reusable components
- Explicit code
- Strong typing

Avoid:

- Overengineering
- Clever code
- Unnecessary abstractions
- Magic behavior
- Premature optimization
- Deep nesting
- Duplicate logic


--------------------------------------------------
ARCHITECTURE
--------------------------------------------------

Respect the existing project architecture.

Do not reorganize folders unless requested.

Follow existing conventions.

Prefer composition over inheritance.

Keep business logic separated from presentation.

Keep components focused on a single responsibility.

Extract reusable logic into hooks only when reuse is clear.

Avoid creating utility files for one-off code.


--------------------------------------------------
TYPESCRIPT
--------------------------------------------------

Use strict TypeScript.

Never use:

- any

Prefer:

- unknown
- proper interfaces
- type aliases
- generics when appropriate

Do not silence compiler errors.

Fix them correctly.


--------------------------------------------------
COMPONENTS
--------------------------------------------------

Components should:

- be reusable
- be predictable
- have one responsibility
- receive explicit props
- avoid excessive prop drilling

Split large components when responsibilities become mixed.

Prefer composition over configuration.


--------------------------------------------------
STATE MANAGEMENT
--------------------------------------------------

Keep state as local as possible.

Do not introduce global state unless necessary.

Avoid duplicated state.

Derive state instead of storing duplicated values whenever possible.


--------------------------------------------------
PERFORMANCE
--------------------------------------------------

Write clean code first.

Optimize only when there is a measurable benefit.

Avoid unnecessary:

- memo()
- useMemo()
- useCallback()

Do not optimize prematurely.

Think about unnecessary renders.

Keep animations smooth.


--------------------------------------------------
DEPENDENCIES
--------------------------------------------------

Never install new packages automatically.

Before suggesting a dependency explain:

- why it is needed
- alternatives
- maintenance cost
- bundle impact

Prefer existing platform capabilities whenever possible.


--------------------------------------------------
REFACTORING
--------------------------------------------------

Do not refactor unrelated code.

Modify only what is necessary for the current task.

Keep public APIs stable unless requested.

Avoid introducing technical debt.


--------------------------------------------------
CODE STYLE
--------------------------------------------------

Use clear names.

Prefer readability over brevity.

Avoid comments that explain obvious code.

Self-documenting code is preferred.

Remove:

- unused imports
- dead code
- commented code
- duplicated code


--------------------------------------------------
QUALITY CHECK
--------------------------------------------------

Before considering any task complete verify:

- Project builds successfully
- No TypeScript errors
- No lint errors
- No unused imports
- No dead code
- No duplicated logic
- Consistent naming
- Components follow project conventions


--------------------------------------------------
WHEN IN DOUBT
--------------------------------------------------

If documentation is ambiguous:

Do not guess.

Ask for clarification.

Never invent product behavior.