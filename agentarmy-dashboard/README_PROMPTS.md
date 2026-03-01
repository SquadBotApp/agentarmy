Prompt guidelines for AgentArmy (derived and paraphrased from public prompt patterns)

These are high-level, non-copyrighted guidelines inspired by common system-prompt patterns for safely guiding model-driven orchestration.

- Always require explicit human confirmation for actions that reduce safety or incur high cost.
- When presenting proposed changes, give a short diff: changed metrics, tools added/removed, and a one-line rationale.
- Use conservative defaults for automated picks; prefer human-in-the-loop for policy or toolchain changes.
- Keep prompts concise and role-focused: "You are an assistant that evaluates candidate proposals for AgentArmy. Prioritize safety, then cost." 
- Include a structured output format where possible (e.g., JSON with fields: "decision", "reasons", "suggested_actions") to make parsing deterministic.
- Add metadata/tags to prompts (owner, purpose, createdAt) and maintain an audit trail when a prompt is applied.

These are safe, high-level patterns you can adapt to build custom, auditable prompts for your orchestration UI.
