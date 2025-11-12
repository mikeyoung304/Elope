---
description: Run linting and formatting checks
tags: [code-quality, lint, format]
---

# Lint and Format Code

Run ESLint and Prettier to check and fix code quality issues.

## Steps:

1. Run ESLint with auto-fix:

   ```bash
   npm run lint -- --fix
   ```

2. Run Prettier for formatting:

   ```bash
   npm run format
   ```

3. Display any remaining issues that need manual fixes:

   ```bash
   npm run lint
   ```

4. If you want to check formatting without fixing:
   ```bash
   npm run format:check
   ```

## Notes:

- ESLint handles code quality and best practices
- Prettier handles code formatting (indentation, spacing, etc.)
- Auto-fix will resolve most issues automatically
- Some issues may require manual intervention
- Run this before committing code

## Workspace-specific linting:

- Server only: `npm run lint --workspace=server`
- Client only: `npm run lint --workspace=client`
