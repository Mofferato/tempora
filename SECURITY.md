# Security policy

The game itself runs entirely in your browser. The optional platform server (`server/server.js`) stores accounts, passwords and saves, so its security matters.

## Reporting a vulnerability

Please **don't open a public issue** for security problems. Report them privately instead: go to the [Security tab](https://github.com/Mofferato/tempora/security/advisories/new) and choose **Report a vulnerability**.

Include what you found, how to reproduce it and what an attacker could do with it. You can expect a first reply within a week.

## Scope

In scope:

- The platform server: authentication, sessions, saves, the community API and the Claude proxy.
- Anything in the game that could run someone else's code or leak data, for example through shared lives in the community.

Out of scope:

- Changing your own local save or using god mode. Cheating in a single-player game isn't a vulnerability.
- Servers other people run with changed code.

## Running a server safely

- Serve it over HTTPS and set `TEMPORA_SECURE_COOKIES=1`.
- Set `TEMPORA_TRUST_PROXY=1` only when a trusted reverse proxy sets `X-Forwarded-For`.
- Keep `ANTHROPIC_API_KEY` in the environment, never in the code or the data directory, and set `TEMPORA_AI_DAILY` to a limit you can afford.
- Back up the data directory. It holds password hashes, so keep it private.
