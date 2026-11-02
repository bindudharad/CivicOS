# Phase 6 security report

## Closed findings

| Severity | Finding | Resolution | Verification |
|---|---|---|---|
| Critical | Operational API had no authentication/RBAC | SQLite users, scrypt password hashes, opaque expiring Bearer sessions, logout revocation, and backend role dependencies | `test_phase6_security.py` |
| High | Wildcard CORS with credentials | Environment-based explicit origins | Allowed and disallowed preflight tests |
| Medium | Unlimited login guesses | Five failed logins per client/user in 15 minutes | Login throttling test |
| Medium | No lifecycle security audit signal | Login events recorded in lifecycle history | Code + lifecycle tests |

Roles: viewer reads operations; department operator creates/starts/resolves; municipal officer or administrator assigns; administrator is a superset. Authentication is enforced server-side for all operational records. Public analytical endpoints remain intentionally available for the offline demonstration and contain only synthetic reference data.

Remaining: HTTPS, a distributed rate limiter, CSRF protection for cookie sessions (not applicable to Bearer headers), external identity integration, and encrypted backups are deployment responsibilities. Do not use the default local HTTP setup on an untrusted network.
