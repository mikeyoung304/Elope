# Elope

Strict TypeScript monorepo for a modular monolith architecture. Build plan follows a mock-first approach: define domain boundaries and contracts upfront through typed interfaces and mock implementations, validate API shapes with tests, then progressively replace mocks with real adapters as features stabilize. This keeps the core domain logic isolated, enables parallel development across modules, and ensures clean architectural boundaries from day one.
