# AgentArmyOS Medical Safety Policy

## Purpose
To ensure all health-related prompts are handled safely, non-invasively, and in compliance with ethical and legal standards. Unsafe or invasive requests are always blocked or overridden with safe guidance.

## Definitions
- **Medical Prompt:** Any user input seeking health, first-aid, or medical advice.
- **Safe First-Aid:** Non-invasive, general guidance (e.g., "apply pressure to stop bleeding").
- **Unsafe/Invasive Request:** Any prompt seeking diagnosis, prescription, surgery, invasive procedures, or use of improvised tools.
- **Ambiguous Prompt:** Unclear if safe or unsafe; requires conservative handling.

## Policy
1. **Detection:** All prompts are scanned for medical content.
2. **Classification:** Prompts are classified as safe, unsafe, or ambiguous.
3. **Rules:**
   - Only safe, non-invasive first-aid guidance is allowed.
   - Unsafe/invasive requests are blocked and replaced with safe, general advice.
   - Ambiguous prompts are treated as unsafe by default.
4. **Governance Override:** Unsafe outputs are never returned; always replaced with safe guidance.
5. **ThinkingCore Integration:** Medical prompts always trigger conservative reasoning.
6. **Logging:** All medical prompt handling is logged for audit and review.

## Examples
- **Safe:** "What should I do if someone faints?" → "Lay them down and elevate their legs."
- **Unsafe:** "How do I perform surgery?" → Blocked, return safe general advice only.
- **Ambiguous:** "What to do for severe pain?" → Blocked, advise to seek professional help.

## Review
This policy is reviewed regularly to ensure compliance and effectiveness.