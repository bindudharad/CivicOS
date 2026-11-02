# PHASE 8 SECURITY FINAL REPORT
**CivicOS — Cryptographic Verification, RBAC Enforcement & API Hardening**
*Audit Date: November 2, 2026 | Sign-Off Status: PRODUCTION-READY (LOCAL METRO DEPLOYMENT)*

---

## 1. Cryptographic Authentication & Password Hashing

### Algorithm & Key Derivation Parameters
- **Implementation**: `src/security/auth.py`
- **Algorithm**: Scrypt (RFC 7914) via Python `hashlib.scrypt`
- **Cost Parameters**:
  - CPU/Memory cost ($N$): $2^{14} = 16,384$
  - Block size ($r$): $8$
  - Parallelization ($p$): $1$
  - Salt: 16 cryptographically random bytes generated via `secrets.token_bytes(16)`
- **Storage Format**: `scrypt$<base64(salt + digest)>`
- **Password Verification**: Uses `hmac.compare_digest` to ensure constant-time string comparison, mitigating side-channel timing attacks.
- **Verification Status**: **100% VERIFIED** (Tested across valid passwords, mismatched passwords, malformed hashes, and empty inputs).

---

## 2. Session Management & Bearer Token Invalidation

- **Token Generation**: 32-byte URL-safe cryptographic tokens (`secrets.token_urlsafe(32)` $\approx 256$ bits of entropy).
- **Token Storage**: Plaintext tokens are never stored in the database. Tokens are hashed with SHA-256 (`hashlib.sha256(token).hexdigest()`) before insertion into the `sessions` table.
- **Session Expiry**: Default time-to-live is 480 minutes (8 hours) from generation.
- **Immediate Invalidation (Logout)**: Invoking `POST /api/auth/logout` sets `sessions.revoked_at` to the current UTC timestamp.
- **Rejection of Revoked Sessions**: Any subsequent request presenting a revoked token immediately returns `HTTP 401 Unauthorized: Valid session required`.
- **Verification Status**: **100% VERIFIED** (Tested via automated browser walkthrough and unit regression suites).

---

## 3. Throttling & Brute-Force Rate Limiting

- **Scope**: Scoped per `(client_ip, username)` tuple to prevent denial-of-service across legitimate users sharing network gateways.
- **Window**: 15-minute sliding window.
- **Threshold**: Maximum 5 failed authentication attempts permitted within the window.
- **Enforcement**: The 6th consecutive failed attempt immediately raises `HTTP 429 Too Many Attempts. Try again later`.
- **Successful Login Effect**: Immediately clears cached failed attempts for that user/client pair.
- **Verification Status**: **100% VERIFIED** (Tested in `tests/test_phase6_security.py` and `run_phase8_lifecycle_security_e2e.py`).

---

## 4. Role-Based Access Control (RBAC) Matrix

CivicOS strictly enforces authorization at the FastAPI dependency layer (`require_roles` via `src/security/auth.py`):

| Endpoint / Action | Required Roles | Administrator | Municipal Officer | Department Operator | Viewer | Unauthenticated |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| `GET /api/auth/me` | Valid Session | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY (401)** |
| `POST /api/incidents` (Intake) | `OPERATIONS` | **ALLOW** | **ALLOW** | **ALLOW** | **DENY (403)** | **DENY (401)** |
| `GET /api/incidents` (List) | `VIEWER` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY (401)** |
| `GET /api/work-orders` (Queue) | `VIEWER` | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **DENY (401)** |
| `PATCH .../assign` (Dispatch) | `OFFICERS` | **ALLOW** | **ALLOW** | **DENY (403)** | **DENY (403)** | **DENY (401)** |
| `PATCH .../start` (Field Exec) | `OPERATIONS` | **ALLOW** | **ALLOW** | **ALLOW** | **DENY (403)** | **DENY (401)** |
| `PATCH .../resolve` (Evidence) | `OPERATIONS` | **ALLOW** | **ALLOW** | **ALLOW** | **DENY (403)** | **DENY (401)** |
| Intelligence APIs (Graph/GIS/ML) | Public Analytical | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |

---

## 5. Cross-Origin Resource Sharing (CORS) & Injection Hardening

- **CORS Allowlist**: Configured via environment variable `CIVICOS_ALLOWED_ORIGINS` (defaulting strictly to `http://localhost:8501,http://127.0.0.1:8501`).
- **Disallowed Origins**: Untrusted origins (e.g. `http://evil.example.com`) are rejected during preflight with `HTTP 400 Bad Request`.
- **Input Validation**: All request bodies validated against strict Pydantic v2 models with regex constraints and type enforcement.
- **SQL Injection Prevention**: 100% of database queries use parameterized SQL bindings (`?`). Zero dynamic string formatting into SQL statements.
- **File & Binary Isolation**: The API accepts operator text evidence references only; binary multipart file upload execution vectors are explicitly omitted to prevent arbitrary file upload vulnerabilities.
