# Known limitations

- Authentication, RBAC, and production audit controls are not configured; the local operational API must not be exposed publicly as-is.
- CORS is permissive for development and needs an allowlist in deployment.
- SQLite is suitable for a local vertical slice, not concurrent multi-operator deployment; migrate deliberately to one managed relational database before production.
- The classifier and duplicate detector are deterministic text/geospatial heuristics; no image, voice, or ML duplicate model is configured.
- Training data, infrastructure relationships, predictions, weather input, and cascade results are synthetic or user-supplied. They are explicitly labelled and must not be treated as live city intelligence.
- RAG, WebSockets, real GIS boundaries, routing, and budget optimization were intentionally deferred to avoid unsupported dependencies and competing architectures.
