# Code Review Prompt

Use when reviewing code changes.

```
Review these changes for Just In Time.

Check against:
- .ai/architecture/PATTERNS.md (code patterns)
- No frameworks, no build step, vanilla JS only
- EventBus for inter-system communication
- DOM interaction only in UIManager
- Constants from core/constants.js
- Game content tone (Fallout + Infocom humor)

For each issue: severity (Critical/Warning/Suggestion), location, what's wrong, how to fix.
```
