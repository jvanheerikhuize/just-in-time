# Security Policy

Just In Time is a single-player, client-side browser game with no server component.

## Threat Model

- **No server-side code** - Nothing to exploit remotely
- **No user accounts** - No credentials to protect
- **No PII collected** - No personal information stored
- **No external API calls** - No data leaves the browser
- **LocalStorage saves** - Save data is local to the browser; tampering only affects the player's own game

## Reporting Issues

If you find a security concern (e.g., XSS via game content), report it via GitHub Issues or contact the maintainer directly.
