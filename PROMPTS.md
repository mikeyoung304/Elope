# Prompts

## How we use Claude Code (MCP)

We run prompts in small phases (A→L). After each, we run typecheck and commit.

If a step fails, re‑run the same prompt with: "fix and continue".

## Prompt sequence (short index)

- **2A** Split core → contracts + add shared
- **2B** Fill contracts/shared
- **3** API skeleton (http/domains/adapters/di)
- **4** Mock adapters + DI switch
- **5** Dev simulator routes
- **6** Web scaffold
- **7** Mock checkout wiring
- **8** Admin MVP
- **9** Tests & CI
- **10** Real adapters stubs & env docs

(See chat log for full prompt texts — we'll keep updating this file as we go.)
