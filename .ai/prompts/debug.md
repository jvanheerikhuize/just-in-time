# Debug Prompt

Use when debugging an issue.

```
Debug this issue in Just In Time.

Architecture: .ai/architecture/ARCHITECTURE.md
Known issues: .ai/CONTEXT.md section 2

Problem: [what should happen vs what actually happens]
Steps to reproduce: [steps]
Error (if any): [paste error/console output]

Debug globals available:
- window.game (full game state)
- window.eventBus (subscribe to events)

Trace the data flow through: main.js -> Game -> relevant System -> EventBus -> UIManager
```
